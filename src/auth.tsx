import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, json, AUTH_LOGOUT, refreshTokens } from "./api";
import { Sentry, sentryEnabled } from "./sentry";

type User = { id: number; role: string; email?: string };
type AuthState = { user: User | null; login(e:string,p:string):Promise<boolean>; logout():Promise<void>; };
const Ctx = createContext<AuthState>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    async function loadMe() {
        try {
            const me = await json<{ user_id: number; role: string; email?: string }>("/auth/me");
            const u = { id: me.user_id, role: me.role, email: me.email };
            setUser(u);
            if (sentryEnabled) Sentry.setUser({ id: String(u.id), username: u.email, role: u.role as any });
        } catch {
            setUser(null);
            if (sentryEnabled) Sentry.setUser(null);
        }
    }

    async function login(email: string, password: string) {
        const r = await apiFetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        if (!r.ok) return false;
        await r.json().catch(() => null); // tokens cookie/headers ile geliyorsa yok say
        await loadMe();
        return true;
    }

    async function logout() {
        await apiFetch("/auth/logout", { method: "POST" }).catch(() => void 0);
        setUser(null);
        if (sentryEnabled) Sentry.setUser(null);
    }

    useEffect(() => { (async () => { const ok = await refreshTokens(); if (ok) await loadMe(); })(); }, []);
    useEffect(() => {
        const h = () => { setUser(null); if (sentryEnabled) Sentry.setUser(null); };
        window.addEventListener(AUTH_LOGOUT, h as EventListener);
        return () => window.removeEventListener(AUTH_LOGOUT, h as EventListener);
    }, []);

    const value = useMemo(() => ({ user, login, logout }), [user]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
