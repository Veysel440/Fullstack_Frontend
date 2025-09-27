import { AuthProvider, useAuth } from "./auth";
import Login from "./pages/Login";
import Items from "./pages/Items";
import { ToastProvider } from "./ui/toast";

function Gate() {
    const { user } = useAuth();
    return user ? <Items /> : <Login />;
}

export default function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <div className="container"><Gate /></div>
            </AuthProvider>
        </ToastProvider>
    );
}