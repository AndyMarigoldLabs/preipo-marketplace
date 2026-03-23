import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ListingRegistry", function () {
  let identityRegistry: Contract;
  let listingRegistry: Contract;
  let owner: SignerWithAddress;
  let verifiedSeller: SignerWithAddress;
  let unverifiedUser: SignerWithAddress;
  let buyer: SignerWithAddress;

  // Credential type
  const KYC_BASIC = ethers.keccak256(ethers.toUtf8Bytes("KYC_BASIC"));

  // Listing status enum values
  const LISTING_ACTIVE = 0;
  const LISTING_PENDING = 1;
  const LISTING_SOLD = 2;
  const LISTING_CANCELLED = 3;

  // Sample listing data
  const sampleListing = {
    companyName: "Acme Corp",
    shareType: "Common",
    numberOfShares: 1000,
    pricePerShare: ethers.parseEther("10"),
    minPurchase: 100,
    description: "Series A shares in Acme Corp",
  };

  beforeEach(async function () {
    [owner, verifiedSeller, unverifiedUser, buyer] = await ethers.getSigners();

    // Deploy IdentityRegistry
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await upgrades.deployProxy(IdentityRegistry, [], {
      initializer: "initialize",
    });
    await identityRegistry.waitForDeployment();

    // Register verified KYC for the seller
    const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365;
    await identityRegistry.registerCredential(verifiedSeller.address, KYC_BASIC, expiresAt);

    // Deploy ListingRegistry with reference to IdentityRegistry
    const ListingRegistry = await ethers.getContractFactory("ListingRegistry");
    const identityAddress = await identityRegistry.getAddress();
    listingRegistry = await upgrades.deployProxy(
      ListingRegistry,
      [identityAddress],
      { initializer: "initialize" }
    );
    await listingRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should deploy and initialize with correct identity registry address", async function () {
      const contractAddress = await listingRegistry.getAddress();
      expect(contractAddress).to.be.properAddress;

      const identityAddress = await identityRegistry.getAddress();
      expect(await listingRegistry.identityRegistry()).to.equal(identityAddress);
    });

    it("should set the deployer as owner", async function () {
      expect(await listingRegistry.owner()).to.equal(owner.address);
    });
  });

  describe("Create Listing", function () {
    it("should allow a verified user to create a listing", async function () {
      await expect(
        listingRegistry.connect(verifiedSeller).createListing(
          sampleListing.companyName,
          sampleListing.shareType,
          sampleListing.numberOfShares,
          sampleListing.pricePerShare,
          sampleListing.minPurchase,
          sampleListing.description
        )
      ).to.emit(listingRegistry, "ListingCreated");
    });

    it("should assign an incrementing listing ID", async function () {
      const tx1 = await listingRegistry.connect(verifiedSeller).createListing(
        sampleListing.companyName,
        sampleListing.shareType,
        sampleListing.numberOfShares,
        sampleListing.pricePerShare,
        sampleListing.minPurchase,
        sampleListing.description
      );
      const receipt1 = await tx1.wait();

      const tx2 = await listingRegistry.connect(verifiedSeller).createListing(
        "Beta Inc",
        "Preferred",
        500,
        ethers.parseEther("20"),
        50,
        "Series B preferred shares"
      );
      const receipt2 = await tx2.wait();

      // Verify listing count incremented
      const listing1 = await listingRegistry.getListing(1);
      const listing2 = await listingRegistry.getListing(2);
      expect(listing1.companyName).to.equal(sampleListing.companyName);
      expect(listing2.companyName).to.equal("Beta Inc");
    });

    it("should reject listing creation from an unverified user", async function () {
      await expect(
        listingRegistry.connect(unverifiedUser).createListing(
          sampleListing.companyName,
          sampleListing.shareType,
          sampleListing.numberOfShares,
          sampleListing.pricePerShare,
          sampleListing.minPurchase,
          sampleListing.description
        )
      ).to.be.revertedWith("Seller must have verified KYC");
    });

    it("should reject listing creation from a user with suspended KYC", async function () {
      const STATUS_SUSPENDED = 3;
      await identityRegistry.updateStatus(verifiedSeller.address, KYC_BASIC, STATUS_SUSPENDED);

      await expect(
        listingRegistry.connect(verifiedSeller).createListing(
          sampleListing.companyName,
          sampleListing.shareType,
          sampleListing.numberOfShares,
          sampleListing.pricePerShare,
          sampleListing.minPurchase,
          sampleListing.description
        )
      ).to.be.revertedWith("Seller must have verified KYC");
    });
  });

  describe("Update Listing Status", function () {
    beforeEach(async function () {
      await listingRegistry.connect(verifiedSeller).createListing(
        sampleListing.companyName,
        sampleListing.shareType,
        sampleListing.numberOfShares,
        sampleListing.pricePerShare,
        sampleListing.minPurchase,
        sampleListing.description
      );
    });

    it("should allow the owner to update listing status to sold", async function () {
      await expect(
        listingRegistry.updateListingStatus(1, LISTING_SOLD)
      ).to.emit(listingRegistry, "ListingStatusUpdated");

      const listing = await listingRegistry.getListing(1);
      expect(listing.status).to.equal(LISTING_SOLD);
    });

    it("should allow the owner to update listing status to pending", async function () {
      await listingRegistry.updateListingStatus(1, LISTING_PENDING);

      const listing = await listingRegistry.getListing(1);
      expect(listing.status).to.equal(LISTING_PENDING);
    });

    it("should reject status update from non-owner non-seller", async function () {
      await expect(
        listingRegistry.connect(buyer).updateListingStatus(1, LISTING_SOLD)
      ).to.be.reverted;
    });
  });

  describe("Cancel Listing", function () {
    beforeEach(async function () {
      await listingRegistry.connect(verifiedSeller).createListing(
        sampleListing.companyName,
        sampleListing.shareType,
        sampleListing.numberOfShares,
        sampleListing.pricePerShare,
        sampleListing.minPurchase,
        sampleListing.description
      );
    });

    it("should allow the seller to cancel their own listing", async function () {
      await expect(
        listingRegistry.connect(verifiedSeller).cancelListing(1)
      ).to.emit(listingRegistry, "ListingCancelled");

      const listing = await listingRegistry.getListing(1);
      expect(listing.status).to.equal(LISTING_CANCELLED);
    });

    it("should allow the contract owner to cancel any listing", async function () {
      await expect(
        listingRegistry.cancelListing(1)
      ).to.emit(listingRegistry, "ListingCancelled");

      const listing = await listingRegistry.getListing(1);
      expect(listing.status).to.equal(LISTING_CANCELLED);
    });

    it("should reject cancellation from an unauthorized user", async function () {
      await expect(
        listingRegistry.connect(buyer).cancelListing(1)
      ).to.be.revertedWith("Not authorized");
    });

    it("should reject cancellation of an already cancelled listing", async function () {
      await listingRegistry.connect(verifiedSeller).cancelListing(1);

      await expect(
        listingRegistry.connect(verifiedSeller).cancelListing(1)
      ).to.be.revertedWith("Listing not active");
    });
  });

  describe("Get Listing Data", function () {
    beforeEach(async function () {
      await listingRegistry.connect(verifiedSeller).createListing(
        sampleListing.companyName,
        sampleListing.shareType,
        sampleListing.numberOfShares,
        sampleListing.pricePerShare,
        sampleListing.minPurchase,
        sampleListing.description
      );
    });

    it("should return correct listing data", async function () {
      const listing = await listingRegistry.getListing(1);

      expect(listing.seller).to.equal(verifiedSeller.address);
      expect(listing.companyName).to.equal(sampleListing.companyName);
      expect(listing.shareType).to.equal(sampleListing.shareType);
      expect(listing.numberOfShares).to.equal(sampleListing.numberOfShares);
      expect(listing.pricePerShare).to.equal(sampleListing.pricePerShare);
      expect(listing.minPurchase).to.equal(sampleListing.minPurchase);
      expect(listing.description).to.equal(sampleListing.description);
      expect(listing.status).to.equal(LISTING_ACTIVE);
    });

    it("should revert when querying a non-existent listing", async function () {
      await expect(listingRegistry.getListing(999)).to.be.revertedWith("Listing does not exist");
    });

    it("should return the correct seller address", async function () {
      const listing = await listingRegistry.getListing(1);
      expect(listing.seller).to.equal(verifiedSeller.address);
    });
  });
});
