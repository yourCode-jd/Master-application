import { db } from "@/lib/db";

export type InventoryNotificationType = "INVENTORY_LOW_STOCK" | "INVENTORY_OUT_OF_STOCK" | "PURCHASE_RECEIVED" | "INVENTORY_NEGATIVE_OVERRIDE";

/** Delivers one actionable inventory alert per recipient per day unless it has been read. */
export async function notifyInventory(businessId:string,type:InventoryNotificationType,title:string,message:string,link:string){
  const recipients=await db.userBusinessRole.findMany({where:{businessId,role:{key:{in:["OWNER","MANAGER"]}}},select:{userId:true},distinct:["userId"]});
  const userIds=recipients.map(row=>row.userId);if(!userIds.length)return;
  const preferences=await db.notificationPreference.findMany({where:{businessId,userId:{in:userIds},type},select:{userId:true,enabled:true}});const enabled=new Map(preferences.map(row=>[row.userId,row.enabled]));
  const since=new Date();since.setHours(0,0,0,0);
  for(const userId of userIds){if(enabled.get(userId)===false)continue;const duplicate=await db.notification.findFirst({where:{businessId,userId,type,title,readAt:null,createdAt:{gte:since}}});if(!duplicate)await db.notification.create({data:{businessId,userId,type,title,message,link}});}
}
