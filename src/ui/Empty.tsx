export default function Empty({ title="No data", hint, action }: {title?:string; hint?:string; action?:React.ReactNode;}){
    return (
        <div style={{padding:"32px 0", textAlign:"center", color:"#9aa4b2"}}>
            <div style={{fontSize:16, marginBottom:6}}>{title}</div>
            {hint && <div style={{marginBottom:10}}>{hint}</div>}
            {action}
        </div>
    );
}
