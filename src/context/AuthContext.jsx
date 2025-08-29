// shopkart/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

const AuthCtx = createContext(null);

// tiny helper to ensure the browser has time to persist cookies
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---- Boot: try to restore session quietly (never throws 401) ----
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await (api.session ? api.session() : api.me());
        if (alive && res?.user) setUser(res.user);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ---- Sign up (step 1) -> send OTP; DO NOT log in yet ----
  const signupInitiate = async ({ name, email, password }) => {
    await api.signupInitiate({ name, email, password });
    return { email };
  };

  // ---- Verify OTP (step 2) -> server sets cookie + returns user ----
  const verifySignupOtp = async ({ email, otp }) => {
    const res = await api.signupVerify({ email, otp }); // { user }
    // make sure cookie is persisted before app starts hitting /me/*
    await wait(120);
    // hydrate from soft session to be 100% sure
    try {
      const s = await (api.session ? api.session() : api.me());
      if (s?.user) setUser(s.user);
      else setUser(res.user);
    } catch {
      setUser(res.user);
    }
    return res.user;
  };

  // ---- Login existing user ----
  const login = async ({ email, password }) => {
    // server will set the auth cookie here
    const res = await api.login({ email, password }); // { user }
    // give the browser a tick to persist cookies, then confirm with /session
    await wait(120);
    try {
      const s = await (api.session ? api.session() : api.me());
      if (s?.user) setUser(s.user);
      else setUser(res.user);
    } catch {
      setUser(res.user);
    }
    return res.user;
  };

  // ---- Logout (clear cookie session on server + local cleanup) ----
  const logout = async () => {
    const email = user?.email?.toLowerCase();
    try {
      await api.logout();
    } catch {
      // ignore network hiccups, we'll still drop local state
    }

    // remove per-user saved address so it doesn't appear for the next login
    try {
      if (email) localStorage.removeItem(`sk_addr:${email}`);
    } catch {}

    setUser(null);
  };

  // ---- Update profile (Dashboard) ----
  const update = async (patch) => {
    const res = await api.updateProfile(patch); // { user }
    setUser(res.user);
    return res.user;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      signupInitiate,
      verifySignupOtp,
      login,
      logout,
      update,
    }),
    [user, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/**
 * Redirect away from auth pages if already logged in.
 * Usage: useRedirectIfAuthed("/") or useRedirectIfAuthed("/dashboard")
 */
export function useRedirectIfAuthed(path = "/dashboard") {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(path, { replace: true });
    }
  }, [user, loading, path, navigate]);
}
