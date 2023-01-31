import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Batch Transaction Commander", function () {
  async function deployTokenAndCommander() {
    const [commanderOwner, tokenOwner] = await ethers.getSigners();

    const Pamela = await ethers.getContractFactory("PamelaToken");
    const pamela = await Pamela.deploy();

    return { commanderOwner, tokenOwner, pamela };
  }

  describe("Deployment", function () {
    it("Empty Test", async function () {});

    it("Should set the right owner", async function () {
      //const { lock, owner } = await loadFixture(deployTokenAndCommander);
      //expect(await lock.owner()).to.equal(owner.address);
    });
  });

  describe("Withdrawals", function () {});

  describe("Events", function () {});

  describe("Transfers", function () {});
});
