import {createStore, combineReducers, applyMiddleware, legacy_createStore} from 'redux';
//import {configureStore} from '@reduxjs/toolkit'
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';

 // import reducers 

 import {provider, tokens, exchange} from './reducers';

const reducer = combineReducers({
    provider,
    tokens,
    exchange
})

const initialState = {}
const middleware = [thunk]

const store = createStore(reducer, initialState,composeWithDevTools(applyMiddleware(...middleware)))






export default store

