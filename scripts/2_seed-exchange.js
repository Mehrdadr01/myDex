// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
//const hre = require("hardhat");// this line used when we want to run hardhat as library witj node script.js
// cause we use npx hardhat script.js we don't need it

const { ethers } = require("hardhat");
const config = require('../src/config.json')

const tokens = (n) =>{
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const wait =(seconds) =>{
    const millSec = seconds * 1000
    return new Promise(resolve => setTimeout(resolve, millSec))
        
}

async function main() {

    // fetch accounts from wallet - thwse are unlocked account 

    const accounts = await ethers.getSigners()

    const {chainId} = await ethers.provider.getNetwork()
    console.log(`Using chainID, ${chainId}`)

    // fetch deployed tokens
    const mehrdad = await ethers.getContractAt('Token', config[chainId].mehrdad.address)
    console.log(`mehrdad Token fetched: ${mehrdad.address}`)

    const mEth = await ethers.getContractAt('Token', config[chainId].mEth.address)
    console.log(`mEth Token fetched: ${mEth.address}`)

    const mDai = await ethers.getContractAt('Token', config[chainId].mDai.address)
    console.log(`mDai Token fetched: ${mDai.address}`)

    // fetch deployed exchange
    const exchange = await ethers.getContractAt('Exchange', config[chainId].exchange.address) 
    console.log(`exchange Token fetched: ${exchange.address}`)

    // give token to account 1 because we assign all token to user0 the deployer at constructor in Token smart contract 
    const sender = accounts[0]
    const receiver = accounts[1]
    let amount = tokens(10000)

    
    let transaction ,
        result 
    transaction = await mEth.connect(sender).transfer(receiver.address, amount)
    console.log(`Transfer ${amount} tokens from ${sender.address} to ${receiver.address}\n`)

    // setup exchange user

    const user1 = accounts[0]
    const user2 = accounts[1]
    amount = tokens(10000)

    // user1 approve 10000 mehrdad tokens 
    transaction = await mehrdad.connect(user1).approve(exchange.address, amount)
    result =await transaction.wait()
    console.log(`Approved ${amount} token from ${user1.address}`)

    //user1 deposit 10000 mehrdad
    transaction = await exchange.connect(user1).depositToken(mehrdad.address, amount)
    result = await transaction.wait()
    console.log(`Deposit ${amount} mehrdad from ${user1.address}`)

    // user2 approve 10000 mEth tokens 
     transaction = await mEth.connect(user1).approve(exchange.address, amount)
     result =await transaction.wait()
     console.log(`Approved ${amount} token from ${user2.address}`)

    //user2 deposit 10000 mEth
    transaction = await exchange.connect(user1).depositToken(mEth.address, amount)
    result = await transaction.wait()
    console.log(`Deposit ${amount} mEth from ${user2.address}`)

    


 
                     ////////////////////////////
                    ////  Seed Cancel Order ////

    //user1 make order to get tokens 
    let orderId
    transaction = await exchange.connect(user1).makeOrder(mEth.address, tokens(5),mehrdad.address, tokens(1))
    result = await transaction.wait()
    console.log(`Make order from ${user1.address}`)
    // new added line 
    //await wait(1)
    //user1 cancel order

    orderId = result.events[0].args._id
    transaction = await exchange.connect(user1).cancelOrder(orderId)
    result = await transaction.wait()
    console.log(`Canceled order from ${user1.address}`)

    // wait a second :D
    await wait(1)


                     ////////////////////////////
                    ////  Seed filled Order ////
    // user1 make an order
    transaction = await exchange.connect(user1).makeOrder(mEth.address, tokens(4),mehrdad.address, tokens(2))
    result = await transaction.wait()
    console.log(`Make order from ${user1.address}`)

    //console.log()

    //user2 fills the order 
    orderId = result.events[0].args._id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    result = await transaction.wait()
    console.log(`Filled order by ${user2.address}`)

    // wait a second 

    await wait(1)
    
    
    // user1 make another order
    transaction = await exchange.connect(user1).makeOrder(mEth.address, tokens(4),mehrdad.address, tokens(2))
    result = await transaction.wait()
    console.log(`Make order from ${user1.address}`)

    //user2 fills the order 
    orderId = result.events[0].args._id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    result = await transaction.wait()
    console.log(`Filled order by ${user2.address}`)

    await wait(1)


    // user1 makes final order
    transaction = await exchange.connect(user1).makeOrder(mEth.address, tokens(1),mehrdad.address, tokens(1))
    result = await transaction.wait()
    console.log(`Make order from ${user1.address}`)

    //user2 fills the order 
    orderId = result.events[0].args._id
    transaction = await exchange.connect(user2).fillOrder(orderId)
    result = await transaction.wait()
    console.log(`Filled order by ${user2.address}`)

    await wait(1)



                    ////////////////////////////
                    ////  Seed open Order ////
    //user1
    for(let i=0 ; i<=10 ; i++){
        transaction= await exchange.connect(user1).makeOrder(mEth.address,tokens(1 * i), mehrdad.address, tokens(1))
        result = await transaction.wait()

        console.log(`Make order from ${user1.address}`)
        await wait(1)
    }
    // user2 
    for(let i=0 ; i<=10 ; i++){
        transaction= await exchange.connect(user2).makeOrder(mehrdad.address,tokens(1), mEth.address, tokens(1*i))
        result = await transaction.wait()

        console.log(`Make order from ${user2.address}`)
        await wait(1)
    }



















    // setup users 

    // distribute tokens 

    // deposit token to exchange 

    // make order 

    // cancel order 

    // fill order



}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});