import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { TenantContext } from "@/lib/tenant";
export async function audit(context:TenantContext, action:string, entityType:string, entityId:string, before?:Prisma.InputJsonValue, after?:Prisma.InputJsonValue) { await db.auditLog.create({data:{businessId:context.businessId,actorUserId:context.userId,action,entityType,entityId,before,after}}); }
