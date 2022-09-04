const { ethers } = require('hardhat');
const { expect} = require('chai');

const tokens = (n)=>{
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Exchange', ()=>{
    // our test 
    let deployer,
        feeAccount,
        exchange,
        token1,
        token2
        
    const feePercent = 10

    beforeEach(async ()=> {
        
        const Exchange = await ethers.getContractFactory('Exchange')
        const Token = await ethers.getContractFactory('Token')

        token1 = await Token.deploy('Mehrdad','MRD','10000000')
        token2 = await Token.deploy('Mock Dai','mDai','10000000')

        accounts = await ethers.getSigners()
        deployer = accounts[0]
        feeAccount = accounts[1]
        user1 = accounts[2]
        user2 = accounts[3]
        user3 = accounts[4]
        
        /*/ without this to transfer token to user 1 we run an error because of insiffisint balance 
            from transferFrom func from this requirement (require(_value <=  balanceOf[_from]);) 
        //  so we add 100 token to user1 account from deployer */
        let tranaction = await token1.connect(deployer).transfer(user1.address, tokens(100))
        await tranaction.wait()
        exchange  = await Exchange.deploy(feeAccount.address, feePercent)
        
    })


    describe('Deployment', ()=>{

        it('track fee account ', async()=>{
            
            expect(await exchange.feeAccount()).to.equal(feeAccount.address)
        })

        it('track fee percent ', async()=>{
            
            expect(await exchange.feePercent()).to.equal(feePercent)
        })
        
    })

    describe('Depositing Tokens', ()=>{
        let tranaction, 
            result,
            amount = tokens(10)

        beforeEach(async()=>{
            // aprove token 
            tranaction  = await token1.connect(user1).approve(exchange.address, amount)
            result = await tranaction.wait()
            //deposit token
            tranaction = await exchange.connect(user1).depositToken(token1.address, amount)
            result = await tranaction.wait()
            // if we run our 'track token deposit' test it fails becase 
            // we calling depositToken that calls depositFrom function and 
            // first it need approval :D  
        })

        describe('Secces',()=>{

            it('track token deposit ', async()=>{
                expect(await token1.balanceOf(exchange.address)).to.equal(amount)
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)

            })

            it('emits a deposit event', async()=>{
                const evvent = result.events[1] // two events emited and we want the 2nd one
                // console.log(evvent)
                 expect(evvent.event).to.equal('Deposit')
                 expect(evvent.args._token).to.equal(token1.address)
                 expect(evvent.args._user).to.equal(user1.address)
                 expect(evvent.args._amount).to.equal(amount)
                 expect(evvent.args._balance).to.equal(amount)
     
            })

        })
        describe('Failure', ()=>{

            it('fails when no tokens are approved ', async()=>{
                // do not aprove any token before depositing man :D
                await expect(exchange.connect(user1).depositToken(token1.address, amount)).to.be.reverted
            })

        })
    })

    describe('Withdrawing Tokens', ()=>{
        let tranaction, 
            result,
            amount = tokens(10)

        describe('Seccess',()=>{
            beforeEach(async()=>{
                // deposit token bfore any withdrawl 
                // aprove token 
                tranaction  = await token1.connect(user1).approve(exchange.address, amount)
                result = await tranaction.wait()
                //deposit token
                tranaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await tranaction.wait()
    
                // now withdraw token
                tranaction = await exchange.connect(user1).withdrawToken(token1.address, amount)
                result = await tranaction.wait( )
            })

            it('withdraw token funds ', async()=>{
                expect(await token1.balanceOf(exchange.address)).to.equal(0)
                expect(await exchange.tokens(token1.address, user1.address)).to.equal(0)
                expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(0)

            })

            it('emits a withdraw event', async()=>{
                const evvent = result.events[1] // two events emited and we want the 2nd one
                // console.log(evvent)
                 expect(evvent.event).to.equal('Withdraw')
                 expect(evvent.args._token).to.equal(token1.address)
                 expect(evvent.args._user).to.equal(user1.address)
                 expect(evvent.args._amount).to.equal(amount)
                 expect(evvent.args._balance).to.equal(0)
     
            })

        })
        describe('Failure', ()=>{

            it('fails for insufficient balance ', async()=>{
                // attemp to widraw befor depositing token 
                await expect(exchange.connect(user1).withdrawToken(token1.address, amount)).to.be.reverted
            })

        })
    })

    describe('Checking balances' , ()=>{

        let tranaction, 
            result,
            amount = tokens(1)
        beforeEach(async()=>{
            // approve token 
            tranaction = await token1.connect(user1).approve(exchange.address, amount)
            result = await tranaction.wait()
            // deposit token 
            tranaction = await exchange.connect(user1).depositToken(token1.address, amount)
            result = await tranaction.wait()
        })
        it('returns user balance',async()=>{
            expect(await exchange.balanceOf(token1.address, user1.address)).to.equal(amount)


        })
    })

    describe('Making orders',async ()=>{

        let tranaction,
            result,
            amount = tokens(10)
            amount1 = tokens(1)
        describe('Seccess', async()=>{
            beforeEach(async()=>{
                // deposit token bfore any orders 
                // aprove token 
                tranaction  = await token1.connect(user1).approve(exchange.address, amount)
                result = await tranaction.wait()
                //deposit token
                tranaction = await exchange.connect(user1).depositToken(token1.address, amount)
                result = await tranaction.wait()
                // makeing order

                tranaction = await exchange.connect(user1).makeOrder(token2.address, amount1, token1.address, amount1)
                result = await tranaction.wait() // without this line we have an error why ?
                // beacase we waitng for an event for last transaction not this one :D
            })

            it('tracks the new creeated order', async()=>{

                expect(await exchange.orderCounter()).to.equal(1)

            })
            it('emits an order event', async()=>{
                const evvent = result.events[0] // two events emited and we want the 2nd one
                // console.log(evvent)
                 expect(evvent.event).to.equal('Order')
                 expect(evvent.args._id).to.equal(1)
                 expect(evvent.args._user).to.equal(user1.address)
                 expect(evvent.args._tokenGet).to.equal(token2.address)
                 expect(evvent.args._amountGet).to.equal(amount1)
                 expect(evvent.args._tokenGive).to.equal(token1.address)
                 expect(evvent.args._amountGive).to.equal(amount1)
                 expect(evvent.args._timestamp).to.at.least(1)

            })

        })

        describe('Failure', async()=>{
            it('rejects with no balance',async()=>{
                await expect(exchange.connect(user1).makeOrder(token2.address,amount1,token1.address,amount1)).to.be.reverted
            })

        })
    })

    describe('Order actions', async()=>{

        let transaction,
            result,
            amount = tokens(1)
            
          
            beforeEach( async()=>{

        // deposit token bfore any orders 
                 // aprove token 
                 transaction  = await token1.connect(user1).approve(exchange.address, amount)
                 result = await transaction.wait()
                 //deposit token
                 transaction = await exchange.connect(user1).depositToken(token1.address, amount)               
                 result = await transaction.wait()
                
                       // user2 fills the order 
                 //  give user2 tokens 
                transaction = await token2.connect(deployer).transfer(user2.address,tokens(100))
                result = await transaction.wait()

                // user2 deposit token 
                // aprove token 
                transaction  = await token2.connect(user2).approve(exchange.address, tokens(2))
                result = await transaction.wait()
                //deposit token
                transaction = await exchange.connect(user2).depositToken(token2.address, tokens(2))               
                result = await transaction.wait()

                
                transaction = await exchange.connect(user1).makeOrder(token2.address, amount, token1.address, amount)
                result = await transaction.wait()             


      })    
        
            describe('Canceling the order', async()=>{

                describe('Seccess', async()=>{

                     beforeEach( async()=>{

                        transaction =await  exchange.connect(user1).cancelOrder(1);
                        result = await transaction.wait();

                     })

                     it('updates canceld orders ',async()=>{

                     expect(await exchange.cancelledOrders(1)).to.equal(true)
                     })

                     it('emits an cancel event', async()=>{
                        const evvent = result.events[0] 
                        // console.log(evvent)
                         expect(evvent.event).to.equal('Cancel')
                         expect(evvent.args._id).to.equal(1)
                         expect(evvent.args._user).to.equal(user1.address)
                         expect(evvent.args._tokenGet).to.equal(token2.address)
                         expect(evvent.args._amountGet).to.equal(amount1)
                         expect(evvent.args._tokenGive).to.equal(token1.address)
                         expect(evvent.args._amountGive).to.equal(amount1)
                         expect(evvent.args._timestamp).to.at.least(1)
        
                    })
                     

            })
                
            describe('Failure', async()=>{
               beforeEach(async()=>{
                 
                         transaction  = await token1.connect(user1).approve(exchange.address, amount)
                         result = await transaction.wait()
                         //deposit token
                         transaction = await exchange.connect(user1).depositToken(token1.address, amount)               
                         result = await transaction.wait()
                         // make an order 
                         transaction = await exchange.connect(user1).makeOrder(token2.address, amount1, token1.address, amount1)
                         result = await transaction.wait()    
                 })   
                            
                 it('rejects invalid order id ',async()=>{
    

                         const InvalidOrderId = 99
                         await expect(exchange.connect(user1).cancelOrder(InvalidOrderId)).to.be.reverted                     
     
                 })

                 it('rejects unathorized cancelation', async()=>{

                           
                     //await expect(exchange.connect(user3).cancelOrder(1))
                     await expect(exchange.connect(user2).cancelOrder(1)).to.be.reverted
                     
                 }) 
         })

        })

        

            describe('Filling Orders',async()=>{
                
                describe('Seccess', async()=>{

                    beforeEach(async()=>{          


                        transaction = await exchange.connect(user2).fillOrder('1')
                        result = await transaction.wait()

                       

                })

                        it('execute trade and charge the fee ',async()=>{
                            // ensure trade happens 
                            // token give 
                            expect(await exchange.balanceOf(token1.address,user1.address)).to.equal(tokens(0))
                            expect(await exchange.balanceOf(token1.address,user2.address)).to.equal(tokens(1))
                            expect(await exchange.balanceOf(token1.address,feeAccount.address)).to.equal(tokens(0))

                            // token get 
                            expect(await exchange.balanceOf(token2.address,user1.address)).to.equal(tokens(1))
                            expect(await exchange.balanceOf(token2.address,user2.address)).to.equal(tokens(0.9))
                            expect(await exchange.balanceOf(token2.address,feeAccount.address)).to.equal(tokens(0.10))

                        })
                        
                        it('update filledorder',async()=>{

                            expect(await exchange.FilledOrders(1)).to.equal(true)
                        })
                        it('emits a trade event ',async()=>{

                                const evvent = result.events[0] 
                            //  console.log(evvent)
                                expect(evvent.event).to.equal('Trade')

                                expect(evvent.args._id).to.equal(1)
                                expect(evvent.args._user).to.equal(user2.address)
                                expect(evvent.args._tokenGet).to.equal(token2.address)
                                expect(evvent.args._amountGet).to.equal(tokens(1))
                                expect(evvent.args._tokenGive).to.equal(token1.address)
                                expect(evvent.args._amountGive).to.equal(tokens(1))
                                expect(evvent.args._creator).to.equal(user1.address)
                                expect(evvent.args._timestamp).to.at.least(1)

                        })
                })

                describe('Failure', async()=>{
                    it('rejects invalid id ',async()=>{
                      
                        invalidID = 9999
                        await expect(exchange.connect(user2).fillOrder(invalidID)).to.be.reverted
                    })
                    it('reject already filled orders ',async()=>{

                        transaction = await exchange.connect(user2).fillOrder(1)
                        result = await transaction.wait()

                        await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
                    })
                    it('rrejects cancelled order', async()=>{

                        transaction = await exchange.connect(user1).cancelOrder(1)
                        result = await transaction.wait()

                        await expect(exchange.connect(user2).fillOrder(1)).to.be.reverted
                    })
                })
            }) 
    })
})
