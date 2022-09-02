import { createSelector } from "reselect";
import { get, groupBy, reject } from 'lodash'
import { ethers } from "ethers";
import  moment  from "moment";



const tokens = state => get(state, 'tokens.contracts')
const allOrders = state => get(state, 'exchange.allOrders.data', [])
const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
const filledOrders = state => get(state, 'exchange.filledOrders.data', [])

const GREEN = '#25CE8F'
const RED = '#F45353'


const openOrders = state => {
    const all  =allOrders(state)
    const filled = filledOrders(state)
    const cancelled = cancelledOrders(state)

    const openOrders = reject(all, (order)=>{
        const orderFilled = filled.some((o)=> o._id.toString() === order._id.toString() )
        const orderCancelled = cancelled.some((o)=> o._id.toString() === order._id.toString() )
        return (orderFilled || orderCancelled)

    })
    return openOrders
}

const decorateOrder = (order, tokens) => {
    let token_00_amount,
        token_01_amount
    
    /*
     NOTE : MRD token should be considered token_00, mEth is token_01
     example: giving mEth in exchange for MRD 
    */
    if(order._tokenGive === tokens[1].address){
        token_00_amount = order._amountGive // the amount of MRD we giving
        token_01_amount = order._amountGet // the amount of mEth we want to receive...
    }else{
        token_00_amount = order._amountGet  //the amount MRD we want
        token_01_amount = order._amountGive // the amount of mEth we are giving to ...
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
        formattedTimeStamp: moment.unix(order._timeStamp).format('h:mm:ss d MMM D')

        
    })
}

//  order book
export const orderBookSelector = createSelector(
    allOrders, 
    tokens, 
    (orders, tokens)=>{
   if(!tokens[0] || !tokens[1]){ return console.log('gi de ali') }

   console.log('before: ',orders, tokens)
   
   // filter orders by selected tokens
   orders = orders.filter((order)=> order._tokenGet === tokens[0].address || order._tokenGet === tokens[1].address)
   orders = orders.filter((order)=> order._tokenGive === tokens[0].address || order._tokenGive === tokens[1].address)
   
   // decorate the orders
   orders = decorateOrderBookOrders(orders, tokens)
   // group order by orderType (buy or sell )
   orders = groupBy(orders, 'orderType')
   // fetch buy orders 
   const buyOrders = get(orders, 'buy', [])
   // sort buy order by price 
   orders = {
    ...orders,
    buyOrders: buyOrders.sort((a,b)=> b.tokenPrice - a.tokenPrice)
   }
   // sort buy order by price
   const sellOrders = get(orders, 'sell', [])
   orders = {
    ...orders,
    sellOrders: sellOrders.sort((a,b)=> b.tokenPrice - a.tokenPrice)
   }
   //console.log(allOrders)
   console.log('buy orders: ', buyOrders,tokens)
   console.log('sell orders: ', sellOrders,tokens)
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

    const orderType = order._tokenGive === tokens[1].address ? 'buy' : 'sell'

    return({
        ...order,
        orderType,
        orderTypeClass: (orderType === 'buy' ? GREEN : RED),
        orderFillAction: (orderType === 'buy' ? 'sell' : 'buy')
    })



}
