import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import "../styles/auth.css";

const BOXES = 6;

export default function OtpVerify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { verifySignupOtp } = useAuth();

  const [digits, setDigits] = useState(Array(BOXES).fill(""));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [secs, setSecs] = useState(30);

  const inputsRef = useRef([]);

  // Load payload from sessionStorage
  let pendingPayload = null;
  try {
    pendingPayload = JSON.parse(sessionStorage.getItem("sk_pending_payload") || "null");
  } catch {}
  const email = params.get("email") || pendingPayload?.email || "";

  useEffect(() => {
    inputsRef.current?.[0]?.focus();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const otp = useMemo(() => digits.join(""), [digits]);

  const onChangeBox = (idx, val) => {
    const v = val.replace(/\D/g, "").slice(0, 1);
    const next = digits.slice();
    next[idx] = v;
    setDigits(next);
    if (v && idx < BOXES - 1) inputsRef.current[idx + 1]?.focus();
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Missing email. Go back and try again.");
      return;
    }
    if (otp.length !== BOXES) {
      setError("Enter the 6-digit code.");
      return;
    }

    try {
      setSubmitting(true);
      await verifySignupOtp({ email, otp });
      navigate("/", { replace: true });
    } catch (er) {
      setError(er?.message || "Invalid or expired code");
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setError("");
    setResending(true);
    try {
      if (!pendingPayload) throw new Error("Missing signup details. Please restart signup.");
      await api.signupInitiate(pendingPayload);
      setSecs(30);
    } catch (e) {
      setError(e?.message || "Could not resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-center">
      <div className="auth-logo">
        Shop<span className="accent">Kart</span>
      </div>

      <form className="auth-card" onSubmit={submit} noValidate>
        <h2>Verify your email</h2>
        <div className="auth-note">
          We sent a 6-digit code to <b>{email || "your email"}</b>.
        </div>
        {error && <div className="auth-note err">{error}</div>}

        <div className="field">
          <label>Enter OTP</label>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                inputMode="numeric"
                value={d}
                maxLength={1}
                onChange={(e) => onChangeBox(i, e.target.value)}
                style={{ width: 40, textAlign: "center", fontSize: "1.5rem" }}
              />
            ))}
          </div>
        </div>

        <button className="btn btn-solid block" type="submit" disabled={submitting}>
          {submitting ? "Verifying…" : "Verify & Continue"}
        </button>

        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button
            type="button"
            className="link"
            disabled={secs > 0 || resending}
            onClick={resend}
          >
            {resending ? "Sending…" : secs > 0 ? `Resend in ${secs}s` : "Resend code"}
          </button>
          <span className="muted"> · </span>
          <Link className="link" to="/signup">Wrong email?</Link>
        </div>
      </form>
    </div>
  );
}
