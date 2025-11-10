import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress noisy dev logs (React devtools hint, React Router future flag)
if (import.meta && (import.meta as any).env && (import.meta as any).env.DEV) {
  const origInfo = console.info;
  console.info = (...args: any[]) => {
    const s = args[0];
    if (typeof s === 'string' && s.includes('Download the React DevTools')) return;
    origInfo.apply(console, args as any);
  };
  const origWarn = console.warn;
  console.warn = (...args: any[]) => {
    const s = args[0];
    if (typeof s === 'string' && s.includes('React Router Future Flag Warning')) return;
    origWarn.apply(console, args as any);
  };
}

createRoot(document.getElementById("root")!).render(<App />);
