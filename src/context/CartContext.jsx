// shopkart/src/context/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { useAuth } from './AuthContext.jsx'
import { api } from '../api/client.js'

const CartCtx = createContext(null)

// --- helpers -------------------------------------------------------------
function sameKey(a, b) {
  const A = a?.id ?? a?.productId
  const B = b?.id ?? b?.productId
  return String(A) === String(B)
}
function keyOf(x) {
  return String(x?.id ?? x?.productId)
}

// --- reducer -------------------------------------------------------------
function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return Array.isArray(action.payload) ? action.payload : []

    case 'ADD': {
      const item = action.payload
      const idx = state.findIndex(i => sameKey(i, item))
      if (idx === -1) {
        return [
          ...state,
          {
            id: item.id ?? item.productId,
            productId: item.productId ?? item.id,
            title: item.title,
            price: Number(item.price) || 0,
            image: item.image || '',
            qty: Math.max(1, Number(item.qty) || 1),
          },
        ]
      }
      return state.map((i, n) =>
        n === idx ? { ...i, qty: i.qty + Math.max(1, Number(item.qty) || 1) } : i
      )
    }

    case 'REMOVE': {
      const id = String(action.payload)
      return state.filter(i => keyOf(i) !== id)
    }

    case 'INC': {
      const id = String(action.payload)
      return state.map(i => (keyOf(i) === id ? { ...i, qty: i.qty + 1 } : i))
    }

    case 'DEC': {
      const id = String(action.payload)
      return state.map(i =>
        keyOf(i) === id ? { ...i, qty: Math.max(1, i.qty - 1) } : i
      )
    }

    case 'CLEAR':
      return []

    default:
      return state
  }
}

// --- provider ------------------------------------------------------------
export function CartProvider({ children }) {
  const { user, loading } = useAuth()
  const [cart, dispatch] = useReducer(reducer, [])

  // Track whether we just hydrated from server; skip first save after that
  const hydratedRef = useRef(false)

  // Load cart only after auth check is finished and user is present
  useEffect(() => {
    let ignore = false
    ;(async () => {
      if (loading) return
      if (!user) {
        hydratedRef.current = false
        dispatch({ type: 'INIT', payload: [] })
        return
      }

      // 👇 Small settle delay so the session cookie from /login is available
      await new Promise(r => setTimeout(r, 120))

      try {
        const res = await api.getCart()
        if (ignore) return
        const srv = Array.isArray(res?.cart) ? res.cart : []
        dispatch({ type: 'INIT', payload: srv })
        hydratedRef.current = true
      } catch {
        if (!ignore) {
          dispatch({ type: 'INIT', payload: [] })
          hydratedRef.current = true
        }
      }
    })()
    return () => {
      ignore = true
    }
  }, [user?.id, loading])

  // Debounced save to server whenever cart changes (and user exists)
  useEffect(() => {
    if (loading || !user) return

    // Skip the very first save right after INIT/hydrate
    if (hydratedRef.current) {
      hydratedRef.current = false
      return
    }

    const t = setTimeout(() => {
      api.putCart(cart).catch(() => {
        /* ignore transient errors */
      })
    }, 300)

    return () => clearTimeout(t)
  }, [cart, user?.id, loading])

  const totals = useMemo(() => {
    const count = cart.reduce((n, i) => n + Number(i.qty || 0), 0)
    const amount = cart.reduce(
      (n, i) => n + Number(i.price || 0) * Number(i.qty || 0),
      0
    )
    return { count, amount }
  }, [cart])

  const value = useMemo(
    () => ({
      cart,
      totals,
      add: p => dispatch({ type: 'ADD', payload: p }),
      remove: id => dispatch({ type: 'REMOVE', payload: id }),
      inc: id => dispatch({ type: 'INC', payload: id }),
      dec: id => dispatch({ type: 'DEC', payload: id }),
      clear: () => dispatch({ type: 'CLEAR' }),
    }),
    [cart, totals]
  )

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export function useCart() {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
