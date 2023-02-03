import { ethers } from "hardhat";

async function main() {
  const Distributor = await ethers.getContractFactory("TokenDistributor");
  const distributor = await Distributor.deploy();
  await distributor.deployed();
  console.log(`TokenDistributor deployed to ${distributor.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
