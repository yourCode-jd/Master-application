/** Immutable helpers for making a business boundary explicit in every data query. */
export function scopedWhere<T extends Record<string,unknown>>(businessId:string, where:T):T & {businessId:string}{return {...where,businessId};}
export function assertSameBusiness(expected:string, actual:string){if(expected!==actual)throw new Error("Tenant boundary violation");}
