import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { useAuth } from './AuthContext.jsx'
import { api } from '../api/client.js'

const CartCtx = createContext(null)

function reducer(state, action){
  switch(action.type){
    case 'INIT': return action.payload || []
    case 'ADD': {
      const item = action.payload
      const ex = state.find(i => i.id === item.id)
      return ex ? state.map(i => i.id===item.id ? {...i, qty:i.qty+1} : i)
                : [...state, {...item, qty:1}]
    }
    case 'REMOVE': return state.filter(i => i.id !== action.payload)
    case 'INC': return state.map(i => i.id===action.payload ? {...i, qty:i.qty+1} : i)
    case 'DEC': return state.map(i => i.id===action.payload ? {...i, qty:Math.max(1,i.qty-1)} : i)
    case 'CLEAR': return []
    default: return state
  }
}

export function CartProvider({children}){
  const { user } = useAuth()
  const [cart, dispatch] = useReducer(reducer, [])

  // load cart when user logs in
  useEffect(()=>{
    (async ()=>{
      if(!user){ dispatch({type:'INIT', payload: []}); return }
      try{
        const { cart } = await api.getCart()
        dispatch({type:'INIT', payload: cart })
      }catch{
        dispatch({type:'INIT', payload: []})
      }
    })()
  },[user?.id])

  // sync to server whenever cart changes (only if logged in)
  useEffect(()=>{
    if(!user) return
    api.putCart(cart).catch(()=>{})
  },[cart, user?.id])

  const totals = useMemo(()=>{
    const count = cart.reduce((n,i)=>n+i.qty,0)
    const amount = cart.reduce((n,i)=>n+i.price*i.qty,0)
    return {count, amount}
  },[cart])

  const value = {
    cart, totals,
    add:(p)=>dispatch({type:'ADD', payload:{id:p.id, title:p.title, price:p.price, image:p.image}}),
    remove:(id)=>dispatch({type:'REMOVE', payload:id}),
    inc:(id)=>dispatch({type:'INC', payload:id}),
    dec:(id)=>dispatch({type:'DEC', payload:id}),
    clear:()=>dispatch({type:'CLEAR'})
  }
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export function useCart(){
  const ctx = useContext(CartCtx)
  if(!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
