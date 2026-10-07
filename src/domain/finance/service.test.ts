import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { commissionAmount } from "./service";

describe("commission calculations",()=>{
  it("calculates percentage commission using decimal money",()=>{expect(commissionAmount(new Prisma.Decimal("1000"),"PERCENTAGE",new Prisma.Decimal("10")).toString()).toBe("100");expect(commissionAmount(new Prisma.Decimal("999.99"),"PERCENTAGE",new Prisma.Decimal("15")).toString()).toBe("150");});
  it("calculates fixed commission without floating point persistence",()=>{expect(commissionAmount(new Prisma.Decimal("500"),"FIXED",new Prisma.Decimal("80")).toString()).toBe("80");});
});
