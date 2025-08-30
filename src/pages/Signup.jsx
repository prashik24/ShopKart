import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, useRedirectIfAuthed } from "../context/AuthContext.jsx";
import "../styles/auth.css";

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function Signup() {
  useRedirectIfAuthed("/"); // already logged in -> home
  const { signupInitiate } = useAuth();

  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState("");
  const [sending, setSending] = useState(false);

  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    const problems = [];
    const nameTrim  = form.name.trim();
    const emailTrim = form.email.trim();

    if (!nameTrim) problems.push("name is missing");
    else if (nameTrim.length < 2) problems.push("name is too short");

    if (!emailTrim) problems.push("email is missing");
    else if (!emailOk(emailTrim)) problems.push("email is invalid");

    if (!form.password) problems.push("password is missing");
    else if (form.password.length < 6) problems.push("password must be at least 6 characters");

    if (problems.length) {
      setError(`Please complete the form: ${problems.join(", ")}.`);
      return;
    }

    setError("");
    setSending(true);

    try {
      // ✅ Save everything so OTP page can "Resend" with the full payload
      const pending = { name: nameTrim, email: emailTrim, password: form.password };
      sessionStorage.setItem("sk_pending_email", emailTrim);
      sessionStorage.setItem("sk_pending_payload", JSON.stringify(pending));

      const { email } = await signupInitiate(pending);

      // Only redirect if backend says signup started
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`, { replace: true });
    } catch (err) {
      if (String(err.message || "").includes("Already registered")) {
        setError("This email is already registered. Please login instead.");
      } else {
        setError(err.message || "Unable to start sign up");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-center">
      <div className="auth-logo">
        Shop<span className="accent">Kart</span>
      </div>

      <form className="auth-card" onSubmit={submit} noValidate>
        <h2>Create account</h2>

        {error && (
          <div className="auth-note err" aria-live="polite">
            {error}
          </div>
        )}

        <div className="field">
          <label htmlFor="su-name">Your name</label>
          <input
            id="su-name"
            className={`input ${form.name && form.name.trim().length < 2 ? "invalid" : ""}`}
            placeholder="Enter your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoComplete="name"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="su-email">Email</label>
          <input
            id="su-email"
            className={`input ${form.email && !emailOk(form.email) ? "invalid" : ""}`}
            placeholder="you@gmail.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="su-pw">Password</label>
          <div className="control">
            <input
              id="su-pw"
              className={`input ${form.password && form.password.length < 6 ? "invalid" : ""}`}
              type={showPw ? "text" : "password"}
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw((v) => !v)}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button className="btn btn-solid block" type="submit" disabled={sending}>
          {sending ? "Sending code…" : "Create your account"}
        </button>

        <div className="auth-divider">Already have an account?</div>

        <Link className="btn ghost block" to="/login">
          Login
        </Link>
      </form>
    </div>
  );
}
