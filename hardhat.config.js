require("@nomiclabs/hardhat-ethers")
require("@nomicfoundation/hardhat-chai-matchers")
require("dotenv").config();
const privateKeys = process.env.PRIVATE_KEYS || ""
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks:{
    localhost:{}, // or we can give it specifcly like {url: "https://127.0.0.1:8545"}
    kovan:{
      url:`https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: privateKeys.split(','),
    }
  },
  
};
