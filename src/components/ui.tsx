import { clsx } from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
export function Button({className,...props}:ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={clsx("btn",className)} {...props}/>; }
export function Input({className,...props}:InputHTMLAttributes<HTMLInputElement>) { return <input className={clsx("input",className)} {...props}/>; }
export function Textarea(props:TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className="input min-h-24" {...props}/>; }
export function Select(props:SelectHTMLAttributes<HTMLSelectElement>) { return <select className="input" {...props}/>; }
export function Card({children,className}:{children:ReactNode;className?:string}) { return <section className={clsx("card",className)}>{children}</section>; }
export function SectionCard({title,children}:{title:string;children:ReactNode}) { return <Card className="section-card"><h2 className="section-title">{title}</h2>{children}</Card>; }
export function StatCard({label,value}:{label:string;value:string|number}) { return <Card><p className="muted">{label}</p><p className="stat">{value}</p></Card>; }
export function Badge({children}:{children:ReactNode}) { return <span className="badge">{children}</span>; }
export function EmptyState({title,description}:{title:string;description:string}) { return <div className="empty"><strong>{title}</strong><p>{description}</p></div>; }
export function Skeleton(){return <div className="skeleton"/>;}
