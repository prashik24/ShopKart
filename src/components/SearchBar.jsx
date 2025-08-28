import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function SearchBar(){
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const submit = (e)=>{
    e.preventDefault()
    const category = params.get('category') || ''
    navigate(`/catalog${category ? `/${category}`:''}?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={submit} className="search" role="search" aria-label="Search products">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <circle cx="11" cy="11" r="7"></circle>
        <path d="m21 21-4.3-4.3"></path>
      </svg>
      <input
        placeholder="Search products"
        value={q}
        onChange={e=>setQ(e.target.value)}
      />
    </form>
  )
}
