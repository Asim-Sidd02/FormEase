"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export const themeScript = `(function(){try{var t=localStorage.getItem('fe-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("fe-theme", next ? "dark" : "light");
    } catch {}
  };
  return (
    <button
      onClick={toggle}
      className="grid size-10 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {dark ? <Sun className="size-[19px]" /> : <Moon className="size-[19px]" />}
    </button>
  );
}
