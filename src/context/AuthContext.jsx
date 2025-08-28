import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Try to restore session quietly (avoid 401 noise)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // If your API doesn't have /session, you can swap back to api.me() here.
        const res = await (api.session ? api.session() : api.me());
        if (alive && res?.user) setUser(res.user);
      } catch {
        // ignore
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const signupInitiate = async ({ name, email, password }) => {
    await api.signupInitiate({ name, email, password });
    return { email };
  };

  const verifySignupOtp = async ({ email, otp }) => {
    const res = await api.signupVerify({ email, otp }); // { user }
    setUser(res.user);
    return res.user;
  };

  const login = async ({ email, password }) => {
    const res = await api.login({ email, password }); // { user }
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try { await api.logout(); } catch {}
    // Clean this user's saved address so it doesn't appear for others
    try {
      const email = user?.email?.toLowerCase();
      if (email) localStorage.removeItem(`sk_addr:${email}`);
    } catch {}
    setUser(null);
  };

  const update = async (patch) => {
    const res = await api.updateProfile(patch); // { user }
    setUser(res.user);
    return res.user;
  };

  const value = useMemo(() => ({
    user, loading,
    signupInitiate, verifySignupOtp,
    login, logout, update,
  }), [user, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRedirectIfAuthed(path = "/dashboard") {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(path, { replace: true });
    }
  }, [user, loading, path, navigate]);
}
