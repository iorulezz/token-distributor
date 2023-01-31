import { ethers } from "hardhat";

async function main() {
  const Pamela = await ethers.getContractFactory("PamelaToken");
  const pamela = await Pamela.deploy();
  await pamela.deployed();
  console.log(`PamelaToken deployed to ${pamela.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
