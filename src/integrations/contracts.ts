export type SimulatedDelivery={id:string;status:"SIMULATED";createdAt:Date};
export interface MessagingProvider { send(input:{to:string;body:string}):Promise<SimulatedDelivery> }
export interface EmailProvider { send(input:{to:string;subject:string;body:string}):Promise<SimulatedDelivery> }
export interface StorageProvider { put(input:{name:string;content:Uint8Array}):Promise<{key:string}> }
export interface PaymentProvider { recordManual(input:{amount:number;reference:string}):Promise<{status:"MANUAL"}> }
export const simulatedMessaging:MessagingProvider={async send(){return{id:crypto.randomUUID(),status:"SIMULATED",createdAt:new Date()}}};
export const simulatedEmail:EmailProvider={async send(){return{id:crypto.randomUUID(),status:"SIMULATED",createdAt:new Date()}}};
