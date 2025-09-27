const API: string = (import.meta.env.VITE_API_URL as string) ?? "/api";

export const AUTH_LOGOUT = "auth:logout";

type ReqInit = RequestInit & { _retry?: boolean };


let accessTokenMem: string = "";
let refreshTokenMem: string = "";

(function bootstrap() {
    try {
        accessTokenMem = localStorage.getItem("access_token") ?? "";
        refreshTokenMem = localStorage.getItem("refresh_token") ?? "";
    } catch {}
})();

export const tokenStore = {
    get access() { return accessTokenMem; },
    set access(v: string) {
        accessTokenMem = v || "";
        try { localStorage.setItem("access_token", accessTokenMem); } catch {}
    },
    get refresh() { return refreshTokenMem; },
    set refresh(v: string) {
        refreshTokenMem = v || "";
        try { localStorage.setItem("refresh_token", refreshTokenMem); } catch {}
    },
    clear() {
        accessTokenMem = ""; refreshTokenMem = "";
        try { localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); } catch {}
    }
};


(window as any).__debugSetAccess = (v: string) => (tokenStore.access = v);


export async function apiFetch(path: string, init: ReqInit = {}): Promise<Response> {
    const { _retry, headers: h, ...rest } = init;

    const headers = new Headers(h ?? {});
    if (tokenStore.access && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${tokenStore.access}`);
    }

    let res = await fetch(API + path, { ...rest, headers, credentials: "include" });

    if ((res.status === 401 || res.status === 419) && !_retry) {
        const ok = await refreshTokens();
        if (ok) {
            const headers2 = new Headers(h ?? {});
            if (tokenStore.access) headers2.set("Authorization", `Bearer ${tokenStore.access}`);
            return apiFetch(path, { ...rest, headers: headers2, credentials: "include", _retry: true });
        }
    }
    return res;
}


export async function refreshTokens(): Promise<boolean> {
    if (!tokenStore.refresh) {
    }

    const r = await fetch(API + "/auth/refresh", {
        method: "POST",
        headers: tokenStore.refresh
            ? { "X-Refresh-Token": tokenStore.refresh }
            : undefined,
        credentials: "include"
    });

    if (!r.ok) {
        tokenStore.clear();
        window.dispatchEvent(new Event(AUTH_LOGOUT));
        return false;
    }

    const j = await r.json().catch(() => null as any);
    if (!j?.access_token) {
        tokenStore.clear();
        window.dispatchEvent(new Event(AUTH_LOGOUT));
        return false;
    }

    tokenStore.access = j.access_token;
    if (j.refresh_token) tokenStore.refresh = j.refresh_token;
    return true;
}


export async function json<T = unknown>(path: string, init?: ReqInit): Promise<T> {
    const r = await apiFetch(path, init);
    if (!r.ok) throw await safeErr(r);
    return r.json() as Promise<T>;
}

async function safeErr(r: Response) {
    try { return await r.json(); }
    catch { return { error: `HTTP ${r.status}` }; }
}
