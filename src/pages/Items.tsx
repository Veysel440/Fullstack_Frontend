import { useEffect, useMemo, useRef, useState } from "react";
import { json, apiFetch } from "../api";
import { useAuth } from "../auth";
import { useToast } from "../ui/toast";

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

    const [data, setData] = useState<Item[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState("");
    const [price, setPrice] = useState<number>(0);

    const [editId, setEditId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editPrice, setEditPrice] = useState<number>(0);

    const [page, setPage] = useState(1);
    const [size] = useState(10);
    const [q, setQ] = useState("");
    const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "id", dir: "desc" });

    const pages = useMemo(() => Math.max(1, Math.ceil(total / size)), [total, size]);
    const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

    async function load() {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                size: String(size),
                sort: `${sort.key},${sort.dir}`,
            });
            if (q.trim()) params.set("q", q.trim());
            const res = await json<PagedItems>(`/items/?${params.toString()}`);
            setData(res.items); setTotal(res.total);
        } catch (e:any) { terror(e?.error ?? "Load failed"); }
        finally { setLoading(false); }
    }
    useEffect(() => { void load(); /* eslint-disable-next-line */ }, [page, sort.key, sort.dir]);

    function debouncedSearch(nextQ: string){
        setQ(nextQ);
        if (pending.current) clearTimeout(pending.current);
        pending.current = setTimeout(() => { setPage(1); void load(); }, 350);
    }

    function toggleSort(k: SortKey) {
        setSort(s => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc":"asc" } : { key: k, dir: "asc" }));
    }

    async function add(e: React.FormEvent) {
        e.preventDefault();
        try {
            await json("/items/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, price: Number(price) }),
            });
            setName(""); setPrice(0); toast("Item created"); await load();
        } catch (e:any) { terror(e?.error ?? "Create failed"); }
    }

    const startEdit = (i: Item) => { setEditId(i.id); setEditName(i.name); setEditPrice(i.price); };
    const cancelEdit = () => { setEditId(null); setEditName(""); setEditPrice(0); };

    async function saveEdit() {
        if (editId == null) return;
        try {
            await json(`/items/${editId}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName, price: Number(editPrice) }),
            });
            toast("Saved"); cancelEdit(); await load();
        } catch (e:any) { terror(e?.error ?? "Update failed"); }
    }

    async function remove(id: number) {
        const r = await apiFetch(`/items/${id}`, { method: "DELETE" });
        if (r.status === 403) { terror("Forbidden: admin required"); return; }
        if (r.status !== 204) { const j = await r.json().catch(()=>null); terror(j?.error ?? `Delete failed ${r.status}`); return; }
        toast("Deleted"); await load();
    }

    return (
        <div className="card">
            <header className="row" style={{ justifyContent:"space-between", marginBottom: 12 }}>
                <h2 style={{margin:0}}>Items <span className="badge">({total})</span></h2>
                <div className="row">
                    <span className="badge" style={{marginRight:8}}>role: {user?.role}</span>
                    <button className="ghost" onClick={logout}>Logout</button>
                </div>
            </header>

            <div className="row" style={{ marginBottom: 12 }}>
                <input
                    name="search"
                    placeholder="Search name…"
                    value={q}
                    onChange={(e)=>debouncedSearch(e.target.value)}
                />
                <button onClick={()=>{ setPage(1); void load(); }}>Search</button>
                {q && <button className="ghost" onClick={()=>{ setQ(""); setPage(1); void load(); }}>Reset</button>}
            </div>

            <form onSubmit={add} className="row" style={{ marginBottom: 12 }}>
                <input name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
                <input name="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price" />
                <button className="primary" type="submit" disabled={loading}>Add</button>
            </form>

            <div style={{ overflowX:"auto" }}>
                <table role="table" aria-label="Items">
                    <thead>
                    <tr>
                        {columns.map(c=>{
                            const active = sort.key===c.key; const dir = active ? sort.dir : undefined;
                            return (
                                <th key={c.key}
                                    className="sortable"
                                    role="columnheader"
                                    aria-sort={active ? (dir==="asc"?"ascending":"descending") : "none"}
                                    onClick={()=>toggleSort(c.key as SortKey)}>
                                    {c.label}{active ? (dir==="asc"?" ▲":" ▼") : ""}
                                </th>
                            );
                        })}
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading && Array.from({length: Math.min(5,size)}).map((_,i)=>(
                        <tr key={`skel-${i}`}><td colSpan={5}><div className="skel" style={{height:18}}/></td></tr>
                    ))}
                    {!loading && data.length===0 && (
                        <tr><td colSpan={5}><div style={{color:"#9aa4b2"}}>No items. Create the first one.</div></td></tr>
                    )}
                    {!loading && data.map(i=>(
                        <tr key={i.id}>
                            <td>#{i.id}</td>
                            <td>{editId===i.id ? <input value={editName} onChange={e=>setEditName(e.target.value)} /> : i.name}</td>
                            <td>{editId===i.id ? <input type="number" step="0.01" value={editPrice} onChange={e=>setEditPrice(Number(e.target.value))}/> : i.price.toFixed(2)}</td>
                            <td>{new Date(i.created_at).toLocaleString()}</td>
                            <td className="row">
                                {editId===i.id ? (
                                    <>
                                        <button onClick={saveEdit} type="button">Save</button>
                                        <button onClick={cancelEdit} type="button" className="ghost">Cancel</button>
                                    </>
                                ):(
                                    <>
                                        <button onClick={()=>startEdit(i)} type="button">Edit</button>
                                        {user?.role==="admin" && <button onClick={()=>remove(i.id)} type="button" className="danger">Delete</button>}
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="row" style={{ marginTop:12, justifyContent:"space-between" }}>
                <div className="badge">Total: {total}</div>
                <div className="row">
                    <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1 || loading}>Prev</button>
                    <div className="badge">Page {page}/{pages}</div>
                    <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages || loading}>Next</button>
                </div>
            </div>
        </div>
    );
}
