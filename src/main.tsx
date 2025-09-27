import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { ToastProvider } from "./ui/toast";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ToastProvider>
            <div className="container">
                <App />
            </div>
        </ToastProvider>
    </StrictMode>
);
