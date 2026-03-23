// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import "./IdentityRegistry.sol";

/**
 * @title ListingRegistry
 * @author Marketplace Protocol
 * @notice Stores all active listing metadata for the pre-IPO secondary
 *         marketplace. This contract holds NO assets and performs NO custody
 *         or execution logic. It serves as a permissioned on-chain registry
 *         where KYC-verified sellers can publish share listing metadata.
 * @dev Follows the UUPS upgradeable proxy pattern. Seller identity is validated
 *      against the IdentityRegistry contract before listing creation is allowed.
 */
contract ListingRegistry is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    // ──────────────────────────────────────────────────────────────────────
    // Types
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Listing status values.
     * @dev Stored as uint8 in ListingRecord.
     *      0 = DRAFT     – listing created but not yet published
     *      1 = ACTIVE    – listing is live and visible
     *      2 = EXPIRED   – listing passed its expiry date
     *      3 = CANCELLED – listing cancelled by seller or owner
     *      4 = FLAGGED   – listing flagged for review
     */
    uint8 public constant STATUS_DRAFT     = 0;
    uint8 public constant STATUS_ACTIVE    = 1;
    uint8 public constant STATUS_EXPIRED   = 2;
    uint8 public constant STATUS_CANCELLED = 3;
    uint8 public constant STATUS_FLAGGED   = 4;

    /**
     * @notice On-chain record of a share listing.
     * @param seller            Address of the listing creator / share seller.
     * @param companyHash       Keccak-256 hash of the company identifier.
     * @param shareClass        Numeric share class identifier (e.g., 0 = Common, 1 = Preferred A).
     * @param quantityMin       Minimum number of shares offered.
     * @param quantityMax       Maximum number of shares offered.
     * @param askPriceMin       Minimum ask price per share (in base units, e.g., USDC wei).
     * @param askPriceMax       Maximum ask price per share.
     * @param status            Current listing status (see STATUS_* constants).
     * @param posAttestationId  Identifier linking to the SharesAttestation record.
     * @param createdAt         Timestamp when the listing was created.
     * @param expiresAt         Timestamp after which the listing is considered expired.
     */
    struct ListingRecord {
        address seller;
        bytes32 companyHash;
        uint8   shareClass;
        uint256 quantityMin;
        uint256 quantityMax;
        uint256 askPriceMin;
        uint256 askPriceMax;
        uint8   status;
        bytes32 posAttestationId;
        uint256 createdAt;
        uint256 expiresAt;
    }

    // ──────────────────────────────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────────────────────────────

    /// @notice Listing data keyed by listing identifier.
    mapping(bytes32 => ListingRecord) private _listings;

    /// @notice Reference to the IdentityRegistry used for KYC checks.
    IdentityRegistry public identityRegistry;

    // ──────────────────────────────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Emitted when a new listing is created.
     * @param listingId   Unique identifier for the listing.
     * @param seller      Address of the seller who created the listing.
     * @param companyHash Hash of the company identifier.
     * @param createdAt   Timestamp of creation.
     */
    event ListingCreated(
        bytes32 indexed listingId,
        address indexed seller,
        bytes32 indexed companyHash,
        uint256 createdAt
    );

    /**
     * @notice Emitted when a listing's status is updated.
     * @param listingId  The listing that was updated.
     * @param oldStatus  Previous status value.
     * @param newStatus  New status value.
     * @param updatedBy  Address that triggered the update.
     */
    event ListingUpdated(
        bytes32 indexed listingId,
        uint8   oldStatus,
        uint8   newStatus,
        address indexed updatedBy
    );

    /**
     * @notice Emitted when a listing is cancelled.
     * @param listingId   The listing that was cancelled.
     * @param cancelledBy Address that cancelled the listing.
     * @param cancelledAt Timestamp of cancellation.
     */
    event ListingCancelled(
        bytes32 indexed listingId,
        address indexed cancelledBy,
        uint256 cancelledAt
    );

    // ──────────────────────────────────────────────────────────────────────
    // Errors
    // ──────────────────────────────────────────────────────────────────────

    /// @notice Thrown when a zero-value hash is supplied where a non-zero hash is required.
    error ZeroHash();

    /// @notice Thrown when the caller is not KYC-verified in the IdentityRegistry.
    error SellerNotVerified(address seller);

    /// @notice Thrown when a listing already exists for the given identifier.
    error ListingAlreadyExists(bytes32 listingId);

    /// @notice Thrown when no listing exists for the given identifier.
    error ListingNotFound(bytes32 listingId);

    /// @notice Thrown when the supplied status value is out of the valid range (0-4).
    error InvalidStatus(uint8 status);

    /// @notice Thrown when the caller is not authorized to modify the listing.
    error NotAuthorized(address caller);

    /// @notice Thrown when quantity or price parameters are invalid.
    error InvalidParameters();

    /// @notice Thrown when the expiry timestamp is not in the future.
    error InvalidExpiry(uint256 expiresAt);

    /// @notice Thrown when the identity registry address is zero.
    error ZeroAddress();

    // ──────────────────────────────────────────────────────────────────────
    // Initializer
    // ──────────────────────────────────────────────────────────────────────

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with a reference to the IdentityRegistry.
     * @param identityRegistry_ Address of the deployed IdentityRegistry proxy.
     */
    function initialize(address identityRegistry_) external initializer {
        if (identityRegistry_ == address(0)) revert ZeroAddress();

        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __Pausable_init();

        identityRegistry = IdentityRegistry(identityRegistry_);
    }

    // ──────────────────────────────────────────────────────────────────────
    // External – Seller
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Creates a new share listing.
     * @dev The caller (`msg.sender`) must be KYC-verified in the IdentityRegistry.
     *      The listing is created with STATUS_DRAFT by default.
     * @param listingId        Unique identifier for the listing (typically a hash).
     * @param companyHash      Keccak-256 hash of the company identifier.
     * @param shareClass       Numeric share class identifier.
     * @param quantityMin      Minimum shares offered.
     * @param quantityMax      Maximum shares offered.
     * @param askPriceMin      Minimum ask price per share.
     * @param askPriceMax      Maximum ask price per share.
     * @param posAttestationId Identifier linking to the SharesAttestation record.
     * @param expiresAt        Unix timestamp after which the listing expires.
     */
    function createListing(
        bytes32 listingId,
        bytes32 companyHash,
        uint8   shareClass,
        uint256 quantityMin,
        uint256 quantityMax,
        uint256 askPriceMin,
        uint256 askPriceMax,
        bytes32 posAttestationId,
        uint256 expiresAt
    ) external whenNotPaused {
        if (listingId == bytes32(0)) revert ZeroHash();
        if (companyHash == bytes32(0)) revert ZeroHash();
        if (!identityRegistry.isVerified(msg.sender)) {
            revert SellerNotVerified(msg.sender);
        }
        if (_listings[listingId].seller != address(0)) {
            revert ListingAlreadyExists(listingId);
        }
        if (quantityMin == 0 || quantityMax == 0 || quantityMin > quantityMax) {
            revert InvalidParameters();
        }
        if (askPriceMin == 0 || askPriceMax == 0 || askPriceMin > askPriceMax) {
            revert InvalidParameters();
        }
        if (expiresAt <= block.timestamp) revert InvalidExpiry(expiresAt);

        _listings[listingId] = ListingRecord({
            seller:           msg.sender,
            companyHash:      companyHash,
            shareClass:       shareClass,
            quantityMin:      quantityMin,
            quantityMax:      quantityMax,
            askPriceMin:      askPriceMin,
            askPriceMax:      askPriceMax,
            status:           STATUS_DRAFT,
            posAttestationId: posAttestationId,
            createdAt:        block.timestamp,
            expiresAt:        expiresAt
        });

        emit ListingCreated(listingId, msg.sender, companyHash, block.timestamp);
    }

    // ──────────────────────────────────────────────────────────────────────
    // External – Owner or Seller
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Updates the status of an existing listing.
     * @dev Callable by the contract owner or the original seller of the listing.
     *      If the new status is CANCELLED, a separate `ListingCancelled` event
     *      is also emitted.
     * @param listingId The listing to update.
     * @param status    New status value (0-4).
     */
    function updateStatus(bytes32 listingId, uint8 status) external whenNotPaused {
        ListingRecord storage listing = _listings[listingId];
        if (listing.seller == address(0)) revert ListingNotFound(listingId);
        if (status > STATUS_FLAGGED) revert InvalidStatus(status);
        if (msg.sender != owner() && msg.sender != listing.seller) {
            revert NotAuthorized(msg.sender);
        }

        uint8 oldStatus = listing.status;
        listing.status = status;

        emit ListingUpdated(listingId, oldStatus, status, msg.sender);

        if (status == STATUS_CANCELLED) {
            emit ListingCancelled(listingId, msg.sender, block.timestamp);
        }
    }

    // ──────────────────────────────────────────────────────────────────────
    // External – Views
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the full listing record for a given identifier.
     * @param listingId The listing identifier to look up.
     * @return The stored ListingRecord struct.
     */
    function getListing(bytes32 listingId) external view returns (ListingRecord memory) {
        return _listings[listingId];
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
