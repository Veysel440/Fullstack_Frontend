
import { useEffect, useMemo, useState } from "react";
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

    async function load() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("size", String(size));
            params.set("sort", `${sort.key},${sort.dir}`);
            if (q.trim()) params.set("q", q.trim());

            const res = await json<PagedItems>(`/items/?${params.toString()}`);
            setData(res.items);
            setTotal(res.total);
        } catch (e: any) {
            terror(e?.error ?? "Load failed");
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => { void load(); /* eslint-disable-next-line */ }, [page, size, sort.key, sort.dir]);

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
            setName(""); setPrice(0);
            toast("Item created");
            await load();
        } catch (e: any) { terror(e?.error ?? "Create failed"); }
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
            toast("Saved");
            cancelEdit(); await load();
        } catch (e: any) { terror(e?.error ?? "Update failed"); }
    }

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

    return (
        <div className="card">
            <header className="row" style={{ justifyContent:"space-between", marginBottom: 12 }}>
                <h2 style={{margin:0}}>Items</h2>
                <div className="row">
                    <span className="badge" style={{marginRight:8}}>role: {user?.role}</span>
                    <button className="ghost" onClick={logout}>Logout</button>
                </div>
            </header>

            <div className="row" style={{ marginBottom: 12 }}>
                <input placeholder="Search name…" value={q} onChange={(e)=>setQ(e.target.value)} onKeyDown={(e)=> e.key==="Enter" && (setPage(1), void load())}/>
                <button onClick={()=> (setPage(1), void load())}>Search</button>
            </div>

            <form onSubmit={add} className="row" style={{ marginBottom: 12 }}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
                <input type="number" step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price" />
                <button className="primary" type="submit">Add</button>
            </form>

            <div style={{ overflowX:"auto" }}>
                <table>
                    <thead>
                    <tr>
                        {columns.map(c=>(
                            <th key={c.key} className="sortable" role="columnheader"
                                onClick={()=>toggleSort(c.key as SortKey)}>
                                {c.label}{sort.key===c.key ? (sort.dir==="asc"?" ▲":" ▼") : ""}
                            </th>
                        ))}
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
                            <td>
                                {editId===i.id ? (
                                    <input value={editName} onChange={e=>setEditName(e.target.value)} />
                                ) : i.name}
                            </td>
                            <td>
                                {editId===i.id ? (
                                    <input type="number" step="0.01" value={editPrice} onChange={e=>setEditPrice(Number(e.target.value))}/>
                                ) : i.price.toFixed(2)}
                            </td>
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
                                        {user?.role==="admin" && <button onClick={()=>remove(i.id)} type="button" className="ghost">Delete</button>}
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
                    <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</button>
                    <div className="badge">Page {page}/{pages}</div>
                    <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages}>Next</button>
                </div>
            </div>
        </div>
    );
}
