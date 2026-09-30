"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearSession, authenticate, setSession } from "@/lib/auth";
import { getTenantContext } from "@/lib/tenant";
import { createCustomer, updateCustomer } from "@/domain/customers/service";
import { createTask, setTaskStatus } from "@/domain/tasks/service";
import { createItem, adjustStock } from "@/domain/inventory/service";
const value=(form:FormData,key:string)=>String(form.get(key)??"");
export async function loginAction(_: {error?:string}, form:FormData) { const auth=await authenticate(value(form,"email"),value(form,"password")); if(!auth) return {error:"Invalid email or password."}; await setSession(auth.userId,auth.businessId); redirect("/"); }
export async function logoutAction() { await clearSession(); redirect("/login"); }
export async function createCustomerAction(form:FormData) { const context=await getTenantContext(); await createCustomer(context,{name:value(form,"name"),phone:value(form,"phone"),email:value(form,"email"),notes:value(form,"notes")}); revalidatePath("/customers"); redirect("/customers"); }
export async function updateCustomerAction(id:string,form:FormData) { const context=await getTenantContext(); await updateCustomer(context,id,{name:value(form,"name"),phone:value(form,"phone"),email:value(form,"email"),notes:value(form,"notes")}); revalidatePath(`/customers/${id}`); revalidatePath("/customers"); redirect(`/customers/${id}`); }
export async function createTaskAction(form:FormData) { const context=await getTenantContext(); await createTask(context,{title:value(form,"title"),description:value(form,"description"),priority:value(form,"priority"),dueAt:value(form,"dueAt"),assignedStaffId:value(form,"assignedStaffId"),customerId:value(form,"customerId")}); revalidatePath("/tasks"); }
export async function taskStatusAction(id:string,status:"COMPLETED"|"DISMISSED") { const context=await getTenantContext(); await setTaskStatus(context,id,status); revalidatePath("/tasks"); revalidatePath("/"); }
export async function createItemAction(form:FormData) { const context=await getTenantContext(); await createItem(context,{name:value(form,"name"),sku:value(form,"sku"),unit:value(form,"unit")}); revalidatePath("/inventory"); }
export async function adjustStockAction(form:FormData) { const context=await getTenantContext(); await adjustStock(context,{itemId:value(form,"itemId"),locationId:value(form,"locationId"),quantityChange:Number(value(form,"quantityChange")),reason:value(form,"reason")}); revalidatePath("/inventory"); }
