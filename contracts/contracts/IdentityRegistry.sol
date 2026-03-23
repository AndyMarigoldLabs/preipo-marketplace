// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/**
 * @title IdentityRegistry
 * @author Marketplace Protocol
 * @notice Stores KYC credential hashes and decentralized identity (DID) mappings
 *         for marketplace participants. This contract holds NO assets and performs
 *         NO custody or execution logic. It serves as an on-chain attestation
 *         registry that maps wallet addresses to off-chain KYC credential hashes.
 * @dev Follows the UUPS upgradeable proxy pattern. All credential verification
 *      is performed off-chain; this contract only stores the resulting hashes
 *      and status flags.
 */
contract IdentityRegistry is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    // ──────────────────────────────────────────────────────────────────────
    // Types
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Credential status values.
     * @dev Stored as uint8 in CredentialRecord.
     *      0 = PENDING   – credential submitted, awaiting verification
     *      1 = VERIFIED  – credential verified by the operator
     *      2 = SUSPENDED – temporarily suspended pending review
     *      3 = FAILED    – verification failed
     */
    uint8 public constant STATUS_PENDING   = 0;
    uint8 public constant STATUS_VERIFIED  = 1;
    uint8 public constant STATUS_SUSPENDED = 2;
    uint8 public constant STATUS_FAILED    = 3;

    /**
     * @notice On-chain record of a user's KYC credential.
     * @param credentialHash  Keccak-256 hash of the off-chain credential payload.
     * @param status          Current verification status (see STATUS_* constants).
     * @param verifiedAt      Timestamp when the credential was marked VERIFIED (0 if not yet).
     * @param expiresAt       Timestamp after which the credential is no longer valid.
     * @param didHash         Keccak-256 hash of the user's decentralized identifier (DID).
     */
    struct CredentialRecord {
        bytes32 credentialHash;
        uint8   status;
        uint256 verifiedAt;
        uint256 expiresAt;
        bytes32 didHash;
    }

    // ──────────────────────────────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────────────────────────────

    /// @notice Credential record for each registered address.
    mapping(address => CredentialRecord) private _credentials;

    // ──────────────────────────────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Emitted when a new credential is registered for a user.
     * @param user            The wallet address the credential belongs to.
     * @param credentialHash  Hash of the off-chain credential payload.
     * @param didHash         Hash of the user's DID.
     * @param expiresAt       Credential expiry timestamp.
     */
    event CredentialRegistered(
        address indexed user,
        bytes32 indexed credentialHash,
        bytes32 didHash,
        uint256 expiresAt
    );

    /**
     * @notice Emitted when a credential's status is updated.
     * @param user      The wallet address whose status changed.
     * @param oldStatus The previous status value.
     * @param newStatus The new status value.
     */
    event StatusUpdated(
        address indexed user,
        uint8   oldStatus,
        uint8   newStatus
    );

    // ──────────────────────────────────────────────────────────────────────
    // Errors
    // ──────────────────────────────────────────────────────────────────────

    /// @notice Thrown when the zero address is supplied for a user parameter.
    error ZeroAddress();

    /// @notice Thrown when a zero-value hash is supplied where a non-zero hash is required.
    error ZeroHash();

    /// @notice Thrown when the supplied status value is out of the valid range (0-3).
    error InvalidStatus(uint8 status);

    /// @notice Thrown when a credential already exists for the given address.
    error CredentialAlreadyExists(address user);

    /// @notice Thrown when no credential exists for the given address.
    error CredentialNotFound(address user);

    /// @notice Thrown when the expiry timestamp is not in the future.
    error InvalidExpiry(uint256 expiresAt);

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
     * @notice Registers a new KYC credential for `user`.
     * @dev Only callable by the contract owner. The credential is stored with
     *      STATUS_PENDING; call `updateStatus` to mark it VERIFIED.
     * @param user            Wallet address of the user.
     * @param credentialHash  Keccak-256 hash of the off-chain credential payload.
     * @param didHash         Keccak-256 hash of the user's DID document.
     * @param expiresAt       Unix timestamp after which the credential expires.
     */
    function registerCredential(
        address user,
        bytes32 credentialHash,
        bytes32 didHash,
        uint256 expiresAt
    ) external onlyOwner whenNotPaused {
        if (user == address(0)) revert ZeroAddress();
        if (credentialHash == bytes32(0)) revert ZeroHash();
        if (didHash == bytes32(0)) revert ZeroHash();
        if (expiresAt <= block.timestamp) revert InvalidExpiry(expiresAt);
        if (_credentials[user].credentialHash != bytes32(0)) {
            revert CredentialAlreadyExists(user);
        }

        _credentials[user] = CredentialRecord({
            credentialHash: credentialHash,
            status:         STATUS_PENDING,
            verifiedAt:     0,
            expiresAt:      expiresAt,
            didHash:        didHash
        });

        emit CredentialRegistered(user, credentialHash, didHash, expiresAt);
    }

    /**
     * @notice Updates the verification status of an existing credential.
     * @dev Only callable by the contract owner. If `status` is set to VERIFIED
     *      the `verifiedAt` timestamp is recorded automatically.
     * @param user   Wallet address whose credential status will be updated.
     * @param status New status value (0-3).
     */
    function updateStatus(address user, uint8 status) external onlyOwner whenNotPaused {
        if (user == address(0)) revert ZeroAddress();
        if (status > STATUS_FAILED) revert InvalidStatus(status);
        if (_credentials[user].credentialHash == bytes32(0)) {
            revert CredentialNotFound(user);
        }

        uint8 oldStatus = _credentials[user].status;
        _credentials[user].status = status;

        if (status == STATUS_VERIFIED) {
            _credentials[user].verifiedAt = block.timestamp;
        }

        emit StatusUpdated(user, oldStatus, status);
    }

    // ──────────────────────────────────────────────────────────────────────
    // External – Views
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns whether `user` has a currently-valid verified credential.
     * @param user Wallet address to check.
     * @return True if the credential status is VERIFIED and the current
     *         block timestamp is before `expiresAt`.
     */
    function isVerified(address user) external view returns (bool) {
        CredentialRecord storage cred = _credentials[user];
        return cred.status == STATUS_VERIFIED && block.timestamp < cred.expiresAt;
    }

    /**
     * @notice Returns the full credential record for `user`.
     * @param user Wallet address to look up.
     * @return The stored CredentialRecord struct.
     */
    function getCredential(address user) external view returns (CredentialRecord memory) {
        return _credentials[user];
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
