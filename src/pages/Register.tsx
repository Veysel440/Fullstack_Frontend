import { useState } from "react";
import { apiFetch } from "../api";
import { useToast } from "../ui/toast";

export default function Register({ onDone }: { onDone(): void }) {
    const { toast, terror } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [loading, setLoading] = useState(false);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (password !== password2) { terror("Passwords do not match"); return; }
        setLoading(true);
        try {
            const r = await apiFetch("/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (!r.ok) {
                const j = await r.json().catch(()=>({error:`HTTP ${r.status}`}));
                terror(j.error || "Register failed");
                return;
            }
            toast("Account created. Please login.");
            onDone();
        } catch {
            terror("Register failed");
        } finally { setLoading(false); }
    }

    return (
        <div className="card" style={{maxWidth:420, margin:"80px auto"}}>
            <h2 style={{marginTop:0}}>Create account</h2>
            <form onSubmit={submit} style={{display:"grid", gap:8}}>
                <input name="email" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} required />
                <input name="password" type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} required />
                <input name="password2" type="password" placeholder="confirm password" value={password2} onChange={e=>setPassword2(e.target.value)} required />
                <button className="primary" disabled={loading} type="submit">Register</button>
                <button type="button" className="ghost" onClick={onDone}>Back to login</button>
            </form>
            <p style={{color:"var(--muted)",marginTop:8}}>
                Note: Requires backend <code>POST /auth/register</code>.
            </p>
        </div>
    );
}
