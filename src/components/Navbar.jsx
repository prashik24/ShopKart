import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import SearchBar from './SearchBar.jsx'
import "../styles/navbar.css"

function Icon({ name }) {
  if (name === 'user') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="12" cy="8" r="4" /><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  )
  if (name === 'cart') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/>
      <path d="M3 4h2l2.2 11.5a2 2 0 0 0 2 1.6h8a2 2 0 0 0 2-1.6L21 8H6" />
    </svg>
  )
  return null
}

export default function Navbar(){
  const { totals } = useCart()
  const { user } = useAuth()

  return (
    <header className="navbar" role="banner">
      <div className="topbar">
        <div className="tb-row">
          <Link to="/" className="brand" aria-label="ShopKart home">
            Shop<span className="accent">Kart</span>
          </Link>

          <div className="topbar-center"><SearchBar /></div>

          <nav className="nav-right" aria-label="Account and cart">
            {user ? (
              <>
                <NavLink to="/dashboard" className="iconlink">
                  <Icon name="user"/>{' '}{user.name.split(' ')[0]}
                </NavLink>
                {/* Logout removed from navbar — now on Dashboard */}
              </>
            ) : (
              <>
                <NavLink to="/login" className="iconlink">Login</NavLink>
                <NavLink to="/signup" className="iconlink">Sign up</NavLink>
              </>
            )}
            <NavLink to="/cart" className="iconlink" aria-label="Cart">
              <Icon name="cart" />
              {totals.count > 0 && <span className="count">{totals.count}</span>}
            </NavLink>
          </nav>
        </div>
      </div>

      <nav className="catbar" aria-label="Primary">
        <div className="cat-row">
          <NavLink to="/" end>HOME</NavLink>
          <NavLink to="/catalog/Women">WOMEN</NavLink>
          <NavLink to="/catalog/Men">MEN</NavLink>
          <NavLink to="/catalog/Kids">KIDS</NavLink>
        </div>
      </nav>
    </header>
  )
}
