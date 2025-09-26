const API = (import.meta.env.VITE_API_URL as string) ?? "";

let accessToken = "";
export const AUTH_LOGOUT = "auth:logout";
export const __debugSetAccess = (v: string) => { accessToken = v; };

type ReqInit = RequestInit & { _retry?: boolean };

export function setAccess(v: string) { accessToken = v; }
export function clearAccess() { accessToken = ""; }

export async function apiFetch(path: string, init: ReqInit = {}): Promise<Response> {
    const { _retry, headers: h, ...rest } = init;
    const headers = new Headers(h ?? {});
    if (accessToken && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${accessToken}`);

    let res = await fetch(API + path, { ...rest, headers, credentials: "include" });

    if (res.status === 401 || res.status === 419) {
        if (_retry) return res; // already retried once
        const ok = await refreshTokens();
        if (ok) {
            const headers2 = new Headers(h ?? {});
            if (accessToken) headers2.set("Authorization", `Bearer ${accessToken}`);
            return apiFetch(path, { ...rest, headers: headers2, credentials: "include", _retry: true });
        }
    }
    return res;
}

export async function refreshTokens(): Promise<boolean> {
    const r = await fetch(API + "/auth/refresh", { method: "POST", credentials: "include" });
    if (!r.ok) { clearAccess(); window.dispatchEvent(new Event(AUTH_LOGOUT)); return false; }
    const j = await r.json().catch(() => ({} as any));
    if (!j?.access_token) { clearAccess(); window.dispatchEvent(new Event(AUTH_LOGOUT)); return false; }
    accessToken = j.access_token;
    return true;
}

export async function json<T = unknown>(path: string, init?: ReqInit): Promise<T> {
    const r = await apiFetch(path, init);
    if (!r.ok) throw await (async () => { try { return await r.json(); } catch { return { error: `HTTP ${r.status}` }; } })();
    return r.json() as Promise<T>;
}
