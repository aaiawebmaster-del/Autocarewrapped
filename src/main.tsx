import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { applyDocumentCompatClasses } from "./lib/browserCompat.ts";
import { getEmbedConfig } from "./lib/embedConfig.ts";
import "./styles/index.css";

applyDocumentCompatClasses();

if (typeof document !== 'undefined' && getEmbedConfig().isEmbedded) {
  document.documentElement.classList.add('is-embedded');
}

if (typeof window !== 'undefined') {
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onMotionPreferenceChange = () => {
    document.documentElement.classList.toggle('reduce-motion', motionQuery.matches);
  };
  motionQuery.addEventListener('change', onMotionPreferenceChange);
}

createRoot(document.getElementById("root")!).render(<App />);
