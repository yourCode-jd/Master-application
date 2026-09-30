import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export class AccessError extends Error { constructor(message="Unauthorized") { super(message); } }
export type TenantContext = { userId:string; businessId:string; permissions:Set<string> };
export async function getTenantContext(): Promise<TenantContext> {
  const session = await getSession(); if (!session) throw new AccessError("Please sign in.");
  const roles = await db.userBusinessRole.findMany({ where:{userId:session.user.id,businessId:session.businessId}, include:{role:{include:{permissions:{include:{permission:true}}}}} });
  return { userId:session.user.id,businessId:session.businessId,permissions:new Set(roles.flatMap(r=>r.role.permissions.map(p=>p.permission.key))) };
}
export function requirePermission(context: TenantContext, permission:string) { if (!context.permissions.has(permission)) throw new AccessError(`Missing permission: ${permission}`); }
export async function tenantDb(permission?:string) { const context=await getTenantContext(); if(permission) requirePermission(context,permission); return { context, db, where:<T extends Prisma.BusinessWhereInput>(where?:T) => ({ ...(where ?? {}), id:context.businessId }) }; }
export function businessWhere(context:TenantContext, where:Record<string,unknown>={}) { return { ...where, businessId:context.businessId }; }
