import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/auth.css";

/**
 * Styled 6-box OTP with:
 * - auto-advance / backspace navigation
 * - paste support
 * - countdown + Resend
 */
const BOXES = 6;

export default function OtpVerify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { verifySignupOtp, signupInitiate } = useAuth(); // ⬅️ include signupInitiate

  // email from URL or session (session survives refresh)
  let pendingPayload = null;
  try {
    pendingPayload = JSON.parse(sessionStorage.getItem("sk_pending_payload") || "null");
  } catch {}
  const initialEmail =
    params.get("email") ||
    pendingPayload?.email ||
    sessionStorage.getItem("sk_pending_email") ||
    "";

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState(Array(BOXES).fill(""));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [secs, setSecs] = useState(30);

  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current?.[0]?.focus();
  }, []);

  // countdown for resend
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

  const onKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < BOXES - 1) inputsRef.current[idx + 1]?.focus();
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;
    e.preventDefault();
    const next = Array(BOXES).fill("");
    for (let i = 0; i < Math.min(BOXES, text.length); i++) next[i] = text[i];
    setDigits(next);
    const last = Math.min(text.length, BOXES) - 1;
    inputsRef.current[last >= 0 ? last : 0]?.focus();
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Email missing or invalid. Go back and try again.");
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
    if (secs > 0 || resending) return;

    // ✅ Use the full payload saved by Signup.jsx
    if (!pendingPayload?.email || !pendingPayload?.name || !pendingPayload?.password) {
      setError("We don't have your sign-up details to resend the code. Please start again.");
      return;
    }

    setResending(true);
    try {
      await signupInitiate(pendingPayload);
      setSecs(30); // reset cooldown
    } catch (e) {
      if (String(e.message || "").toLowerCase().includes("already")) {
        setError("This email is already registered. Please log in.");
      } else {
        setError(e?.message || "Could not resend code");
      }
    } finally {
      setResending(false);
    }
  };

  // Inline styles to keep this self-contained
  const style = {
    boxes: {
      display: "grid",
      gridAutoFlow: "column",
      gap: 10,
      justifyContent: "center",
      margin: "12px 0 14px",
    },
    box: {
      width: 46,
      height: 56,
      borderRadius: 12,
      border: "1px solid var(--border, #e5e7eb)",
      textAlign: "center",
      fontSize: "1.25rem",
      outline: "none",
    },
    actions: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,
    },
    linkbtn: {
      background: "none",
      border: 0,
      color: "var(--primary, #f59e0b)",
      fontWeight: 600,
      cursor: "pointer",
      padding: 0,
    },
    linkbtnDisabled: { opacity: 0.55, cursor: "default" },
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
        {error && (
          <div className="auth-note err" aria-live="polite">
            {error}
          </div>
        )}

        <div className="field">
          <label>Enter OTP</label>

          <div style={style.boxes} onPaste={onPaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                inputMode="numeric"
                autoComplete="one-time-code"
                style={style.box}
                value={d}
                onChange={(e) => onChangeBox(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                maxLength={1}
              />
            ))}
          </div>
        </div>

        <button className="btn btn-solid block" type="submit" disabled={submitting}>
          {submitting ? "Verifying…" : "Verify & Continue"}
        </button>

        <div style={style.actions}>
          <button
            type="button"
            style={{ ...style.linkbtn, ...(secs > 0 || resending ? style.linkbtnDisabled : {}) }}
            disabled={secs > 0 || resending}
            onClick={resend}
          >
            {resending ? "Sending…" : secs > 0 ? `Resend in ${secs}s` : "Resend code"}
          </button>
          <span className="muted">·</span>
          <Link className="link" to="/signup">Wrong email?</Link>
        </div>
      </form>
    </div>
  );
}
