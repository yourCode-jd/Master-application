"use client";
import { useEffect, useState } from "react";
export function ThemeToggle(){const [dark,setDark]=useState(false);useEffect(()=>{const d=localStorage.theme==="dark";setDark(d);document.documentElement.classList.toggle("dark",d)},[]);return <button className="icon-btn" aria-label="Toggle theme" onClick={()=>{const n=!dark;setDark(n);localStorage.theme=n?"dark":"light";document.documentElement.classList.toggle("dark",n)}}>{dark?"☀":"◐"}</button>}
