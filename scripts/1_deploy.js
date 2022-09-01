//const hre = require("hardhat");

const { ethers } = require("hardhat")

async function main(){
    console.log(`Prepering 4 deployment ... \n`)

    //fetch our cntract to deploy 
    const Token = await ethers.getContractFactory("Token")
    const Exchange = await ethers.getContractFactory("Exchange")

    //fetch accounts
    const accounts = await ethers.getSigners()

    console.log(`Acounts feteched : \n ${accounts[0].address}\n ${accounts[1].address}\n`)
   
    // deploy contract
    const mehrdad = await Token.deploy('Mehrdad','MRD','1000000')
    await mehrdad.deployed()
    console.log(`MEHRDAD Deployed t0 : ${mehrdad.address}`)

    const mETH = await Token.deploy('mock ETH','mETH','1000000')
    await mETH.deployed()
    console.log(`mETH Deployed t0 : ${mETH.address}`)

    const mDAI = await Token.deploy('mock DAI','mDAI','1000000')
    await mDAI.deployed()
    console.log(`mDAI Deployed to : ${mDAI.address}`)

    const exchange = await Exchange.deploy(accounts[1].address, 10)
    await exchange.deployed()
    console.log(`Exchange Deployed to : ${exchange.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

