import type { Prisma, ReturnStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { TenantContext } from "@/lib/tenant";
import { AccessError, businessWhere, requirePermission } from "@/lib/tenant";
import { audit } from "@/lib/audit";

export type RetentionBucket = "DUE_SOON" | "DUE_TODAY" | "OVERDUE" | "LONG_OVERDUE" | "CONTACTED" | "BOOKED" | "RETURNED" | "DISMISSED" | "UPCOMING";
const activeStatuses: ReturnStatus[] = ["UPCOMING", "DUE", "CONTACTED", "BOOKED"];
const startOfDay = (date: Date) => { const value=new Date(date); value.setHours(0,0,0,0); return value; };

export function retentionBucket(recommendation: { status: ReturnStatus; recommendedDate: Date }, now=new Date()): RetentionBucket {
  if (recommendation.status === "RETURNED" || recommendation.status === "DISMISSED" || recommendation.status === "BOOKED" || recommendation.status === "CONTACTED") return recommendation.status;
  const today=startOfDay(now).getTime(); const due=startOfDay(recommendation.recommendedDate).getTime(); const days=Math.floor((due-today)/86_400_000);
  if(days < -30) return "LONG_OVERDUE"; if(days < 0) return "OVERDUE"; if(days === 0) return "DUE_TODAY"; if(days <= 7) return "DUE_SOON"; return "UPCOMING";
}
export function dueLabel(recommendation: { status: ReturnStatus; recommendedDate: Date }, now=new Date()) {
  const bucket=retentionBucket(recommendation,now); if(bucket==="DUE_TODAY")return "Due today"; if(bucket==="DUE_SOON")return `Due in ${Math.ceil((startOfDay(recommendation.recommendedDate).getTime()-startOfDay(now).getTime())/86_400_000)} days`; if(bucket==="OVERDUE"||bucket==="LONG_OVERDUE")return `Overdue ${Math.abs(Math.floor((startOfDay(recommendation.recommendedDate).getTime()-startOfDay(now).getTime())/86_400_000))} days`; return bucket[0]+bucket.slice(1).toLowerCase().replace("_"," ");
}

export async function createRecommendationsForVisit(tx: Prisma.TransactionClient, input: { businessId:string; visitId:string; customerId:string; completedAt:Date; services:{serviceId:string;staffId:string|null}[] }) {
  for(const row of input.services) {
    const service=await tx.service.findFirst({where:{id:row.serviceId,businessId:input.businessId}}); if(!service?.recommendedReturnDays) continue;
    await tx.returnRecommendation.updateMany({where:{businessId:input.businessId,customerId:input.customerId,serviceId:row.serviceId,visitId:{not:input.visitId},status:{in:activeStatuses}},data:{status:"RETURNED",returnedAt:input.completedAt}});
    const recommendedDate=new Date(input.completedAt); recommendedDate.setDate(recommendedDate.getDate()+service.recommendedReturnDays);
    await tx.returnRecommendation.upsert({where:{visitId_serviceId:{visitId:input.visitId,serviceId:row.serviceId}},update:{},create:{businessId:input.businessId,customerId:input.customerId,visitId:input.visitId,serviceId:row.serviceId,staffId:row.staffId,recommendedDate}});
  }
}

export async function markRecommendationsBooked(context: TenantContext, customerId:string, serviceId:string, appointmentId:string) {
  const appointment=await db.appointment.findFirst({where:businessWhere(context,{id:appointmentId,customerId})});
  if(!appointment) throw new AccessError("Appointment not found in this salon.");
  const rows=await db.returnRecommendation.findMany({where:{businessId:context.businessId,customerId,serviceId,status:{in:["UPCOMING","DUE","CONTACTED"]}}});
  await Promise.all(rows.map(row=>bookRecommendation(context,row.id,appointmentId)));
  return { count: rows.length };
}
export async function bookRecommendation(context:TenantContext,id:string,appointmentId:string){const recommendation=await getRecommendation(context,id);const appointment=await db.appointment.findFirst({where:businessWhere(context,{id:appointmentId,customerId:recommendation.customerId})});if(!appointment)throw new AccessError("Appointment not found in this salon.");if(!["UPCOMING","DUE","CONTACTED"].includes(recommendation.status))throw new Error("This follow-up is no longer available for booking.");const updated=await db.returnRecommendation.update({where:{id},data:{status:"BOOKED",appointmentId}});await db.activity.create({data:{businessId:context.businessId,customerId:recommendation.customerId,staffId:recommendation.staffId||null,type:"FOLLOWUP_APPOINTMENT_BOOKED",title:`Follow-up appointment booked for ${recommendation.service.name}`,metadata:{recommendationId:id,appointmentId}}});return updated;}
export async function restoreBookedRecommendations(context: TenantContext, appointmentId:string) {
  const rows=await db.returnRecommendation.findMany({where:businessWhere(context,{appointmentId,status:"BOOKED"})});
  await Promise.all(rows.map(row=>db.returnRecommendation.update({where:{id:row.id},data:{status:row.contactedAt?"CONTACTED":"UPCOMING",appointmentId:null}})));
  return rows;
}
export async function getRecommendation(context:TenantContext,id:string){const recommendation=await db.returnRecommendation.findFirst({where:businessWhere(context,{id}),include:{customer:true,service:true,visit:true,staff:true,appointment:true}});if(!recommendation)throw new AccessError("Follow-up not found in this salon.");return recommendation;}
export async function assignRecommendation(context:TenantContext,id:string,staffId:string|null){requirePermission(context,"followups.assign");const recommendation=await getRecommendation(context,id);if(staffId&&!await db.staffMember.findFirst({where:businessWhere(context,{id:staffId,status:"ACTIVE"})}))throw new Error("Staff member not found.");const updated=await db.returnRecommendation.update({where:{id},data:{staffId,assignedAt:staffId?new Date():null}});await audit(context,"followup.assigned","ReturnRecommendation",id,{staffId:recommendation.staffId},{staffId});if(staffId){const staff=await db.staffMember.findUnique({where:{id:staffId}});if(staff?.userId)await db.notification.create({data:{businessId:context.businessId,userId:staff.userId,type:"FOLLOWUP_ASSIGNED",title:"Follow-up assigned",message:`${recommendation.customer.name} · ${recommendation.service.name}`,link:"/follow-ups"}})}return updated;}
export async function contactRecommendation(context:TenantContext,id:string,note:string,action:"CALL"|"WHATSAPP_CONFIRMED_SENT"|"CONTACTED"){const recommendation=await getRecommendation(context,id);const assignedToUser=recommendation.staff?.userId===context.userId;if(!context.permissions.has("followups.manage")&&!assignedToUser)throw new AccessError("You can contact only your assigned follow-ups.");const updated=await db.returnRecommendation.update({where:{id},data:{status:"CONTACTED",contactedAt:new Date(),contactNote:note||null}});await db.activity.create({data:{businessId:context.businessId,customerId:recommendation.customerId,staffId:recommendation.staffId||null,type:`FOLLOWUP_${action}`,title:`Follow-up recorded for ${recommendation.service.name}`,description:note||null,metadata:{recommendationId:id}}});return updated;}
export async function dismissRecommendation(context:TenantContext,id:string,reason:string){requirePermission(context,"followups.dismiss");const recommendation=await getRecommendation(context,id);const updated=await db.returnRecommendation.update({where:{id},data:{status:"DISMISSED",dismissedAt:new Date(),contactNote:reason||null}});await db.activity.create({data:{businessId:context.businessId,customerId:recommendation.customerId,type:"FOLLOWUP_DISMISSED",title:`Follow-up dismissed for ${recommendation.service.name}`,description:reason||null,metadata:{recommendationId:id}}});await audit(context,"followup.dismissed","ReturnRecommendation",id,{status:recommendation.status},{status:"DISMISSED",reason});return updated;}
