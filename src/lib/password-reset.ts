import { createHash, randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { simulatedEmail } from "@/integrations/contracts";

const TTL_MS=60*60_000, WINDOW_MS=15*60_000, MAX_ATTEMPTS=5;
const digest=(value:string)=>createHash("sha256").update(value).digest("hex");
async function requestKey(email:string,addressOverride?:string){const h=addressOverride?null:await headers(),address=addressOverride||(process.env.TRUST_PROXY==="true"?h?.get("x-forwarded-for")?.split(",")[0]?.trim():undefined)||h?.get("x-real-ip")||"unknown";return `reset:${digest(`${email.trim().toLowerCase()}|${address}`)}`;}
async function audit(userId:string,action:string){const role=await db.userBusinessRole.findFirst({where:{userId},select:{businessId:true}});if(role)await db.auditLog.create({data:{businessId:role.businessId,actorUserId:userId,action,entityType:"User",entityId:userId}});}

export async function requestPasswordReset(email:string,origin:string,addressOverride?:string){
  const key=await requestKey(email,addressOverride),now=new Date(),row=await db.authRateLimit.findUnique({where:{key}});
  if(row?.blockedUntil&&row.blockedUntil>now)return null;
  const attempts=!row||now.getTime()-row.windowStarted.getTime()>=WINDOW_MS?1:row.attempts+1;
  await db.authRateLimit.upsert({where:{key},create:{key,attempts:1,windowStarted:now},update:{attempts,windowStarted:attempts===1?now:row!.windowStarted,blockedUntil:attempts>=MAX_ATTEMPTS?new Date(now.getTime()+WINDOW_MS):null}});
  const user=await db.user.findUnique({where:{email:email.trim().toLowerCase()}}); if(!user?.active)return null;
  await db.passwordResetToken.updateMany({where:{userId:user.id,usedAt:null},data:{usedAt:now}});
  const token=randomBytes(32).toString("base64url"); await db.passwordResetToken.create({data:{userId:user.id,tokenHash:digest(token),expiresAt:new Date(now.getTime()+TTL_MS)}});
  await simulatedEmail.send({to:user.email,subject:"Reset your LocalOps password",body:`Use ${origin}/reset-password?token=${token} within 60 minutes.`}); await audit(user.id,"auth.password_reset_requested");
  return process.env.NODE_ENV==="production"?null:`${origin}/reset-password?token=${token}`;
}

export async function resetPassword(token:string,password:string){
  if(!/^(?=.*[A-Za-z])(?=.*\d).{10,128}$/.test(password))throw new Error("Use at least 10 characters including a letter and number.");
  const row=await db.passwordResetToken.findUnique({where:{tokenHash:digest(token)},include:{user:true}}),now=new Date();
  if(!row||row.usedAt||row.expiresAt<=now||!row.user.active)throw new Error("This reset link is invalid or expired.");
  const passwordHash=await hash(password,12);
  const result=await db.$transaction(async tx=>{const used=await tx.passwordResetToken.updateMany({where:{id:row.id,usedAt:null,expiresAt:{gt:now}},data:{usedAt:now}});if(!used.count)throw new Error("This reset link is invalid or expired.");await tx.passwordResetToken.updateMany({where:{userId:row.userId,usedAt:null},data:{usedAt:now}});return tx.user.update({where:{id:row.userId},data:{passwordHash,sessionVersion:{increment:1}},select:{id:true}});});
  await audit(result.id,"auth.password_reset_completed"); return result;
}
