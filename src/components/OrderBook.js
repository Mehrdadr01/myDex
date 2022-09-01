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
              <tr>
                <td></td>
                <td></td>
                <td></td>
              </tr>
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
                <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
            </tbody>
          </table>
            )}
          
        </div>
      </div>
    );
  }
  
  export default OrderBook;