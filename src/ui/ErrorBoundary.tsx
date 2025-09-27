import { Component, ReactNode } from "react";

type Props = { children: ReactNode };
type State = { err: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { err: null };
    static getDerivedStateFromError(err: Error) { return { err }; }
    componentDidCatch(err: Error, info: any) { console.error("UI error:", err, info); }
    render() {
        if (!this.state.err) return this.props.children;
        return (
            <div style={{maxWidth:560, margin:"80px auto"}} className="card">
                <h2 style={{marginTop:0}}>Something went wrong</h2>
                <p style={{color:"#9aa4b2"}}>{this.state.err.message}</p>
                <button onClick={()=>location.reload()} className="primary">Reload</button>
            </div>
        );
    }
}
