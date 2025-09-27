import { useState } from "react";
import { useAuth } from "../auth";
import { apiFetch } from "../api";

export default function Login() {
    const { login } = useAuth();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("admin@example.com");
    const [password, setPassword] = useState("admin123");
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function doLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true); setErr(null);
        const ok = await login(email, password);
        if (!ok) setErr("Invalid credentials");
        setLoading(false);
    }

    async function doRegister(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true); setErr(null);
        const r = await apiFetch("/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        if (!r.ok) {
            const j = await r.json().catch(() => null);
            setErr(j?.error ?? "Registration failed");
            setLoading(false);
            return;
        }

        setLoading(false);
        setMode("login");
        void doLogin(e);
    }

    return (
        <div style={{ maxWidth: 380, margin: "80px auto", fontFamily: "system-ui" }}>
            <h2>{mode === "login" ? "Sign in" : "Register"}</h2>
            <form onSubmit={mode === "login" ? doLogin : doRegister} style={{ display: "grid", gap: 8 }}>
                <input name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
                <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
                <button disabled={loading} type="submit">{mode === "login" ? "Login" : "Create account"}</button>
            </form>
            <div style={{ marginTop: 8 }}>
                {mode === "login" ? (
                    <button type="button" onClick={() => setMode("register")} style={{ background: "none", border: 0, color: "#06c", cursor: "pointer" }}>
                        Create a new account
                    </button>
                ) : (
                    <button type="button" onClick={() => setMode("login")} style={{ background: "none", border: 0, color: "#06c", cursor: "pointer" }}>
                        Back to login
                    </button>
                )}
            </div>
            {err && <p style={{ color: "crimson" }}>{err}</p>}
        </div>
    );
}