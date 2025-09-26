import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, json, setAccess, clearAccess, AUTH_LOGOUT, refreshTokens } from "./api";

type User = { id: number; role: string; email?: string };
type AuthState = {
    user: User | null;
    login(email: string, password: string): Promise<boolean>;
    logout(): Promise<void>;
};
const Ctx = createContext<AuthState>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    async function loadMe() {
        try {
            const me = await json<{ user_id: number; role: string }>("/auth/me");
            setUser({ id: me.user_id, role: me.role });
        } catch { setUser(null); }
    }

    async function login(email: string, password: string) {
        const r = await apiFetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!r.ok) return false;
        const j = await r.json().catch(() => null as any);
        if (!j?.access_token) return false;
        setAccess(j.access_token);
        await loadMe();
        return true;
    }

    async function logout() {
        await apiFetch("/auth/logout", { method: "POST" }).catch(() => void 0);
        clearAccess();
        setUser(null);
    }

    useEffect(() => {
        (async () => { const ok = await refreshTokens(); if (ok) await loadMe(); })();
    }, []);

    useEffect(() => {
        const h = () => { clearAccess(); setUser(null); };
        window.addEventListener(AUTH_LOGOUT, h as EventListener);
        return () => window.removeEventListener(AUTH_LOGOUT, h as EventListener);
    }, []);

    const value = useMemo(() => ({ user, login, logout }), [user]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
