import { createContext, useContext, useMemo, useState } from "react";

type Toast = { id:number; msg:string; kind:"ok"|"err" };
type CtxT = { toast(msg:string):void; terror(msg:string):void; };

const Ctx = createContext<CtxT>(null as any);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [list, setList] = useState<Toast[]>([]);
    function push(msg:string, kind:Toast["kind"]) {
        const t = { id: Date.now()+Math.random(), msg, kind };
        setList(v => [t, ...v].slice(0,5));
        setTimeout(()=> setList(v => v.filter(x=>x.id !== t.id)), 3500);
    }
    const value = useMemo(()=>({
        toast:(m:string)=>push(m,"ok"),
        terror:(m:string)=>push(m,"err"),
    }),[]);
    return (
        <Ctx.Provider value={value}>
            {children}
            <div className="toast-wrap">
                {list.map(t=>(
                    <div key={t.id} className={`toast ${t.kind}`}>{t.msg}</div>
                ))}
            </div>
        </Ctx.Provider>
    );
}
export const useToast = () => useContext(Ctx);
