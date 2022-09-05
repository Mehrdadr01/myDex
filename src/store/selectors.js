import { createSelector } from "reselect";
import { get, groupBy, reject , maxBy, minBy} from 'lodash'
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
/////////// All Filled Orders ///////////
export const filledOrdersSelector = createSelector(allOrders, tokens , // allOrders must be replace with filledOrders (this is just because we don't have filledOrders yet )
    (orders, tokens)=>{
        if(!tokens[0] || !tokens[1]){ return console.log() }
      
        // filter orders by selected tokens
        orders = orders.filter((order)=> order._tokenGet === tokens[0].address || order._tokenGet === tokens[1].address)
        orders = orders.filter((order)=> order._tokenGive === tokens[0].address || order._tokenGive === tokens[1].address)
        /* 
        Step 01. sort orders by time ascending
        Step 02. apply orders by color (decorate orders)
        Step 03. sort order by time descending (for UI purposes )  
        */
       // Step 01
        orders = orders.sort((a,b) => a._timestamp - b._timestamp) // Step 01
        orders = decorateFilledOrders(orders, tokens)              // Step 02
        orders = orders.sort((a,b)=> b._timestamp - a._timestamp)  // Step 03 
        console.log(orders)
        return orders
})
const decorateFilledOrders = (orders, tokens )=>{
    let previousOrder = orders[0]
    return (
        orders.map((order)=>{
            order = decorateOrder(order, tokens)
            order = decorateFilledOrder(order, previousOrder)
            previousOrder = order // update the previous order after decoration 
            return order 
        })
    )
}
const decorateFilledOrder = (order , previousOrder)=>{
    return ({
        ...order, 
        tokenPriceClass: tokenPriceClass(order.tokenPrice, order._id, previousOrder)
    })
}
const tokenPriceClass = (currentTokenPrice,orderID,previousOrder) => {
    if (previousOrder._id === orderID){ // show green for just 1 order or our first order 
        return GREEN
    }
    if(previousOrder.tokenPrice <= currentTokenPrice){
        return GREEN }else{ // return green if the price goes up 
            return RED      // and red if goes down 
        }
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
        formattedTimeStamp: moment.unix(order._timestamp).format('h:mm:ss d MMM D')

        
    })
}
/////////////  Order book ///////////////

export const orderBookSelector = createSelector( allOrders,tokens, 
    (orders, tokens)=>{
   if(!tokens[0] || !tokens[1]){ return console.log() }

  // console.log('before: ',orders, tokens)
   
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
  // console.log('buy orders: ', buyOrders,tokens)
   //console.log('sell orders: ', sellOrders,tokens)
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
//////////// Price chart ///////////////

export const priceChartSelector = createSelector(
    allOrders, // it should be the open orders not all orders (modified this later )
    tokens,
    (orders, tokens) => {
        if(!tokens[0] || !tokens[1]) { return }
        //filter orders by selected tokens
        orders = orders.filter((order)=> order._tokenGet === tokens[0].address || order._tokenGet === tokens[1].address)
        orders = orders.filter((order)=> order._tokenGive === tokens[0].address || order._tokenGive === tokens[1].address)
        
        //sort orders by date 4 history comparison 
        orders = orders.sort((a,b) => a._timestamp - b._timestamp) 
        // Decorate the orders - add display attributes 
        orders = orders.map((order)=> decorateOrder(order, tokens))
        //console.log('Before : ', orders)
       
        let lastOrder, secondLastOrder //= orders[orders.length -1 ]
        [lastOrder, secondLastOrder] = orders.slice(orders.length, orders.length - 2)
        const lastPrice = get(lastOrder, 'tokenPrice', 0) // last price 
        const secondLastPrice = get(secondLastOrder, 'tokenPrice', 0)
       // console.log('graphData',graphData)
        return({
            lastPrice,
            lastPriceChange: (lastPrice >= secondLastPrice ? '+' : '-'),
            series: [{
                data: createGraphData(orders)
            }]
        })

    }
)

const createGraphData = (orders) =>{
    // group the orders by hour for the graph 
    orders = groupBy(orders, (order) => moment.unix(order._timestamp).startOf('hour').format())
    //console.log('After : ', orders)
    // get each hour where data exist 
    const hours = Object.keys(orders)

    // creating the graph series 
    const graphData = hours.map((hour)=>{
        // fetch all orders from current hour 
        const group = orders[hour]
        //calc price values : open , high, low , close 
        const open = group[0]                // first order of the hour 
        const high = maxBy(group, 'tokenPrice')// highest price 
        const low = minBy(group, 'tokenPrice') // lowest price 
        const close = group[group.length -1] // last order of the hour 
        return({
            x: new Date(hour),
            y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice]
        })
    })

    return graphData

}