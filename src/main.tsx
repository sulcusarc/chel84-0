import { createRoot } from "react-dom/client";
import App from "./App";
import { applyTheme, getPref, Theme } from "./lib/prefs";
import "./styles.css";

applyTheme(getPref("theme", "system") as Theme);
createRoot(document.getElementById("root")!).render(<App />);
