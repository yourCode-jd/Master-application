import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

const SESSION_COOKIE = "local_ops_session";
function signature(value: string) { return createHmac("sha256", env.SESSION_SECRET).update(value).digest("base64url"); }
function token(userId: string, businessId: string) { const value = `${userId}.${businessId}`; return `${value}.${signature(value)}`; }
export async function setSession(userId: string, businessId: string) { const jar = await cookies(); jar.set(SESSION_COOKIE, token(userId,businessId), { httpOnly:true, sameSite:"lax", secure:process.env.NODE_ENV === "production", path:"/", maxAge:60*60*24*14 }); }
export async function clearSession() { const jar = await cookies(); jar.delete(SESSION_COOKIE); }
export async function getSession() {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value; if (!raw) return null;
  const [userId,businessId,sig] = raw.split("."); if (!userId || !businessId || !sig) return null;
  const expected = signature(`${userId}.${businessId}`); if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig),Buffer.from(expected))) return null;
  const user = await db.user.findUnique({ where:{id:userId}, select:{id:true,name:true,email:true,active:true} });
  return user?.active ? { user, businessId } : null;
}
export async function authenticate(email:string, password:string) {
  const { compare } = await import("bcryptjs"); const user = await db.user.findUnique({where:{email}});
  if (!user?.active || !(await compare(password,user.passwordHash))) return null;
  const membership = await db.userBusinessRole.findFirst({where:{userId:user.id,business:{status:"ACTIVE"}}, orderBy:{business:{createdAt:"asc"}}});
  return membership ? { userId:user.id,businessId:membership.businessId } : null;
}
