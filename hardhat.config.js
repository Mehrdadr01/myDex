//require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers")
require("@nomicfoundation/hardhat-chai-matchers")
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks:{
    localhost:{} // or we can give it specifcly like {url: "https://127.0.0.1:8545"}
  },
  
};
