import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/pwa";

// Iniciar la aplicación React
createRoot(document.getElementById("root")!).render(<App />);

// Registrar el Service Worker para soporte PWA
registerServiceWorker();
