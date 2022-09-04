
import { useEffect } from 'react';
import config from '../config.json';
import { useDispatch} from 'react-redux';

import { loadProvider ,
         loadNetwork , 
         loadAccount ,
         loadTokens , 
         loadExchange,
         subscribeToEvent,
         loadAllOrders
        }  from '../store/interactions';

import Navbar from './Navbar';
import Markets from './Markets';
import Balance from './Balance';
import Order from './Order';
import OrderBook from './OrderBook';
import PriceChart from './PriceChart';

function App() {
  // Dispatch for later use
  const dispatch = useDispatch()

  const loadBlockchainData = async ()=>{

    // Connect ethers to blockchain 
    const provider = loadProvider(dispatch)
    // Fetch the network chainID(e.g hardhat:31337 , kovan:42)
    const chainId = await loadNetwork(provider, dispatch)
    // Reload the page when network changes 
    window.ethereum.on('chainChanged', ()=>{
      window.location.reload()
    })
    // Load current account and balance from metamask when changed
    window.ethereum.on('accountsChanged', ()=>{
        loadAccount(provider, dispatch)
    })
    
    
    // Load Token smart contract & Exchange smart contract
    const MEHRDAD = config[chainId].mehrdad
    const METH = config[chainId].mEth
    const EXCHANGE = config[chainId].exchange
    await loadTokens(provider, [MEHRDAD.address, METH.address ], dispatch)
    const exchange = await loadExchange(provider,EXCHANGE.address, dispatch)

    // Fetch all our orders: open, canceled , filled 
    loadAllOrders(provider, exchange, dispatch)
    // Listener for our events
    subscribeToEvent(exchange, dispatch)
    
  }

  useEffect( ()=>{
    loadBlockchainData()
  })

  return (  
    <div>

      <Navbar/>

      <main className='exchange grid'>
        <section className='exchange__section--left grid'>

          <Markets />

          <Balance />

          <Order />

        </section>
        <section className='exchange__section--right grid'>

         <PriceChart />

          {/* Transactions */}

          {/* Trades */}

         <OrderBook />

        </section>
      </main>

      {/* Alert */}

    </div>
  );
}

export default App;