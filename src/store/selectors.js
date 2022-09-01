import { createSelector } from "reselect";
import { get, groupBy } from 'lodash'
import { ethers } from "ethers";
import  moment  from "moment";



const tokens = state => get(state, 'tokens.contracts')
const allOrders = state => get(state, 'exchange.allOrders.data', [])

const GREEN = '#25CE8F'
const RED = '#F45353'

const decorateOrder = (order, tokens) => {
    let token_00_amount,
        token_01_amount
    
    /*
     NOTE : MRD token should be considered token_00, mEth is token_01
     example: giving mEth in exchange for MRD 
    */
    if(order.tokenGive === tokens[1].address){
        token_00_amount = order.amountGive // the amount of MRD we giving
        token_01_amount = order.amountGet // the amount of mEth we want to receive...
    }else{
        token_00_amount = order.amountGet  //the amount MRD we want
        token_01_amount = order.amountGive // the amount of mEth we are giving to ...
    }
    // calc the token price to 5 decimal places
    const precision = 100000
    let tokenPrice = (token_01_amount) / (token_00_amount)
    tokenPrice = Math.round(tokenPrice * precision) / precision 
    return({
        ...order,
        token_00_amount: ethers.utils.formatUnits(token_00_amount, "ether"),
        token_01_amount: ethers.utils.formatUnits(token_01_amount, "ether"),
        tokenPrice : tokenPrice,
        formattedTimeStamp: moment.unix(order.timeStamp).format('h:mm:ss d MMM D')

        
    })
}

//  order book
export const orderBookSelector = createSelector(
    allOrders, 
    tokens, 
    (orders, tokens)=>{
   if(!tokens[0] || !tokens[1]){ return console.log('gi de ali') }

  // console.log(tokens[1])
   
   // filter orders by selected tokens
   orders = orders.filter((o)=> o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address)
   orders = orders.filter((o)=> o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address)
  // console.log(orders)

   // decorate the orders
   orders = decorateOrderBookOrders(orders, tokens)
   // group order by orderType
   orders = groupBy(orders, 'orderType')
   // fetch buy/sell orders 
   const buyOrders = get(orders, 'buy', [])
   const sellOrders = get(orders, 'sell', [])
   // sort buy/sell order by price 
   orders = {
    ...orders,
    buyOrders: buyOrders.sort((a,b)=> b.tokenPrice - a.tokenPrice)
   }
   orders = {
    ...orders,
    sellOrders: sellOrders.sort((a,b)=> b.tokenPrice - a.tokenPrice)
   }
   console.log(tokens[1])
   return orders
})
const decorateOrderBookOrders = (orders, tokens) => {

   return(
    orders.map((order) => {
        order = decorateOrder(order, tokens)
        order = decorateOrderBookOrder(order, tokens)
        return(order)
      
     })
   )
}

const decorateOrderBookOrder = (order, tokens) => {

    const orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell'

    return({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN : RED),
        orderFillAction: (orderType === 'buy' ? 'sell' : 'buy')
    })



}
