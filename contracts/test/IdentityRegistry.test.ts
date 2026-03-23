import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("IdentityRegistry", function () {
  let identityRegistry: Contract;
  let owner: SignerWithAddress;
  let verifier: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  // Credential status enum values
  const STATUS_VERIFIED = 1;
  const STATUS_EXPIRED = 2;
  const STATUS_SUSPENDED = 3;

  // Credential type constants
  const KYC_BASIC = ethers.keccak256(ethers.toUtf8Bytes("KYC_BASIC"));
  const KYC_ACCREDITED = ethers.keccak256(ethers.toUtf8Bytes("KYC_ACCREDITED"));

  beforeEach(async function () {
    [owner, verifier, user1, user2] = await ethers.getSigners();

    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await upgrades.deployProxy(IdentityRegistry, [], {
      initializer: "initialize",
    });
    await identityRegistry.waitForDeployment();
  });

  describe("Deployment and Initialization", function () {
    it("should deploy and initialize correctly", async function () {
      const contractAddress = await identityRegistry.getAddress();
      expect(contractAddress).to.be.properAddress;
    });

    it("should set the deployer as owner", async function () {
      expect(await identityRegistry.owner()).to.equal(owner.address);
    });

    it("should not allow re-initialization", async function () {
      await expect(identityRegistry.initialize()).to.be.revertedWithCustomError(
        identityRegistry,
        "InvalidInitialization"
      );
    });
  });

  describe("registerCredential", function () {
    it("should allow the owner to register a credential for a user", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365; // 1 year from now

      await expect(
        identityRegistry.registerCredential(user1.address, KYC_BASIC, expiresAt)
      ).to.emit(identityRegistry, "CredentialRegistered");
    });

    it("should store credential data correctly after registration", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365;

      await identityRegistry.registerCredential(user1.address, KYC_BASIC, expiresAt);

      const credential = await identityRegistry.getCredential(user1.address, KYC_BASIC);
      expect(credential.status).to.equal(STATUS_VERIFIED);
      expect(credential.expiresAt).to.equal(expiresAt);
    });

    it("should allow registering multiple credential types for the same user", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365;

      await identityRegistry.registerCredential(user1.address, KYC_BASIC, expiresAt);
      await identityRegistry.registerCredential(user1.address, KYC_ACCREDITED, expiresAt);

      expect(await identityRegistry.isVerified(user1.address, KYC_BASIC)).to.be.true;
      expect(await identityRegistry.isVerified(user1.address, KYC_ACCREDITED)).to.be.true;
    });

    it("should reject registration from non-owner", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365;

      await expect(
        identityRegistry.connect(user1).registerCredential(user1.address, KYC_BASIC, expiresAt)
      ).to.be.revertedWithCustomError(identityRegistry, "OwnableUnauthorizedAccount");
    });
  });

  describe("updateStatus", function () {
    const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365;

    beforeEach(async function () {
      await identityRegistry.registerCredential(user1.address, KYC_BASIC, expiresAt);
    });

    it("should allow the owner to suspend a credential", async function () {
      await expect(
        identityRegistry.updateStatus(user1.address, KYC_BASIC, STATUS_SUSPENDED)
      ).to.emit(identityRegistry, "CredentialStatusUpdated");

      const credential = await identityRegistry.getCredential(user1.address, KYC_BASIC);
      expect(credential.status).to.equal(STATUS_SUSPENDED);
    });

    it("should allow the owner to mark a credential as expired", async function () {
      await identityRegistry.updateStatus(user1.address, KYC_BASIC, STATUS_EXPIRED);

      const credential = await identityRegistry.getCredential(user1.address, KYC_BASIC);
      expect(credential.status).to.equal(STATUS_EXPIRED);
    });

    it("should allow the owner to re-verify a suspended credential", async function () {
      await identityRegistry.updateStatus(user1.address, KYC_BASIC, STATUS_SUSPENDED);
      await identityRegistry.updateStatus(user1.address, KYC_BASIC, STATUS_VERIFIED);

      const credential = await identityRegistry.getCredential(user1.address, KYC_BASIC);
      expect(credential.status).to.equal(STATUS_VERIFIED);
    });

    it("should reject status update from non-owner", async function () {
      await expect(
        identityRegistry.connect(user1).updateStatus(user1.address, KYC_BASIC, STATUS_SUSPENDED)
      ).to.be.revertedWithCustomError(identityRegistry, "OwnableUnauthorizedAccount");
    });
  });

  describe("isVerified", function () {
    it("should return true for a verified credential that has not expired", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365;
      await identityRegistry.registerCredential(user1.address, KYC_BASIC, expiresAt);

      expect(await identityRegistry.isVerified(user1.address, KYC_BASIC)).to.be.true;
    });

    it("should return false for a suspended credential", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365;
      await identityRegistry.registerCredential(user1.address, KYC_BASIC, expiresAt);
      await identityRegistry.updateStatus(user1.address, KYC_BASIC, STATUS_SUSPENDED);

      expect(await identityRegistry.isVerified(user1.address, KYC_BASIC)).to.be.false;
    });

    it("should return false for an expired credential", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365;
      await identityRegistry.registerCredential(user1.address, KYC_BASIC, expiresAt);
      await identityRegistry.updateStatus(user1.address, KYC_BASIC, STATUS_EXPIRED);

      expect(await identityRegistry.isVerified(user1.address, KYC_BASIC)).to.be.false;
    });

    it("should return false for an expired-by-time credential", async function () {
      // Register with an expiration in the past
      const expiresAt = Math.floor(Date.now() / 1000) - 1;
      await identityRegistry.registerCredential(user1.address, KYC_BASIC, expiresAt);

      expect(await identityRegistry.isVerified(user1.address, KYC_BASIC)).to.be.false;
    });

    it("should return false for an unregistered user", async function () {
      expect(await identityRegistry.isVerified(user2.address, KYC_BASIC)).to.be.false;
    });
  });

  describe("Pause / Unpause", function () {
    it("should allow the owner to pause the contract", async function () {
      await identityRegistry.pause();
      expect(await identityRegistry.paused()).to.be.true;
    });

    it("should allow the owner to unpause the contract", async function () {
      await identityRegistry.pause();
      await identityRegistry.unpause();
      expect(await identityRegistry.paused()).to.be.false;
    });

    it("should prevent registerCredential when paused", async function () {
      await identityRegistry.pause();
      const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365;

      await expect(
        identityRegistry.registerCredential(user1.address, KYC_BASIC, expiresAt)
      ).to.be.revertedWithCustomError(identityRegistry, "EnforcedPause");
    });

    it("should prevent updateStatus when paused", async function () {
      const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365;
      await identityRegistry.registerCredential(user1.address, KYC_BASIC, expiresAt);

      await identityRegistry.pause();

      await expect(
        identityRegistry.updateStatus(user1.address, KYC_BASIC, STATUS_SUSPENDED)
      ).to.be.revertedWithCustomError(identityRegistry, "EnforcedPause");
    });

    it("should reject pause from non-owner", async function () {
      await expect(
        identityRegistry.connect(user1).pause()
      ).to.be.revertedWithCustomError(identityRegistry, "OwnableUnauthorizedAccount");
    });

    it("should reject unpause from non-owner", async function () {
      await identityRegistry.pause();
      await expect(
        identityRegistry.connect(user1).unpause()
      ).to.be.revertedWithCustomError(identityRegistry, "OwnableUnauthorizedAccount");
    });
  });
});
