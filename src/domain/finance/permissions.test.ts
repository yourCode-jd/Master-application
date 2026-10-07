import { describe, expect, it } from "vitest";
import { correctPayment, correctVisitService, saveCommissionRule, saveDiscountPolicy, settleCommission } from "./service";
import type { TenantContext } from "@/lib/tenant";

const context=(permissions:string[]):TenantContext=>({businessId:"permission-test-business",userId:"permission-test-user",permissions:new Set(permissions)});

describe("Phase 3C server-side permission gates",()=>{
  it("blocks staff from policy, rule management, settlement, corrections, and financial reports mutations",async()=>{const staff=context(["discounts.apply"]);await expect(saveDiscountPolicy(staff,{staffPercent:"5",managerPercent:"15",staffFixed:"0",managerFixed:"0"})).rejects.toThrow("settings.manage");await expect(saveCommissionRule(staff,undefined,{staffId:"x",serviceId:null,type:"PERCENTAGE",value:"10",active:true})).rejects.toThrow("commissions.manage");await expect(settleCommission(staff,{staffId:"x",periodStart:new Date(),periodEnd:new Date()})).rejects.toThrow("commissions.settle");await expect(correctPayment(staff,"payment",{amount:"10",method:"CASH",reason:"x"})).rejects.toThrow("payments.correct");await expect(correctVisitService(staff,"service",{staffId:null,serviceId:"x",amount:"10",reason:"x"})).rejects.toThrow("visits.correct");});
  it("requires explicit permissions rather than relying on role labels",async()=>{const manager=context(["commissions.view"]);await expect(saveDiscountPolicy(manager,{staffPercent:"5",managerPercent:"15",staffFixed:"0",managerFixed:"0"})).rejects.toThrow("settings.manage");await expect(saveCommissionRule(manager,undefined,{staffId:"x",serviceId:null,type:"FIXED",value:"80",active:true})).rejects.toThrow("commissions.manage");});
});
