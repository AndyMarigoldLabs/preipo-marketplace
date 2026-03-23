// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/**
 * @title SharesAttestation
 * @author Marketplace Protocol
 * @notice Stores Proof-of-Shares (PoS) certificate hashes and verification
 *         metadata for pre-IPO share listings. This contract holds NO assets
 *         and performs NO custody or execution logic. It serves as an on-chain
 *         attestation registry linking listing identifiers to off-chain share
 *         ownership proofs.
 * @dev Follows the UUPS upgradeable proxy pattern. Actual share verification
 *      is performed off-chain by designated verifiers; this contract records
 *      the resulting attestation data and tracks its lifecycle.
 */
contract SharesAttestation is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    // ──────────────────────────────────────────────────────────────────────
    // Types
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Verification method used for the attestation.
     * @dev Stored as uint8 in the Attestation struct.
     *      0 = DOCUMENT_HASH   – verified by hashing share certificate documents
     *      1 = TRANSFER_AGENT  – verified through a registered transfer agent
     *      2 = ESCROW          – verified via an escrow arrangement
     */
    uint8 public constant METHOD_DOCUMENT_HASH  = 0;
    uint8 public constant METHOD_TRANSFER_AGENT = 1;
    uint8 public constant METHOD_ESCROW         = 2;

    /**
     * @notice On-chain attestation of share ownership for a listing.
     * @param certificateHash  Keccak-256 hash of the share certificate or proof document.
     * @param method           Verification method used (see METHOD_* constants).
     * @param verifier         Address of the entity that verified the attestation.
     * @param verifiedAt       Timestamp when the attestation was marked verified (0 if pending).
     * @param metadataHash     Keccak-256 hash of additional off-chain metadata (e.g. IPFS CID).
     * @param active           Whether the attestation is currently active (not revoked).
     */
    struct Attestation {
        bytes32 certificateHash;
        uint8   method;
        address verifier;
        uint256 verifiedAt;
        bytes32 metadataHash;
        bool    active;
    }

    // ──────────────────────────────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────────────────────────────

    /// @notice Attestation data keyed by listing identifier.
    mapping(bytes32 => Attestation) private _attestations;

    // ──────────────────────────────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Emitted when a new attestation is created for a listing.
     * @param listingId        The listing this attestation belongs to.
     * @param certificateHash  Hash of the share certificate / proof document.
     * @param method           Verification method used.
     * @param metadataHash     Hash of supplementary metadata.
     */
    event AttestationCreated(
        bytes32 indexed listingId,
        bytes32 indexed certificateHash,
        uint8   method,
        bytes32 metadataHash
    );

    /**
     * @notice Emitted when an attestation is marked as verified.
     * @param listingId  The listing whose attestation was verified.
     * @param verifier   Address of the verifying entity.
     * @param verifiedAt Timestamp of verification.
     */
    event AttestationVerified(
        bytes32 indexed listingId,
        address indexed verifier,
        uint256 verifiedAt
    );

    /**
     * @notice Emitted when an attestation is revoked.
     * @param listingId The listing whose attestation was revoked.
     * @param revokedAt Timestamp of revocation.
     */
    event AttestationRevoked(
        bytes32 indexed listingId,
        uint256 revokedAt
    );

    // ──────────────────────────────────────────────────────────────────────
    // Errors
    // ──────────────────────────────────────────────────────────────────────

    /// @notice Thrown when a zero-value hash is supplied where a non-zero hash is required.
    error ZeroHash();

    /// @notice Thrown when the supplied method value is out of the valid range (0-2).
    error InvalidMethod(uint8 method);

    /// @notice Thrown when an attestation already exists for the given listing.
    error AttestationAlreadyExists(bytes32 listingId);

    /// @notice Thrown when no attestation exists for the given listing.
    error AttestationNotFound(bytes32 listingId);

    /// @notice Thrown when the attestation has already been verified.
    error AttestationAlreadyVerified(bytes32 listingId);

    /// @notice Thrown when the attestation is not currently active.
    error AttestationNotActive(bytes32 listingId);

    // ──────────────────────────────────────────────────────────────────────
    // Initializer
    // ──────────────────────────────────────────────────────────────────────

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract, setting the deployer as owner.
     * @dev Called once via the proxy's constructor / initializer call.
     */
    function initialize() external initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __Pausable_init();
    }

    // ──────────────────────────────────────────────────────────────────────
    // External – Owner
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Creates a new share attestation for `listingId`.
     * @dev Only callable by the contract owner. The attestation is created in
     *      an unverified, active state. Call `verifyAttestation` to mark it
     *      as verified.
     * @param listingId        Unique identifier for the listing.
     * @param certificateHash  Keccak-256 hash of the share certificate or proof.
     * @param method           Verification method (0 = DOCUMENT_HASH, 1 = TRANSFER_AGENT, 2 = ESCROW).
     * @param metadataHash     Keccak-256 hash of additional off-chain metadata.
     */
    function createAttestation(
        bytes32 listingId,
        bytes32 certificateHash,
        uint8   method,
        bytes32 metadataHash
    ) external onlyOwner whenNotPaused {
        if (listingId == bytes32(0)) revert ZeroHash();
        if (certificateHash == bytes32(0)) revert ZeroHash();
        if (method > METHOD_ESCROW) revert InvalidMethod(method);
        if (_attestations[listingId].certificateHash != bytes32(0)) {
            revert AttestationAlreadyExists(listingId);
        }

        _attestations[listingId] = Attestation({
            certificateHash: certificateHash,
            method:          method,
            verifier:        address(0),
            verifiedAt:      0,
            metadataHash:    metadataHash,
            active:          true
        });

        emit AttestationCreated(listingId, certificateHash, method, metadataHash);
    }

    /**
     * @notice Marks an existing attestation as verified.
     * @dev Only callable by the contract owner. Records `msg.sender` as the
     *      verifier and the current block timestamp as `verifiedAt`.
     * @param listingId The listing whose attestation should be verified.
     */
    function verifyAttestation(bytes32 listingId) external onlyOwner whenNotPaused {
        Attestation storage att = _attestations[listingId];
        if (att.certificateHash == bytes32(0)) revert AttestationNotFound(listingId);
        if (!att.active) revert AttestationNotActive(listingId);
        if (att.verifiedAt != 0) revert AttestationAlreadyVerified(listingId);

        att.verifier   = msg.sender;
        att.verifiedAt = block.timestamp;

        emit AttestationVerified(listingId, msg.sender, block.timestamp);
    }

    /**
     * @notice Revokes an existing attestation, marking it inactive.
     * @dev Only callable by the contract owner. A revoked attestation cannot
     *      be re-activated; a new attestation must be created if needed.
     * @param listingId The listing whose attestation should be revoked.
     */
    function revokeAttestation(bytes32 listingId) external onlyOwner whenNotPaused {
        Attestation storage att = _attestations[listingId];
        if (att.certificateHash == bytes32(0)) revert AttestationNotFound(listingId);
        if (!att.active) revert AttestationNotActive(listingId);

        att.active = false;

        emit AttestationRevoked(listingId, block.timestamp);
    }

    // ──────────────────────────────────────────────────────────────────────
    // External – Views
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the full attestation record for a listing.
     * @param listingId The listing identifier to look up.
     * @return The stored Attestation struct.
     */
    function getAttestation(bytes32 listingId) external view returns (Attestation memory) {
        return _attestations[listingId];
    }

    /**
     * @notice Returns whether the attestation for `listingId` is verified and active.
     * @param listingId The listing identifier to check.
     * @return True if the attestation exists, is active, and has been verified.
     */
    function isVerified(bytes32 listingId) external view returns (bool) {
        Attestation storage att = _attestations[listingId];
        return att.active && att.verifiedAt != 0;
    }

    // ──────────────────────────────────────────────────────────────────────
    // Admin – Pause / Unpause
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Pauses all state-changing functions.
     * @dev Only callable by the contract owner.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses all state-changing functions.
     * @dev Only callable by the contract owner.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ──────────────────────────────────────────────────────────────────────
    // Internal – UUPS
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @dev Restricts upgrade authorization to the contract owner.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
