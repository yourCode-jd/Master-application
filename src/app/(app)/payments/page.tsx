import { correctPaymentAction, createTransactionAction } from "@/app/actions";
import { EmptyState } from "@/components/ui";
import { requireSalon } from "@/domain/salon/service";
import { db } from "@/lib/db";
import { getTenantContext, requirePermission } from "@/lib/tenant";

export default async function PaymentsPage() {
  const c = await getTenantContext(); await requireSalon(c); requirePermission(c, "transactions.view");
  const records = await db.transactionRecord.findMany({ where: { businessId: c.businessId, type: "PAYMENT_IN" }, orderBy: { occurredAt: "desc" }, take: 100 });
  return <><div className="page-head"><div><p className="eyebrow">PAYMENTS</p><h1>Recorded payments</h1></div></div>
    {c.permissions.has("transactions.manage") && <details className="card payment-entry"><summary><strong>+ Record payment</strong></summary><form action={createTransactionAction} className="form-grid"><input type="hidden" name="type" value="PAYMENT_IN"/><label>Amount<input name="amount" inputMode="decimal" required/></label><label>Method<select name="method"><option>CASH</option><option>UPI</option><option>CARD</option><option>BANK</option><option>OTHER</option></select></label><label>Reference <span className="muted">(optional)</span><input name="reference" placeholder="Visit or customer reference"/></label><label>Note <span className="muted">(optional)</span><input name="notes"/></label><button className="btn">Record payment</button></form></details>}
    <div className="card table-wrap">{records.length ? <table><thead><tr><th>Date</th><th>Method</th><th>Amount</th><th>Reference</th><th>Note</th><th></th></tr></thead><tbody>{records.map(record=><tr key={record.id}><td>{record.occurredAt.toLocaleString()}</td><td>{record.method}</td><td>₹{record.amount.toString()}</td><td>{record.reference||"—"}</td><td>{record.notes||"—"}{record.correctedAt&&<small className="muted"> · corrected</small>}</td><td>{c.permissions.has("payments.correct")&&<details><summary>Correct</summary><form action={correctPaymentAction.bind(null,record.id)} className="compact-followup-form"><label>Amount<input name="amount" defaultValue={record.amount.toString()} required/></label><label>Method<select name="method" defaultValue={record.method}><option>CASH</option><option>UPI</option><option>CARD</option><option>BANK</option><option>OTHER</option></select></label><label>Reason<input name="reason" required/></label><button className="text-button">Save correction</button></form></details>}</td></tr>)}</tbody></table> : <EmptyState title="No payments recorded" description="Payments recorded when a visit is completed will appear here."/>}</div>
  </>;
}
