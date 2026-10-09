import { createHash } from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { compare, hash } from "bcryptjs";
import { db } from "@/lib/db";
import { requestPasswordReset, resetPassword } from "./password-reset";

const email="password-reset-it@test.local";
const digest=(value:string)=>createHash("sha256").update(value).digest("hex");
async function token(value:string,expiresAt:Date,userId:string){return db.passwordResetToken.create({data:{userId,tokenHash:digest(value),expiresAt}});}
let userId:string;
beforeAll(async()=>{await db.passwordResetToken.deleteMany({where:{user:{email}}});await db.user.deleteMany({where:{email}});const user=await db.user.create({data:{name:"Reset test",email,passwordHash:await hash("OldPassword1",10)}});userId=user.id;});
afterAll(async()=>{await db.passwordResetToken.deleteMany({where:{userId}});await db.user.delete({where:{id:userId}});await db.$disconnect();});
describe("password reset",()=>{
  it("creates a hashed request token and rate limits repeated requests",async()=>{const link=await requestPasswordReset(email,"http://local.test","test-rate");expect(link).toContain("token=");const stored=await db.passwordResetToken.findFirstOrThrow({where:{userId},orderBy:{createdAt:"desc"}});expect(stored.tokenHash).not.toContain(String(link).split("token=")[1]);for(let i=0;i<4;i++)await requestPasswordReset(email,"http://local.test","test-rate");expect(await requestPasswordReset(email,"http://local.test","test-rate")).toBeNull();});
  it("uses a valid token once and revokes prior sessions",async()=>{await token("valid",new Date(Date.now()+60_000),userId);await resetPassword("valid","NewPassword1");const user=await db.user.findUniqueOrThrow({where:{id:userId}});expect(await compare("NewPassword1",user.passwordHash)).toBe(true);expect(user.sessionVersion).toBe(1);await expect(resetPassword("valid","AnotherPass1")).rejects.toThrow("invalid or expired");});
  it("rejects invalid and expired tokens",async()=>{await expect(resetPassword("missing","AnotherPass1")).rejects.toThrow("invalid or expired");await token("expired",new Date(Date.now()-1_000),userId);await expect(resetPassword("expired","AnotherPass1")).rejects.toThrow("invalid or expired");});
  it("rejects inactive accounts without changing credentials",async()=>{await db.user.update({where:{id:userId},data:{active:false}});await token("inactive",new Date(Date.now()+60_000),userId);await expect(resetPassword("inactive","AnotherPass1")).rejects.toThrow("invalid or expired");await db.user.update({where:{id:userId},data:{active:true}});});
  it("does not accept weak passwords",async()=>{await token("weak",new Date(Date.now()+60_000),userId);await expect(resetPassword("weak","short")).rejects.toThrow("at least 10");});
});
