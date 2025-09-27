const API: string = (import.meta.env.VITE_API_URL as string) ?? "";

let accessToken = "";

export function setAccess(t: string) {
    accessToken = t;
    localStorage.setItem("access_token", t);
}
export function clearAccess() {
    accessToken = "";
    localStorage.removeItem("access_token");
}

function getRefresh(): string { return localStorage.getItem("refresh_token") ?? ""; }
export function setRefresh(t: string) { localStorage.setItem("refresh_token", t); }
export function clearRefresh() { localStorage.removeItem("refresh_token"); }

export const AUTH_LOGOUT = "auth:logout";

export type ReqInit = Omit<RequestInit, "headers"> & { headers?: HeadersInit; _retry?: boolean };

export async function apiFetch(path: string, init: ReqInit = {}): Promise<Response> {
    const { _retry, headers: h, ...rest } = init;
    const headers = new Headers(h ?? {});
    if (accessToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    let res = await fetch(API + path, { ...rest, headers, credentials: "include" });


    if ((res.status === 401 || res.status === 419) && !_retry) {
        const ok = await refreshTokens();
        if (ok) {
            const headers2 = new Headers(h ?? {});
            if (accessToken) headers2.set("Authorization", `Bearer ${accessToken}`);
            return apiFetch(path, { ...rest, headers: headers2, _retry: true });
        }
    }
    return res;
}

export async function refreshTokens(): Promise<boolean> {
    const refresh = getRefresh();
    const r = await fetch(API + "/auth/refresh", {
        method: "POST",
        headers: refresh ? { "X-Refresh-Token": refresh } : undefined,
        credentials: "include",
    });
    if (!r.ok) { clearAccess(); return false; }

    const j = await r.json().catch(() => null as any);
    if (!j?.access_token) { clearAccess(); return false; }

    setAccess(j.access_token);
    if (j.refresh_token) setRefresh(j.refresh_token);
    return true;
}

export async function json<T = unknown>(path: string, init?: ReqInit): Promise<T> {
    const r = await apiFetch(path, init);
    if (!r.ok) throw await safeErr(r);
    return r.json() as Promise<T>;
}

async function safeErr(r: Response) {
    try { return await r.json(); } catch { return { error: `HTTP ${r.status}` }; }
}

(() => { const t = localStorage.getItem("access_token"); if (t) accessToken = t; })();
