import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { searchBusiness } from "@/lib/phase2-search";
import { EmptyState } from "@/components/ui";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q ?? "";
  const results = await searchBusiness(await getTenantContext(), query);
  return <><div className="page-head"><div><p className="eyebrow">WORKSPACE</p><h1>Search</h1></div></div><form className="search"><input name="q" defaultValue={query} autoFocus placeholder="Search customers, staff, inventory, suppliers"/><button>Search</button></form><div className="card">{query.length < 2 ? <EmptyState title="Search your workspace" description="Enter at least two characters to search records you can access."/> : results.length ? <ul className="plain-list">{results.map(result => <li key={`${result.type}-${result.id}`}><span className="badge">{result.type}</span><Link href={result.href}>{result.title}</Link><span className="muted">{result.detail}</span></li>)}</ul> : <EmptyState title="No matching records" description="Try a customer name, phone, item SKU, or supplier name."/>}</div></>;
}
