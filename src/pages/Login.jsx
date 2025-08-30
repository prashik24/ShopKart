import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { products } from "../data/products.js";
import "../styles/auth.css";

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function Login() {
  const { user, login } = useAuth();
  const { add } = useCart();
  const [params] = useSearchParams();

  const intent = params.get("intent") || "";   // e.g. "add"
  const pid    = params.get("pid")    || "";   // product id to add
  const next   = params.get("next")   || "/";  // DEFAULT → HOME

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (user && !intent) {
      navigate("/", { replace: true });
    }
  }, [user, intent, navigate]);

  const submit = async (e) => {
    e.preventDefault();

    const problems = [];
    if (!email) problems.push("email is missing");
    else if (!emailOk(email)) problems.push("email is invalid");
    if (!password) problems.push("password is missing");
    else if (password.length < 6) problems.push("password must be at least 6 characters");

    if (problems.length) {
      setError(`Please complete the form: ${problems.join(", ")}.`);
      return;
    }

    setError("");
    try {
      await login({ email, password });

      if (intent === "add" && pid) {
        const product = products.find((p) => String(p.id) === String(pid));
        if (product) add(product);
        navigate("/cart", { replace: true });
        return;
      }

      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in");
    }
  };

  return (
    <div className="auth-center">
      <div className="auth-logo">
        Shop<span className="accent">Kart</span>
      </div>

      <form className="auth-card" onSubmit={submit} noValidate>
        <h2>Login</h2>

        {intent === "add" && (
          <div className="auth-note warn">Please log in to add items to your cart.</div>
        )}

        {error && (
          <div className="auth-note err" aria-live="polite">
            {error}
          </div>
        )}

        <div className="field">
          <label htmlFor="li-email">Email</label>
          <input
            id="li-email"
            className={`input ${email && !emailOk(email) ? "invalid" : ""}`}
            placeholder="you@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          {email && !emailOk(email) && (
            <div className="field-error">Enter a valid email</div>
          )}
        </div>

        <div className="field">
          <label htmlFor="li-pw">Password</label>
          <div className="control">
            <input
              id="li-pw"
              className={`input ${password && password.length < 6 ? "invalid" : ""}`}
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw((s) => !s)}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
          {password && password.length < 6 && (
            <div className="field-error">At least 6 characters</div>
          )}
        </div>

        <button className="btn btn-solid block" type="submit">
          Login
        </button>

        <div className="auth-divider">New to ShopKart?</div>

        <Link className="btn ghost block" to="/signup">
          Create your ShopKart account
        </Link>
      </form>
    </div>
  );
}
