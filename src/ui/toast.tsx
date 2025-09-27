import { createContext, useContext, useMemo, useRef, useState } from "react";
import { Sentry, sentryEnabled } from "../sentry";

type Toast = { id:number; msg:string; kind:"ok"|"err" };
type CtxT = { toast(msg:string):void; terror(msg:string):void; };

const Ctx = createContext<CtxT>(null as any);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [list, setList] = useState<Toast[]>([]);
    const timers = useRef<Record<number, any>>({});

    function push(msg:string, kind:Toast["kind"]) {
        const id = Date.now()+Math.random();
        const t: Toast = { id, msg, kind };
        setList(v => [t, ...v].slice(0, 6));
        timers.current[id] = setTimeout(() => remove(id), 3500);

        if (sentryEnabled) {
            if (kind === "err") Sentry.captureMessage(msg, "error");
            else Sentry.addBreadcrumb({ category: "toast", level: "info", message: msg });
        }
    }
    function remove(id:number){
        clearTimeout(timers.current[id]); delete timers.current[id];
        setList(v => v.filter(x => x.id !== id));
    }

    const value = useMemo(() => ({
        toast: (m:string)=>push(m,"ok"),
        terror: (m:string)=>push(m,"err"),
    }), []);

    return (
        <Ctx.Provider value={value}>
            {children}
            <div className="toast-wrap" aria-live="polite" aria-atomic="true">
                {list.map(t=>(
                    <div key={t.id} className={`toast ${t.kind}`} role={t.kind==="err"?"alert":"status"}>
                        <span>{t.msg}</span>
                        <button className="x" aria-label="Dismiss" onClick={()=>remove(t.id)}>✕</button>
                    </div>
                ))}
            </div>
        </Ctx.Provider>
    );
}
export const useToast = () => useContext(Ctx);
