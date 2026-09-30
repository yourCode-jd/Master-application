import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { businessWhere, requirePermission, type TenantContext } from "@/lib/tenant";

export const customerInput = z.object({ name:z.string().trim().min(2).max(120), phone:z.string().trim().min(5).max(30), email:z.union([z.literal(""),z.string().email()]).optional(), notes:z.string().trim().max(2000).optional() });
export async function createCustomer(context:TenantContext, input:unknown) { requirePermission(context,"customers.create"); const data=customerInput.parse(input); const customer=await db.customer.create({data:{...data,email:data.email||null,notes:data.notes||null,businessId:context.businessId}}); await db.activity.create({data:{businessId:context.businessId,customerId:customer.id,type:"CUSTOMER_CREATED",title:"Customer created"}}); await audit(context,"customer.created","Customer",customer.id,undefined,{name:customer.name,phone:customer.phone}); return customer; }
export async function updateCustomer(context:TenantContext,id:string,input:unknown) { requirePermission(context,"customers.edit"); const data=customerInput.parse(input); const previous=await db.customer.findFirst({where:businessWhere(context,{id})}); if(!previous) throw new Error("Customer not found"); const customer=await db.customer.update({where:{id},data:{...data,email:data.email||null,notes:data.notes||null}}); await audit(context,"customer.updated","Customer",id,{name:previous.name,phone:previous.phone},{name:customer.name,phone:customer.phone}); return customer; }
