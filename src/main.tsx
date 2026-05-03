import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/app.css";
import "./styles/preview.css";

const root = document.getElementById("root");
if (!root) throw new Error("未找到 #root 元素");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
