// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

import "./IdentityRegistry.sol";

/**
 * @title DealMemo
 * @author Marketplace Protocol
 * @notice Stores signed deal memo hashes for bilateral pre-IPO share
 *         transactions. A deal memo captures the agreed terms between a buyer
 *         and seller, along with their cryptographic signatures. This contract
 *         holds NO assets and performs NO custody or execution logic. It serves
 *         as an immutable on-chain record of deal term agreements.
 * @dev Follows the UUPS upgradeable proxy pattern. The actual deal terms live
 *      off-chain; this contract stores only their hashes and the corresponding
 *      signatures from both counterparties.
 */
contract DealMemo is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    // ──────────────────────────────────────────────────────────────────────
    // Types
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice On-chain record of a deal memo between buyer and seller.
     * @param dealRoomId      Identifier of the deal room where negotiation occurred.
     * @param termsHash       Keccak-256 hash of the agreed deal terms document.
     * @param buyer           Address of the buyer.
     * @param seller          Address of the seller (memo creator).
     * @param buyerSignature  Buyer's EIP-191/712 signature over the terms hash.
     * @param sellerSignature Seller's EIP-191/712 signature over the terms hash.
     * @param usdcPrice       Agreed price in USDC base units (6 decimals).
     * @param quantity        Number of shares in the deal.
     * @param signedAt        Timestamp when both parties had signed (0 if incomplete).
     * @param complete        True when both buyer and seller have signed.
     */
    struct Memo {
        bytes32 dealRoomId;
        bytes32 termsHash;
        address buyer;
        address seller;
        bytes   buyerSignature;
        bytes   sellerSignature;
        uint256 usdcPrice;
        uint256 quantity;
        uint256 signedAt;
        bool    complete;
    }

    // ──────────────────────────────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────────────────────────────

    /// @notice Deal memo data keyed by memo identifier.
    mapping(bytes32 => Memo) private _memos;

    /// @notice Reference to the IdentityRegistry used for KYC checks.
    IdentityRegistry public identityRegistry;

    // ──────────────────────────────────────────────────────────────────────
    // Events
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Emitted when a new deal memo is created.
     * @param memoId      Unique identifier for the memo.
     * @param dealRoomId  The deal room where the memo originated.
     * @param seller      Address of the seller who created the memo.
     * @param buyer       Address of the buyer counterparty.
     * @param usdcPrice   Agreed USDC price.
     * @param quantity    Number of shares.
     */
    event MemoCreated(
        bytes32 indexed memoId,
        bytes32 indexed dealRoomId,
        address indexed seller,
        address buyer,
        uint256 usdcPrice,
        uint256 quantity
    );

    /**
     * @notice Emitted when a party signs the memo.
     * @param memoId   The memo that was signed.
     * @param signer   Address of the signing party.
     * @param signedAt Timestamp of the signature.
     */
    event MemoSigned(
        bytes32 indexed memoId,
        address indexed signer,
        uint256 signedAt
    );

    /**
     * @notice Emitted when both parties have signed and the memo is complete.
     * @param memoId     The completed memo.
     * @param completedAt Timestamp of completion.
     */
    event MemoComplete(
        bytes32 indexed memoId,
        uint256 completedAt
    );

    // ──────────────────────────────────────────────────────────────────────
    // Errors
    // ──────────────────────────────────────────────────────────────────────

    /// @notice Thrown when a zero-value hash is supplied where a non-zero hash is required.
    error ZeroHash();

    /// @notice Thrown when the zero address is supplied for a required address parameter.
    error ZeroAddress();

    /// @notice Thrown when a zero value is supplied for a numeric parameter.
    error ZeroValue();

    /// @notice Thrown when the caller is not KYC-verified.
    error CallerNotVerified(address caller);

    /// @notice Thrown when the counterparty is not KYC-verified.
    error CounterpartyNotVerified(address counterparty);

    /// @notice Thrown when a memo already exists for the given identifier.
    error MemoAlreadyExists(bytes32 memoId);

    /// @notice Thrown when no memo exists for the given identifier.
    error MemoNotFound(bytes32 memoId);

    /// @notice Thrown when the caller is not the buyer or seller of the memo.
    error NotParty(address caller);

    /// @notice Thrown when the party has already signed the memo.
    error AlreadySigned(address signer);

    /// @notice Thrown when the signature bytes are empty.
    error EmptySignature();

    /// @notice Thrown when the memo is already complete.
    error MemoAlreadyComplete(bytes32 memoId);

    /// @notice Thrown when the caller tries to create a memo with themselves as counterparty.
    error SelfDeal();

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
    // External – Create
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Creates a new deal memo between the caller (seller) and a counterparty (buyer).
     * @dev Both the caller and the counterparty must be KYC-verified in the
     *      IdentityRegistry. The memo is created unsigned; both parties must
     *      call `signMemo` to complete it.
     * @param memoId       Unique identifier for the memo (typically a hash).
     * @param dealRoomId   Identifier of the deal room.
     * @param termsHash    Keccak-256 hash of the deal terms document.
     * @param counterparty Address of the buyer.
     * @param usdcPrice    Agreed price in USDC base units.
     * @param quantity     Number of shares in the deal.
     */
    function createMemo(
        bytes32 memoId,
        bytes32 dealRoomId,
        bytes32 termsHash,
        address counterparty,
        uint256 usdcPrice,
        uint256 quantity
    ) external whenNotPaused {
        if (memoId == bytes32(0)) revert ZeroHash();
        if (dealRoomId == bytes32(0)) revert ZeroHash();
        if (termsHash == bytes32(0)) revert ZeroHash();
        if (counterparty == address(0)) revert ZeroAddress();
        if (counterparty == msg.sender) revert SelfDeal();
        if (usdcPrice == 0) revert ZeroValue();
        if (quantity == 0) revert ZeroValue();

        if (!identityRegistry.isVerified(msg.sender)) {
            revert CallerNotVerified(msg.sender);
        }
        if (!identityRegistry.isVerified(counterparty)) {
            revert CounterpartyNotVerified(counterparty);
        }
        if (_memos[memoId].seller != address(0)) {
            revert MemoAlreadyExists(memoId);
        }

        _memos[memoId] = Memo({
            dealRoomId:      dealRoomId,
            termsHash:       termsHash,
            buyer:           counterparty,
            seller:          msg.sender,
            buyerSignature:  "",
            sellerSignature: "",
            usdcPrice:       usdcPrice,
            quantity:        quantity,
            signedAt:        0,
            complete:        false
        });

        emit MemoCreated(memoId, dealRoomId, msg.sender, counterparty, usdcPrice, quantity);
    }

    // ──────────────────────────────────────────────────────────────────────
    // External – Sign
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Records a signature from the buyer or seller on a memo.
     * @dev The caller must be the buyer or seller of the memo. If both parties
     *      have signed after this call, the memo is marked complete and the
     *      `MemoComplete` event is emitted.
     * @param memoId    The memo to sign.
     * @param signature The caller's EIP-191/712 signature over the terms hash.
     */
    function signMemo(bytes32 memoId, bytes calldata signature) external whenNotPaused {
        Memo storage memo = _memos[memoId];
        if (memo.seller == address(0)) revert MemoNotFound(memoId);
        if (memo.complete) revert MemoAlreadyComplete(memoId);
        if (signature.length == 0) revert EmptySignature();

        bool isBuyer  = (msg.sender == memo.buyer);
        bool isSeller = (msg.sender == memo.seller);

        if (!isBuyer && !isSeller) revert NotParty(msg.sender);

        if (isBuyer) {
            if (memo.buyerSignature.length > 0) revert AlreadySigned(msg.sender);
            memo.buyerSignature = signature;
        } else {
            if (memo.sellerSignature.length > 0) revert AlreadySigned(msg.sender);
            memo.sellerSignature = signature;
        }

        emit MemoSigned(memoId, msg.sender, block.timestamp);

        // Check if both signatures are now present.
        if (memo.buyerSignature.length > 0 && memo.sellerSignature.length > 0) {
            memo.signedAt = block.timestamp;
            memo.complete = true;
            emit MemoComplete(memoId, block.timestamp);
        }
    }

    // ──────────────────────────────────────────────────────────────────────
    // External – Views
    // ──────────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the full memo record for a given identifier.
     * @param memoId The memo identifier to look up.
     * @return The stored Memo struct.
     */
    function getMemo(bytes32 memoId) external view returns (Memo memory) {
        return _memos[memoId];
    }

    /**
     * @notice Returns whether a memo is complete (both parties have signed).
     * @param memoId The memo identifier to check.
     * @return True if the memo exists and both buyer and seller have signed.
     */
    function isComplete(bytes32 memoId) external view returns (bool) {
        return _memos[memoId].complete;
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
