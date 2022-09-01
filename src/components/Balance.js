import { useSelector , useDispatch } from "react-redux";
import mrd from '../assets/mrd.svg'
import eth from '../assets/eth.svg'

import { loadBalances , 
         transferTokens
        } from "../store/interactions";

import { useEffect ,useState, useRef} from 'react';

const Balance = () => {

    const [isDeposit, setIsDeposit] = useState(true)
    const [token01TransferAmount,setToken01TransferAmount] = useState(0)
    const [token02TransferAmount,setToken02TransferAmount] = useState(0)

    const dispatch = useDispatch()
    const symbols = useSelector(state => state.tokens.symbols)
    const exchange = useSelector(state=> state.exchange.contract)
    const tokens = useSelector(state=> state.tokens.contracts)
    const account = useSelector(state=> state.provider.account) 
    const provider = useSelector(state=> state.provider.connection)

    const tokenBalances = useSelector(state => state.tokens.balances)
    const exchangeBalances = useSelector(state => state.exchange.balances)
    const transferInProgress = useSelector(state => state.exchange.transferInProgress)

    const depositRef = useRef(null)
    const withdrawRef = useRef(null)
    const tabHandler = (e)=>{
      if(e.target.className !== depositRef.current.className){
        e.target.className = 'tab tab--active'
        depositRef.current.className = 'tab'
        setIsDeposit(false)
      }else{
        e.target.className = 'tab tab--active'
        withdrawRef.current.className = 'tab'
        setIsDeposit(true)
      }
    }

    /*
      1. Do the deposit
      2. Notify the app that deposit pending 
      3. Get confirm from blockchain that deposit was success
      4. Notify app that deposit was a success
      5. Handle transfer fails - notify the app
    */

    const amountHandler = (e,token)=>{
      if(token.address === tokens[0].address){
        setToken01TransferAmount(e.target.value)
      }else{
        setToken02TransferAmount(e.target.value)
      }
    }
    const depositHandler = (e, token)=>{
        e.preventDefault()
        
        if(token.address === tokens[0].address){
          transferTokens(provider, exchange, 'Deposit',token,token01TransferAmount,dispatch) 
          setToken01TransferAmount(0)
        }else{
          transferTokens(provider, exchange, 'Deposit',token,token02TransferAmount,dispatch)
          setToken02TransferAmount(0)
        }
    }

    const withdrawHandler = (e, token)=>{
        e.preventDefault()

        if(token.address === tokens[0].address){
          setToken01TransferAmount(0)
          transferTokens(provider, exchange, 'Withdraw',token,token01TransferAmount,dispatch)
        }else{
          setToken02TransferAmount(0)
          transferTokens(provider, exchange, 'Withdraw',token,token02TransferAmount,dispatch)
        } 
  }

    useEffect(()=>{
        if(exchange && tokens[0] && tokens[1] && account){
            loadBalances(exchange, tokens, account, dispatch)
        } // transferInProgress
    },[exchange, tokens, account,transferInProgress,dispatch]) // if these vars change do the if statement again 

    return (
      <div className='component exchange__transfers'>
        <div className='component__header flex-between'>
          <h2>Balance</h2>
          <div className='tabs'>
            <button onClick={tabHandler} ref={depositRef} className='tab tab--active'>Deposit</button>
            <button onClick={tabHandler} ref={withdrawRef} className='tab'>Withdraw</button>
          </div>
        </div>
  
        {/* Deposit/Withdraw Component 1 (Mehrdad) */}
  
        <div className='exchange__transfers--form'>
          <div className='flex-between'>
            <p><small>Token</small><br/><img src={mrd} alt='Token Logo'/>{symbols && symbols[0]}</p>
            <p><small>Wallet</small><br/>{tokenBalances && tokenBalances[0]}</p>
            <p><small>Exchange</small><br/>{exchangeBalances && exchangeBalances[0]}</p>
          </div>
  
          <form onSubmit={isDeposit ? (e)=> depositHandler(e, tokens[0]) : (e)=> withdrawHandler(e, tokens[0])}>
            <label htmlFor="token0">{symbols && symbols[0]} Amount</label>
            <input 
              type="text" 
              id='token0' 
              placeholder='0.0000' 
              value={token01TransferAmount === 0 ? '' : token01TransferAmount}
              onChange={(e)=> amountHandler(e,tokens[0])}
              />
  
            <button className='button' type='submit'>    
              {isDeposit ? (
                <span>Deposit Token</span>
              ):(
                <span>Withdraw Token</span>
              )}
            </button>
          </form>
        </div>
  
        <hr />
  
        {/* Deposit/Withdraw Component 2 (mETH) */}
  
        <div className='exchange__transfers--form'>
          <div className='flex-between'>
            <p><small>Token</small><br/><img src={eth} alt='Token Logo'/>{symbols && symbols[1]}</p>
            <p><small>Wallet</small><br/>{tokenBalances && tokenBalances[1]}</p>
            <p><small>Exchange</small><br/>{exchangeBalances && exchangeBalances[1]}</p>
          </div>
  
          <form onSubmit={isDeposit ? (e)=> depositHandler(e, tokens[1]) : (e)=> withdrawHandler(e, tokens[1])}>
            <label htmlFor="token1">{symbols && symbols[1]} Amount</label>
            <input 
              type="text" 
              id='token1' 
              placeholder='0.0000'
              value={token02TransferAmount === 0 ? '' : token02TransferAmount}
              onChange={(e)=> amountHandler(e,tokens[1])}
              />
  
            <button className='button' type='submit'>
              {isDeposit ? (
                <span>Deposit Token</span>
              ):(
                <span>Withdraw Token</span>
              )}
            </button>
          </form>
        </div>
  
        <hr />
      </div>
    );
  }
  
  export default Balance;
  