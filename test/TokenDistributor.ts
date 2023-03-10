import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Batch Transaction Commander", function () {
  const ADMIN =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const OPERATOR =
    "0x523a704056dcd17bcf83bed8b68c59416dac1119be77755efe3bde0a64e46e0c";

  function accessError(account: string, role: string) {
    return `AccessControl: account ${account.toLowerCase()} is missing role ${role}`;
  }

  async function deployTokensAndDistributor() {
    const [admin, operator, tokenDeployer] = await ethers.getSigners();
    // To get other accounts for testing we can take the signers from 3 on, for example:
    // const [other1, other2] = (await ethers.getSigners()).slice(3);

    // deploy test tokens
    const Pamela = await ethers.getContractFactory("PamelaToken");
    const pamela = await Pamela.connect(tokenDeployer).deploy();
    const Andreas = await ethers.getContractFactory("AndreasToken");
    const andreas = await Andreas.connect(tokenDeployer).deploy();

    // deploy the distributor
    const Distributor = await ethers.getContractFactory("TokenDistributor");
    const distributor = await Distributor.connect(admin).deploy();
    // set operator
    await distributor.connect(admin).addOperator(operator.address);

    return {
      admin,
      operator,
      tokenDeployer,
      pamela,
      andreas,
      distributor,
    };
  }

  describe("Deployment", function () {
    it("Should set the right roles", async function () {
      const { distributor, admin, operator } = await loadFixture(
        deployTokensAndDistributor
      );

      expect(await distributor.hasRole(ADMIN, admin.address)).to.be.true;
      expect(await distributor.hasRole(OPERATOR, operator.address)).to.be.true;
      expect(await distributor.hasRole(ADMIN, operator.address)).to.be.false;
      expect(await distributor.getRoleAdmin(OPERATOR)).to.equal(ADMIN);
    });

    it("Try to call on non-contract address", async function () {
      const { operator, tokenDeployer, distributor } = await loadFixture(
        deployTokensAndDistributor
      );

      await expect(
        distributor
          .connect(operator)
          .withdraw(
            tokenDeployer.address,
            operator.address,
            ethers.utils.parseEther("1")
          )
      ).to.be.reverted;
    });
  });

  describe("Deposits and Withdrawals", function () {
    it("Send tokens to the commander", async function () {
      const { pamela, andreas, tokenDeployer, distributor } = await loadFixture(
        deployTokensAndDistributor
      );

      const tokens1000 = ethers.utils.parseEther("1000");
      await pamela.connect(tokenDeployer).mint(distributor.address, tokens1000);
      await andreas
        .connect(tokenDeployer)
        .mint(distributor.address, tokens1000);

      expect(await pamela.balanceOf(distributor.address)).to.equal(tokens1000);
      expect(await andreas.balanceOf(distributor.address)).to.equal(tokens1000);
    });

    it("Fail to withdraw a token you don't have", async function () {
      const { operator, distributor, pamela } = await loadFixture(
        deployTokensAndDistributor
      );

      await expect(
        distributor
          .connect(operator)
          .withdraw(
            pamela.address,
            operator.address,
            ethers.utils.parseEther("1")
          )
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Fail to withdraw if you are not an operator", async function () {
      const { distributor, pamela, tokenDeployer } = await loadFixture(
        deployTokensAndDistributor
      );

      const tokens1000 = ethers.utils.parseEther("1000");
      await pamela.connect(tokenDeployer).mint(distributor.address, tokens1000);

      await expect(
        distributor
          .connect(tokenDeployer)
          .withdraw(
            pamela.address,
            tokenDeployer.address,
            ethers.utils.parseEther("1")
          )
      ).to.be.revertedWith(accessError(tokenDeployer.address, OPERATOR));
    });

    it("Successfully withdraw", async function () {
      const { distributor, pamela, tokenDeployer, operator } =
        await loadFixture(deployTokensAndDistributor);

      await pamela
        .connect(tokenDeployer)
        .mint(distributor.address, ethers.utils.parseEther("1000"));

      expect(await pamela.balanceOf(operator.address)).to.equal(0);

      await expect(
        distributor
          .connect(operator)
          .withdraw(
            pamela.address,
            operator.address,
            ethers.utils.parseEther("1")
          )
      )
        .to.emit(distributor, "Withdrawal")
        .withArgs(
          pamela.address,
          operator.address,
          ethers.utils.parseEther("1")
        );

      expect(await pamela.balanceOf(operator.address)).to.equal(
        ethers.utils.parseEther("1")
      );
    });
  });

  describe("Role Management", function () {
    it("Only admin can manage operators", async function () {
      const { distributor, tokenDeployer } = await loadFixture(
        deployTokensAndDistributor
      );

      await expect(
        distributor.connect(tokenDeployer).addOperator(tokenDeployer.address)
      ).to.be.reverted;

      await expect(
        distributor.connect(tokenDeployer).revokeOperator(tokenDeployer.address)
      ).to.be.reverted;
    });

    it("Admin can successfully manage operators", async function () {
      const { distributor, admin } = await loadFixture(
        deployTokensAndDistributor
      );

      const [other1] = (await ethers.getSigners()).slice(3);
      expect(await distributor.hasRole(OPERATOR, other1.address)).to.be.false;

      await distributor.connect(admin).addOperator(other1.address);
      expect(await distributor.hasRole(OPERATOR, other1.address)).to.be.true;

      await distributor.connect(admin).revokeOperator(other1.address);
      expect(await distributor.hasRole(OPERATOR, other1.address)).to.be.false;
    });
  });

  describe("Distribution", function () {
    it("Only operator can distribute or distributeFrom", async function () {
      const { operator, tokenDeployer, pamela, andreas, distributor } =
        await loadFixture(deployTokensAndDistributor);

      const accounts = (await ethers.getSigners()).slice(3, 6);
      const addresses = accounts.map((account) => account.address);
      const amounts = addresses.map((_, index) =>
        ethers.utils.parseEther(`${index + 1}`)
      );

      await expect(
        distributor
          .connect(accounts[0])
          .distribute(pamela.address, addresses, amounts)
      ).to.be.revertedWith(accessError(accounts[0].address, OPERATOR));

      await expect(
        distributor
          .connect(accounts[0])
          .distributeFrom(
            pamela.address,
            accounts[1].address,
            addresses,
            amounts
          )
      ).to.be.revertedWith(accessError(accounts[0].address, OPERATOR));
    });

    it("Check input data is correct", async function () {
      const { operator, tokenDeployer, pamela, distributor } =
        await loadFixture(deployTokensAndDistributor);

      const accounts = (await ethers.getSigners()).slice(3, 6);
      const addresses = accounts.map((account) => account.address);
      const amounts = addresses
        .map((_, index) => ethers.utils.parseEther(`${index + 1}`))
        .slice(1);

      await expect(
        distributor
          .connect(operator)
          .distribute(pamela.address, addresses, amounts)
      ).to.be.revertedWith("Invalid input parameters");

      await expect(
        distributor
          .connect(operator)
          .distributeFrom(
            pamela.address,
            tokenDeployer.address,
            addresses,
            amounts
          )
      ).to.be.revertedWith("Invalid input parameters");
    });

    it("Successful distribution", async function () {
      const { operator, tokenDeployer, pamela, andreas, distributor } =
        await loadFixture(deployTokensAndDistributor);

      await pamela
        .connect(tokenDeployer)
        .mint(distributor.address, ethers.utils.parseEther("1000"));

      await andreas
        .connect(tokenDeployer)
        .mint(distributor.address, ethers.utils.parseEther("1000"));

      const accounts = (await ethers.getSigners()).slice(3, 6);
      const addresses = accounts.map((account) => account.address);
      const amounts = addresses.map((_, index) =>
        ethers.utils.parseEther(`${index + 1}`)
      );

      await expect(
        distributor
          .connect(operator)
          .distribute(pamela.address, addresses, amounts)
      )
        .to.emit(distributor, "TokenDistribution")
        .withArgs(
          pamela.address,
          distributor.address,
          ethers.utils.parseEther("6")
        );

      await expect(
        distributor
          .connect(operator)
          .distribute(andreas.address, addresses, amounts)
      )
        .to.emit(distributor, "TokenDistribution")
        .withArgs(
          andreas.address,
          distributor.address,
          ethers.utils.parseEther("6")
        );

      await Promise.all(
        addresses.map(async (address, index) => {
          expect(await pamela.balanceOf(address)).to.equal(amounts[index]);
          expect(await andreas.balanceOf(address)).to.equal(amounts[index]);
        })
      );
    });

    it("Successful distribution From", async function () {
      const { admin, operator, tokenDeployer, pamela, andreas, distributor } =
        await loadFixture(deployTokensAndDistributor);

      const tokenHolder = (await ethers.getSigners())[3];

      await pamela
        .connect(tokenDeployer)
        .mint(tokenHolder.address, ethers.utils.parseEther("1000"));

      await andreas
        .connect(tokenDeployer)
        .mint(tokenHolder.address, ethers.utils.parseEther("1000"));

      const accounts = (await ethers.getSigners()).slice(4, 7);
      const addresses = accounts.map((account) => account.address);
      const amounts = addresses.map((_, index) =>
        ethers.utils.parseEther(`${index + 1}`)
      );

      // revert as token spending has not been approved
      await expect(
        distributor
          .connect(operator)
          .distributeFrom(
            pamela.address,
            tokenHolder.address,
            addresses,
            amounts
          )
      ).to.be.revertedWith("ERC20: insufficient allowance");
      await expect(
        distributor
          .connect(operator)
          .distributeFrom(
            andreas.address,
            tokenHolder.address,
            addresses,
            amounts
          )
      ).to.be.revertedWith("ERC20: insufficient allowance");

      // approve spending
      await pamela
        .connect(tokenHolder)
        .approve(distributor.address, ethers.utils.parseEther("6"));
      await andreas
        .connect(tokenHolder)
        .approve(distributor.address, ethers.utils.parseEther("6"));

      await expect(
        distributor
          .connect(operator)
          .distributeFrom(
            pamela.address,
            tokenHolder.address,
            addresses,
            amounts
          )
      )
        .to.emit(distributor, "TokenDistribution")
        .withArgs(
          pamela.address,
          tokenHolder.address,
          ethers.utils.parseEther("6")
        );
      await expect(
        distributor
          .connect(operator)
          .distributeFrom(
            andreas.address,
            tokenHolder.address,
            addresses,
            amounts
          )
      )
        .to.emit(distributor, "TokenDistribution")
        .withArgs(
          andreas.address,
          tokenHolder.address,
          ethers.utils.parseEther("6")
        );

      await Promise.all(
        addresses.map(async (address, index) => {
          expect(await pamela.balanceOf(address)).to.equal(amounts[index]);
          expect(await andreas.balanceOf(address)).to.equal(amounts[index]);
        })
      );
    });
  });
});
