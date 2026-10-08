import "./globals.css";
import "./salon.css";
import "./calendar.css";
import "./responsive.css";
import "./retention.css";
import type { Metadata } from "next";
import { PwaRegister } from "@/components/pwa-register";
export const metadata:Metadata={title:"LocalOps",description:"Local business operating foundation"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body>{children}<PwaRegister/></body></html>}
