import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getTenantContext } from "@/lib/tenant";
import { db } from "@/lib/db";
export const dynamic="force-dynamic";
export default async function AppLayout({children}:{children:React.ReactNode}) { try { const context=await getTenantContext(); const business=await db.business.findUniqueOrThrow({where:{id:context.businessId}}); return <AppShell context={context} businessName={business.name}>{children}</AppShell> } catch { redirect("/login") } }
