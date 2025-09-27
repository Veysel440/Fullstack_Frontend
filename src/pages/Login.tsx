
import { useState } from "react";
import { useAuth } from "../auth";
import { apiFetch } from "../api";
import { useToast } from "../ui/toast";

type Mode = "login" | "register";
type Props = { onRegister?: () => void };

export default function Login({ onRegister }: Props) {
    const { login } = useAuth();
    const { toast, terror } = useToast();

    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("admin@example.com");
    const [password, setPassword] = useState("admin123");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const isEmail = (s: string) => /\S+@\S+\.\S+/.test(s);

    async function doLogin(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        if (!isEmail(email)) { setErr("Enter a valid email"); return; }
        if (!password) { setErr("Password required"); return; }
        setLoading(true);
        const ok = await login(email, password);
        setLoading(false);
        if (!ok) { setErr("Invalid credentials"); terror("Login failed"); }
        else { toast("Welcome back!"); }
    }

    async function doRegister(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        if (!isEmail(email)) { setErr("Enter a valid email"); return; }
        if (password.length < 6) { setErr("Minimum password length is 6"); return; }
        setLoading(true);
        const r = await apiFetch("/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        setLoading(false);
        if (!r.ok) {
            const j = await r.json().catch(() => null);
            const msg = j?.error ?? "Registration failed";
            setErr(msg); terror(msg);
            return;
        }
        const ok = await login(email, password);
        if (ok) { toast("Account created. Signed in."); }
        else {
            toast("Account created. Please sign in.");
            setMode("login");
        }
    }

    const goRegister = () => {
        if (onRegister) onRegister();
        else setMode("register");
    };

    return (
        <div className="card" style={{ maxWidth: 420, margin: "80px auto" }}>
            <h2 style={{ marginTop: 0 }}>{mode === "login" ? "Sign in" : "Register"}</h2>

            <form
                onSubmit={mode === "login" ? doLogin : doRegister}
                style={{ display: "grid", gap: 10 }}
            >
                <input
                    name="email"
                    placeholder="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                />
                <input
                    name="password"
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                />
                <button className="primary" disabled={loading} type="submit">
                    {loading ? (mode === "login" ? "Signing in…" : "Creating…") : (mode === "login" ? "Login" : "Create account")}
                </button>
            </form>

            {err && <p style={{ color: "crimson", marginTop: 8 }}>{err}</p>}

            <div style={{ marginTop: 10 }}>
                {mode === "login" ? (
                    <button type="button" className="ghost" onClick={goRegister}>
                        Create a new account
                    </button>
                ) : (
                    <button
                        type="button"
                        className="ghost"
                        onClick={() => setMode("login")}
                    >
                        Back to login
                    </button>
                )}
            </div>
        </div>
    );
}
