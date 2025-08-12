import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedTestAsyncDecrypt = await deploy("TestAsyncDecrypt", {
    from: deployer,
    log: true,
  });

  console.log(`TestAsyncDecrypt contract: `, deployedTestAsyncDecrypt.address);
};
export default func;
func.id = "deploy_testAsyncDecrypt"; // id required to prevent reexecution
func.tags = ["TestAsyncDecrypt"];