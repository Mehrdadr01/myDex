const { ethers } = require('hardhat');
const { expect} = require('chai');

const tokens = (n)=>{
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Token', ()=>{
    // our test 
    let token ,
        accounts,
        deployer,
        receiver,
        exchange

    beforeEach(async ()=> {
        const Token = await ethers.getContractFactory('Token')
        token  = await Token.deploy('Mehrdad','MRD','1000000')
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        receiver = accounts[1]
        exchange = accounts[2]
    })


    describe('Deployment', ()=>{

        const name = 'Mehrdad'
        const symbol = 'MRD'
        const decimals = '18'
        const totalSupply = tokens('1000000')

        it('Has correct name ', async()=>{
            
            expect(await token.name()).to.equal(name)
        })
        it("Has correct symbol ", async()=>{
            
            expect(await token.symbol()).to.equal(symbol)
        })
        it("Has correct decimals ", async()=>{
            
            expect(await token.decimals()).to.equal(decimals)
        })
        it("Has correct total Supply ", async()=>{
            
            // used ethers instead of just putting the number manually || declare a tokens func to do it 
            expect(await token.totalSupply()).to.equal(totalSupply)
             
        })
        it("Assign total supply to deployer ", async()=>{
            
            expect(await token.balanceOf(deployer.address)).to.equal(totalSupply)
        })
    })

    describe('Sending Token', ()=>{
        let amount,
            transaction,
            result

        describe('Seccess', () => { 

            beforeEach(async()=>{
                amount = tokens(100)
                transaction = await token.connect(deployer).transfer(receiver.address, amount)
                result = await transaction.wait()
            })
            it('Transfer token balances',async()=> {
                
                //log accounts balance before trx
                    // console.log('deployer befor TRX',await token.balanceOf(deployer.address))
                    // console.log('receiver befor TRX',await token.balanceOf(receiver.address))
                // we first add beforeach here and log to see the result :D
                //log accounts after trx
                    // console.log('deployer after TRX',await token.balanceOf(deployer.address))
                    // console.log('receiver after TRX',await token.balanceOf(receiver.address))
    
                    // this is our test 
                expect(await token.balanceOf(deployer.address)).to.equal(tokens(999900))
                expect(await token.balanceOf(receiver.address)).to.equal(amount)
            })
            it('Emit a transfer event ',async()=>{
                const evvent = result.events[0]
               // console.log(evvent)
                expect(evvent.event).to.equal('Transfer')
                expect(evvent.args._from).to.equal(deployer.address)
                expect(evvent.args._to).to.equal(receiver.address)
                expect(evvent.args._value).to.equal(amount)
    
            })
         })

         describe('Failure', ()=>{

            it('reject insuficient balances  ', async()=>{

                const invalidAmont = tokens(100000000)
                await expect(token.connect(deployer).transfer(receiver.address, invalidAmont)).to.be.reverted   

            })
            it('reject invalid recepient', async()=>{

                const amount = tokens(100)
                await expect(token.connect(deployer).transfer('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
                
            })
         })

       
            
    })

    describe('Approving Tokens', ()=>{
        let amount,
        transaction,
        result

        beforeEach(async()=>{
            amount = tokens(100)
            transaction = await token.connect(deployer).approve(exchange.address, amount)
            result = await transaction.wait()
        })


        describe('Secces',() =>{
            it('allocates an allownce for delegated toke nsending ', async()=>{
                expect(await token.allowance(deployer.address, exchange.address)).to.equal(amount)

            })
            it('Emit an Approval event ',async()=>{
                const evvent = result.events[0]
               // console.log(evvent)
                expect(evvent.event).to.equal('Approval')
                expect(evvent.args._owner).to.equal(deployer.address)
                expect(evvent.args._spender).to.equal(exchange.address)
                expect(evvent.args._value).to.equal(amount)
    
            })

        })

        describe('Failure', ()=>{

            it('rejects a invalid spender', async()=>{
                await expect(token.connect(deployer).approve('0x0000000000000000000000000000000000000000',amount)).to.be.reverted
            })

        })
    })

    describe('Delegated Token transfers ', ()=>{
        let amount,
        transaction,
        result

        beforeEach(async()=>{
            amount = tokens(100)
            transaction = await token.connect(deployer).approve(exchange.address, amount)
            result = await transaction.wait()
        })

        describe('seccess', ()=>{

            beforeEach(async()=>{
                transaction = await token.connect(exchange).transferFrom(deployer.address,receiver.address,amount)
                result = await transaction.wait()
            })

            it('transfer token balances ',async()=>{

                expect(await token.balanceOf(deployer.address)).to.be.equal(ethers.utils.parseUnits('999900', 'ether'))
                expect(await token.balanceOf(receiver.address)).to.be.equal(amount)

            })
            it('reset allowance', async()=>{

                expect(await token.allowance(deployer.address, exchange.address)).to.be.equal(0)        
            })
            it('emits a Tranfer event ', ()=>{
                const evvent = result.events[0]
                // console.log(evvent)
                 expect(evvent.event).to.equal('Transfer')
                 expect(evvent.args._from).to.equal(deployer.address)
                 expect(evvent.args._to).to.equal(receiver.address)
                 expect(evvent.args._value).to.equal(amount)
            })

        })

        describe("failure", async()=>{
             
            const invalidAmont = tokens(100000000)
             expect(await token.connect(exchange).transferFrom(deployer.address,receiver.address,invalidAmont)).to.be.reverted
        })
    })
} )