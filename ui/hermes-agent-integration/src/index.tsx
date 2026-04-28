import React from "react";
import ReactDOM from "react-dom/client";
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import "./globals.css";
import App from "./App";

CapacitorUpdater.notifyAppReady();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
