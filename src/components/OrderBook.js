import { useSelector } from "react-redux";
import sort from '../assets/sort.svg';
import { orderBookSelector } from "../store/selectors";

const OrderBook = () => {

    const symbols = useSelector(state => state.tokens.symbols)
    const orderBook = useSelector(orderBookSelector)
     
    return (
      <div className="component exchange__orderbook">
        <div className='component__header flex-between'>
          <h2>Order Book</h2>
        </div>
  
        <div className="flex">

          {!orderBook || orderBook.sellOrders.length === 0 ? (
            <p className="flex-center">No Sell Orders</p>
          ):(
            <table className='exchange__orderbook--sell'>
            <caption>Selling</caption>
            <thead>
              <tr>
                <th>{symbols && symbols[0]}<img src={sort} alt="Sort "/></th>
                <th>{symbols && symbols[0]}/{symbols && symbols[1]}<img src={sort} alt="sort "/></th>
                <th>{symbols && symbols[1]}<img src={sort} alt="Sort "/></th>
              </tr>
            </thead>
            <tbody>
              { /*//////////// MAPPING SELL ORDERS   ////////////*/}
              {orderBook && orderBook.sellOrders.map((order, index)=>{
                return(
                  <tr key={index}>
                    <td>{order.token_00_amount}</td>
                    <td style={{color: `${order.orderTypeClass}`}}>{order.tokenPrice}</td>
                    <td>{order.token_01_amount}</td>
                </tr>

                )
              })}
             
            </tbody>
          </table>
          )}
  
          <div className='divider'></div>
            {!orderBook || orderBook.buyOrders.length === 0 ? (
              <p className="flex-center">No Buy Orders</p>
            ):(
              <table className='exchange__orderbook--buy'>
              <caption>Buying</caption>
              <thead>
                <tr>
                  <th>{symbols && symbols[0]}<img src={sort} alt="Sort "/></th>
                  <th>{symbols && symbols[0]}/{symbols && symbols[1]}<img src={sort} alt="sort "/></th>
                  <th>{symbols && symbols[1]}<img src={sort} alt="Sort "/></th>
                </tr>
              </thead>
              <tbody>
              { /*//////////// MAPPING BUY ORDERS   ////////////*/}
                {orderBook && orderBook.buyOrders.map((order, index)=>{
                  return(
                    <tr key={index}>
                      <td>{order.token_00_amount}</td>
                      <td style={{color: `${order.orderTypeClass}`}}>{order.tokenPrice}</td>
                      <td>{order.token_01_amount}</td>
                </tr>
                  )
                })}
                
            </tbody>
          </table>
            )}
          
        </div>
      </div>
    );
  }
  
  export default OrderBook;