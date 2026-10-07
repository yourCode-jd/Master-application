/** Immutable helpers for making a business boundary explicit in every data query. */
export function scopedWhere<T extends Record<string,unknown>>(businessId:string, where:T):T & {businessId:string}{return {...where,businessId};}
export function assertSameBusiness(expected:string, actual:string){if(expected!==actual)throw new Error("Tenant boundary violation");}
export type TimeSlot={startAt:Date;endAt:Date};
export function slotsOverlap(a:TimeSlot,b:TimeSlot){return a.startAt<b.endAt&&b.startAt<a.endAt;}
export function recommendedReturnDate(completedAt:Date,days:number){const date=new Date(completedAt);date.setDate(date.getDate()+days);return date;}
export function isReturnDue(date:Date,now=new Date()){return date.getTime()<=now.getTime();}
