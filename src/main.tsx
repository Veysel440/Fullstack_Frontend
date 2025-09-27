import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ToastProvider } from "./ui/toast";
import ErrorBoundary from "./ui/ErrorBoundary";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ToastProvider>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </ToastProvider>
    </StrictMode>
);
