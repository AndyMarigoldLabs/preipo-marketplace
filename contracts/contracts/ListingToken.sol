// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

import "./IdentityRegistry.sol";
import "./ListingRegistry.sol";

/**
 * @title ListingToken
 * @author Marketplace Protocol
 * @notice ERC-1155 soulbound tokens representing optional on-chain tokenization
 *         of pre-IPO share listings. Tokens are non-transferable (all transfer
 *         functions revert) and serve as on-chain attestations linking a seller
 *         to their listing. This contract holds NO assets and performs NO custody
 *         or execution logic.
 * @dev Follows the UUPS upgradeable proxy pattern. Transfer functions are
 *      overridden to always revert, making these tokens soulbound. Minting
 *      requires the seller to be KYC-verified and the listing to exist in the
 *      ListingRegistry.
 */
contract ListingToken is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ERC1155Upgradeable
{
    // ──────────────────────────────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────────────────────────────

    /// @notice Maps token ID to the corresponding listing identifier.
    mapping(uint256 => bytes32) public tokenListingId;

    /// @notice Maps token ID to its IPFS metadata hash.
    mapping(uint256 => bytes32) public tokenMetadataHash;

    /// @notice Counter for sequential token ID generation.
    uint256 public nextTokenId;

    /// @notice Reference to the IdentityRegistry used for KYC checks.
    IdentityRegistry public identityRegistry;

    /// @notice Reference to the ListingRegistry used for listing validation.
    ListingRegistry public listingRegistry;

    // ──────────────────────────────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Emitted when a new listing token is minted.
     * @param tokenId      The newly assigned token ID.
     * @param listingId    The listing this token represents.
     * @param seller       Address of the seller who received the token.
     * @param metadataHash IPFS hash of the token metadata.
     */
    event ListingTokenMinted(
        uint256 indexed tokenId,
        bytes32 indexed listingId,
        address indexed seller,
        bytes32 metadataHash
    );

    /**
     * @notice Emitted when a listing token is burned.
     * @param tokenId  The token that was burned.
     * @param burnedBy Address that initiated the burn.
     * @param burnedAt Timestamp of the burn.
     */
    event ListingTokenBurned(
        uint256 indexed tokenId,
        address indexed burnedBy,
        uint256 burnedAt
    );

    // ──────────────────────────────────────────────────────────────────────
    // Errors
    // ──────────────────────────────────────────────────────────────────────

    /// @notice Thrown when the caller is not KYC-verified.
    error SellerNotVerified(address seller);

    /// @notice Thrown when the referenced listing does not exist.
    error ListingNotFound(bytes32 listingId);

    /// @notice Thrown when the caller is not the seller of the referenced listing.
    error NotListingSeller(address caller);

    /// @notice Thrown when a transfer is attempted (tokens are soulbound).
    error TransferNotAllowed();

    /// @notice Thrown when burn is attempted by someone other than the seller or owner.
    error NotAuthorized(address caller);

    /// @notice Thrown when the token does not exist.
    error TokenNotFound(uint256 tokenId);

    /// @notice Thrown when an initialization address is zero.
    error ZeroAddress();

    /// @notice Thrown when a zero-value hash is supplied.
    error ZeroHash();

    // ──────────────────────────────────────────────────────────────────────
    // Initializer
    // ──────────────────────────────────────────────────────────────────────

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract with references to dependent registries.
     * @param uri_               Base URI for ERC-1155 metadata (can be empty if using IPFS hashes).
     * @param identityRegistry_  Address of the deployed IdentityRegistry proxy.
     * @param listingRegistry_   Address of the deployed ListingRegistry proxy.
     */
    function initialize(
        string memory uri_,
        address identityRegistry_,
        address listingRegistry_
    ) external initializer {
        if (identityRegistry_ == address(0)) revert ZeroAddress();
        if (listingRegistry_ == address(0)) revert ZeroAddress();

        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __Pausable_init();
        __ERC1155_init(uri_);

        identityRegistry = IdentityRegistry(identityRegistry_);
        listingRegistry  = ListingRegistry(listingRegistry_);
        nextTokenId      = 1;
    }

    // ──────────────────────────────────────────────────────────────────────
    // External – Mint
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Mints a soulbound listing token to the seller.
     * @dev The caller must be KYC-verified and must be the seller recorded in the
     *      listing. Each mint creates exactly 1 token (amount = 1).
     * @param listingId    The listing identifier this token will represent.
     * @param metadataHash IPFS hash of the token metadata document.
     * @return tokenId     The newly created token ID.
     */
    function mint(
        bytes32 listingId,
        bytes32 metadataHash
    ) external whenNotPaused returns (uint256 tokenId) {
        if (listingId == bytes32(0)) revert ZeroHash();
        if (!identityRegistry.isVerified(msg.sender)) {
            revert SellerNotVerified(msg.sender);
        }

        ListingRegistry.ListingRecord memory listing = listingRegistry.getListing(listingId);
        if (listing.seller == address(0)) revert ListingNotFound(listingId);
        if (listing.seller != msg.sender) revert NotListingSeller(msg.sender);

        tokenId = nextTokenId++;
        tokenListingId[tokenId]    = listingId;
        tokenMetadataHash[tokenId] = metadataHash;

        _mint(msg.sender, tokenId, 1, "");

        emit ListingTokenMinted(tokenId, listingId, msg.sender, metadataHash);
    }

    // ──────────────────────────────────────────────────────────────────────
    // External – Burn
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Burns a listing token.
     * @dev Callable by the token holder (seller) or the contract owner
     *      (for admin expiry burns). The token must exist and the caller
     *      must hold a balance of it, or be the owner.
     * @param tokenId The token to burn.
     */
    function burn(uint256 tokenId) external whenNotPaused {
        if (tokenListingId[tokenId] == bytes32(0)) revert TokenNotFound(tokenId);

        ListingRegistry.ListingRecord memory listing = listingRegistry.getListing(
            tokenListingId[tokenId]
        );

        // Allow the seller (token holder) or the contract owner to burn.
        if (msg.sender != listing.seller && msg.sender != owner()) {
            revert NotAuthorized(msg.sender);
        }

        _burn(listing.seller, tokenId, 1);

        delete tokenListingId[tokenId];
        delete tokenMetadataHash[tokenId];

        emit ListingTokenBurned(tokenId, msg.sender, block.timestamp);
    }

    // ──────────────────────────────────────────────────────────────────────
    // Overrides – Soulbound (Non-Transferable)
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @dev Overrides the internal update hook to block all transfers.
     *      Only mint (from == address(0)) and burn (to == address(0)) are permitted.
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override {
        // Allow mints and burns; block all other transfers.
        if (from != address(0) && to != address(0)) {
            revert TransferNotAllowed();
        }
        super._update(from, to, ids, values);
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
