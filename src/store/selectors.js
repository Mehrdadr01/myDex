import { createSelector } from "reselect";
import { get, groupBy, reject , maxBy, minBy} from 'lodash'
import { ethers } from "ethers";
import  moment  from "moment";

const account = state => get(state, 'provider.account')
const tokens = state => get(state, 'tokens.contracts')
const events = state =>get(state, 'exchange.events')

const allOrders = state => get(state, 'exchange.allOrders.data', [])
const cancelledOrders = state => get(state, 'exchange.cancelledOrders.data', [])
const filledOrders = state => get(state, 'exchange.filledOrders.data', [])


const GREEN = '#25CE8F'
const RED = '#F45353'


const openOrders = state => {
    const all = allOrders(state)
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
export const filledOrdersSelector = createSelector(filledOrders, tokens , 
    (orders, tokens)=>{
        if(!tokens[0] || !tokens[1]){ return }
      
        // filter orders by selected tokens
        orders = orders.filter((order)=> order._tokenGet === tokens[0].address || order._tokenGet === tokens[1].address)
        orders = orders.filter((order)=> order._tokenGive === tokens[0].address || order._tokenGive === tokens[1].address)
        /* 
        Step 01. sort orders by time ascending
        Step 02. apply orders by color (decorate orders)
        Step 03. sort order by time descending (for UI purposes )  
        */
        orders = orders.sort((a,b) => a._timestamp - b._timestamp) // Step 01
        orders = decorateFilledOrders(orders, tokens)              // Step 02
        orders = orders.sort((a,b)=> b._timestamp - a._timestamp)  // Step 03 
        
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
/////////// My open orders ////////////
export const myOpenOrdersSelector =createSelector(account , tokens , openOrders,  
    (account, tokens, orders)=>{
        if(!tokens[0] || !tokens[1]) { return }
        // Filter orders created bt current account 
        orders = orders.filter((order)=> order._user === account) 
        // filter orders by selected tokens
        orders = orders.filter((order)=> order._tokenGet === tokens[0].address || order._tokenGet === tokens[1].address)
        orders = orders.filter((order)=> order._tokenGive === tokens[0].address || order._tokenGive === tokens[1].address)
        // decorate orders - adding attributes for UI
        orders = decorateMyOpenOrders(orders, tokens)
        // Sort order by time descending 
        orders = orders.sort((a,b)=> b._timestamp - a._timestamp)

        return orders
})
const decorateMyOpenOrders = (orders, tokens)=>{
    return(
        orders.map((order)=>{
            order = decorateOrder(order, tokens )
            order = decorateMyOpenOrder(order, tokens)
            return (order)
        })
    )
} 
const decorateMyOpenOrder = (order, tokens)=>{
    let orderType = order._tokenGet === tokens[1].address ? 'buy' : 'sell'

    return ({
        ...order,
        orderType,
        orderTypeClass:(orderType=== 'buy' ? GREEN : RED )
    })
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
///////////// My Filled Orders /////////////
export const myFilledOrdersSelector =createSelector(account , tokens , filledOrders, 
    (account, tokens, orders)=>{
        if(!tokens[0] || !tokens[1]) { return }
        // find our orders 
        orders = orders.filter((order)=> order._user === account || order._creator === account)
        // filter orders by selected trading pair 
        orders = orders.filter((order)=> order._tokenGet === tokens[0].address || order._tokenGet === tokens[1].address)
        orders = orders.filter((order)=> order._tokenGive === tokens[0].address || order._tokenGive === tokens[1].address)
        // sort by time descending 
        orders = orders.sort((a,b)=> b._timestamp - a._timestamp)
        // decorate orders for UI 
        orders = decorateMyFilledOrders(orders, account, tokens)
        
        return orders
})
const decorateMyFilledOrders = (orders, account,tokens)=>{
    return(
        orders.map((order)=>{
            order = decorateOrder(order, tokens)
            order = decorateMyFilledOrder(order, account, tokens)
            return (order)
        })
    )
} 
const decorateMyFilledOrder = (order, account,tokens)=>{
    const myOrder = order._creator === account
    let orderType
    if(myOrder){
        orderType = order._tokenGive === tokens[1].address ? 'buy' : 'sell'
    }else{
        orderType = order._tokenGive === tokens[1].address ? 'sell' : 'buy'
    }
    return ({
        ...order,
        orderType,
        orderClass:(orderType=== 'buy' ? RED : GREEN),
        orderSign:(orderType=== 'buy' ? '-' : '+')
        
    })
}
/////////////  Order book ///////////////

export const orderBookSelector = createSelector( openOrders,tokens, 
    (orders, tokens)=>{
   if(!tokens[0] || !tokens[1]){ return }
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

export const priceChartSelector = createSelector(filledOrders,tokens,
    (orders, tokens) => {
        if(!tokens[0] || !tokens[1]) { return }
        //filter orders by selected tokens
        orders = orders.filter((order)=> order._tokenGet === tokens[0].address || order._tokenGet === tokens[1].address)
        orders = orders.filter((order)=> order._tokenGive === tokens[0].address || order._tokenGive === tokens[1].address)
        
        //sort orders by date 4 history comparison 
        orders = orders.sort((a,b) => a._timestamp - b._timestamp) 
        // Decorate the orders - add display attributes 
        orders = orders.map((order)=> decorateOrder(order, tokens))
        
        let lastOrder, secondLastOrder //= orders[orders.length -1 ]
        [secondLastOrder ,lastOrder] = orders.slice(orders.length - 2, orders.length)
        const lastPrice = get(lastOrder, 'tokenPrice', 0) // last price 
        const secondLastPrice = get(secondLastOrder, 'tokenPrice', 0)
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
///////////// My Events ///////////////
export const myEventsSelector = createSelector (account, events,
    (account, events)=>{
        events = events.filter((e)=> e.args._user === account)

        return events
    })