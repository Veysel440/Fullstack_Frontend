import { useState } from "react";
import { AuthProvider, useAuth } from "./auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Items from "./pages/Items";

function Gate() {
    const { user } = useAuth();
    const [view, setView] = useState<"login"|"register">("login");

    if (user) return <Items />;
    return view === "login"
        ? <Login onRegister={()=>setView("register")} />
        : <Register onDone={()=>setView("login")} />;
}

export default function App() {
    return (
        <AuthProvider>
            <Gate />
        </AuthProvider>
    );
}
