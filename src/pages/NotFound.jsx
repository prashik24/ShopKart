import { Link } from 'react-router-dom'
export default function NotFound(){
  return (
    <div className="page container">
      <h2>404 — Not Found</h2>
      <p>Try the <Link to="/">home page</Link>.</p>
    </div>
  )
}
