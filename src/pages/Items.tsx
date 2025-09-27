import { useEffect, useMemo, useState, useCallback } from "react";
import { json, apiFetch } from "../api";
import { useAuth } from "../auth";
import { useToast } from "../ui/toast";
import LoadingButton from "../ui/LoadingButton";
import Empty from "../ui/Empty";

type Item = { id: number; name: string; price: number; created_at: string };
type PagedItems = { items: Item[]; page: number; size: number; total: number };

const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "price", label: "Price" },
    { key: "created_at", label: "Created" },
] as const;
type SortKey = typeof columns[number]["key"];

export default function Items() {
    const { user, logout } = useAuth();
    const { toast, terror } = useToast();

    // list state
    const [data, setData] = useState<Item[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    // create state
    const [name, setName] = useState("");
    const [price, setPrice] = useState<number>(0);

    // edit state
    const [editId, setEditId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editPrice, setEditPrice] = useState<number>(0);

    // filters/paging
    const [page, setPage] = useState(1);
    const [size] = useState(10);
    const [q, setQ] = useState("");
    const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "id", dir: "desc" });

    // bulk selection (admin)
    const [selected, setSelected] = useState<Set<number>>(new Set());

    const pages = useMemo(() => Math.max(1, Math.ceil(total / size)), [total, size]);

    // ---- URL <-> state (init) ----
    useEffect(() => {
        const sp = new URLSearchParams(window.location.search);
        const p = parseInt(sp.get("page") || "1", 10);
        const sq = sp.get("q") || "";
        const s = sp.get("sort") || "id,desc";
        const [k, d] = s.split(",");
        if (!Number.isNaN(p) && p > 0) setPage(p);
        setQ(sq);
        if (["id", "name", "price", "created_at"].includes(k)) {
            setSort({ key: k as SortKey, dir: d === "asc" ? "asc" : "desc" });
        }
    }, []);

    // ---- state -> URL (persist) ----
    useEffect(() => {
        const sp = new URLSearchParams();
        sp.set("page", String(page));
        sp.set("sort", `${sort.key},${sort.dir}`);
        if (q.trim()) sp.set("q", q.trim());
        const qs = `?${sp.toString()}`;
        if (qs !== window.location.search) {
            window.history.replaceState(null, "", qs);
        }
    }, [page, sort.key, sort.dir, q]);

    // ---- load ----
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const sp = new URLSearchParams();
            sp.set("page", String(page));
            sp.set("size", String(size));
            sp.set("sort", `${sort.key},${sort.dir}`);
            if (q.trim()) sp.set("q", q.trim());
            const res = await json<PagedItems>(`/items/?${sp.toString()}`);
            setData(res.items);
            setTotal(res.total);
            // sayfa değişince mevcut seçim geçersiz
            setSelected(new Set());
        } catch (e: any) {
            terror(e?.error ?? "Load failed");
        } finally {
            setLoading(false);
        }
    }, [page, size, sort.key, sort.dir, q, terror]);

    useEffect(() => { void load(); }, [load]);

    // ---- sort toggle ----
    function toggleSort(k: SortKey) {
        setSort(s => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" }));
        setPage(1);
    }

    // ---- create ----
    async function add(e: React.FormEvent) {
        e.preventDefault();
        try {
            await json("/items/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, price: Number(price) }),
            });
            setName(""); setPrice(0);
            toast("Item created");
            setPage(1);
            await load();
        } catch (e: any) {
            terror(e?.error ?? "Create failed");
        }
    }

    // ---- edit ----
    const startEdit = (i: Item) => { setEditId(i.id); setEditName(i.name); setEditPrice(i.price); };
    const cancelEdit = () => { setEditId(null); setEditName(""); setEditPrice(0); };

    async function saveEdit() {
        if (editId == null) return;
        try {
            await json(`/items/${editId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName, price: Number(editPrice) }),
            });
            toast("Saved");
            cancelEdit();
            await load();
        } catch (e: any) {
            terror(e?.error ?? "Update failed");
        }
    }

    function onEditKey(e: React.KeyboardEvent) {
        if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
        if (e.key === "Enter")  { e.preventDefault(); void saveEdit(); }
    }

    // ---- delete (single) ----
    async function remove(id: number) {
        const r = await apiFetch(`/items/${id}`, { method: "DELETE" });
        if (r.status === 403) { terror("Forbidden: admin required"); return; }
        if (r.status !== 204) {
            const j = await r.json().catch(() => null);
            terror(j?.error ?? `Delete failed ${r.status}`); return;
        }
        toast("Deleted");
        await load();
    }

    // ---- bulk delete (admin) ----
    async function bulkDelete() {
        if (selected.size === 0) return;
        const ids = Array.from(selected);
        let ok = 0, fail = 0;
        for (const id of ids) {
            const r = await apiFetch(`/items/${id}`, { method: "DELETE" });
            if (r.status === 204) ok++; else fail++;
        }
        if (ok) toast(`Deleted ${ok} item(s)`);
        if (fail) terror(`${fail} failed`);
        setSelected(new Set());
        await load();
    }
    function toggleRow(id: number, checked: boolean) {
        setSelected(prev => {
            const c = new Set(prev);
            checked ? c.add(id) : c.delete(id);
            return c;
        });
    }
    function toggleAll(checked: boolean) {
        if (!checked) { setSelected(new Set()); return; }
        setSelected(new Set(data.map(d => d.id)));
    }

    return (
        <div className="card">
            <header className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
                <h2 style={{ margin: 0 }}>Items</h2>
                <div className="row">
                    {user?.role === "admin" && selected.size > 0 && (
                        <button onClick={bulkDelete} style={{ marginRight: 8 }}>Delete selected</button>
                    )}
                    <span className="badge" style={{ marginRight: 8 }}>role: {user?.role}</span>
                    <button className="ghost" onClick={logout}>Logout</button>
                </div>
            </header>

            <div className="row" style={{ marginBottom: 12 }}>
                <input
                    placeholder="Search name…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (setPage(1), void load())}
                />
                <button onClick={() => (setPage(1), void load())}>Search</button>
            </div>

            <form onSubmit={add} className="row" style={{ marginBottom: 12 }}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
                <input type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price" />
                <LoadingButton className="primary" type="submit" loading={loading}>Add</LoadingButton>
            </form>

            <div style={{ overflowX: "auto" }}>
                <table>
                    <thead>
                    <tr>
                        {user?.role === "admin" && (
                            <th>
                                <input
                                    type="checkbox"
                                    aria-label="toggle-all"
                                    checked={data.length > 0 && selected.size === data.length}
                                    onChange={(e) => toggleAll(e.currentTarget.checked)}
                                />
                            </th>
                        )}
                        {columns.map(c => (
                            <th
                                key={c.key}
                                className="sortable"
                                role="columnheader"
                                onClick={() => toggleSort(c.key as SortKey)}
                            >
                                {c.label}{sort.key === c.key ? (sort.dir === "asc" ? " ▲" : " ▼") : ""}
                            </th>
                        ))}
                        <th>Actions</th>
                    </tr>
                    </thead>

                    <tbody>
                    {loading && Array.from({ length: Math.min(5, size) }).map((_, i) => (
                        <tr key={`skel-${i}`}><td colSpan={user?.role === "admin" ? 6 : 5}><div className="skel" style={{ height: 18 }} /></td></tr>
                    ))}

                    {!loading && data.length === 0 && (
                        <tr>
                            <td colSpan={user?.role === "admin" ? 6 : 5}>
                                <Empty title="No items" hint="Try creating a new item or changing filters." />
                            </td>
                        </tr>
                    )}

                    {!loading && data.map(i => (
                        <tr key={i.id}>
                            {user?.role === "admin" && (
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selected.has(i.id)}
                                        onChange={(e) => toggleRow(i.id, e.currentTarget.checked)}
                                    />
                                </td>
                            )}
                            <td>#{i.id}</td>
                            <td>
                                {editId === i.id ? (
                                    <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={onEditKey} />
                                ) : i.name}
                            </td>
                            <td>
                                {editId === i.id ? (
                                    <input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(Number(e.target.value))} onKeyDown={onEditKey} />
                                ) : i.price.toFixed(2)}
                            </td>
                            <td>{new Date(i.created_at).toLocaleString()}</td>
                            <td className="row">
                                {editId === i.id ? (
                                    <>
                                        <button onClick={saveEdit} type="button">Save</button>
                                        <button onClick={cancelEdit} type="button" className="ghost">Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => startEdit(i)} type="button">Edit</button>
                                        {user?.role === "admin" && <button onClick={() => remove(i.id)} type="button" className="ghost">Delete</button>}
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="row" style={{ marginTop: 12, justifyContent: "space-between" }}>
                <div className="badge">Total: {total}</div>
                <div className="row">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
                    <div className="badge">Page {page}/{pages}</div>
                    <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}>Next</button>
                </div>
            </div>
        </div>
    );
}
