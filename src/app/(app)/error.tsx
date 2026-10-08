"use client";

export default function Error({ reset }: { reset: () => void }) {
  return <div className="card empty" role="alert"><strong>We couldn&apos;t load this page</strong><p>Try again. If the problem continues, return to the dashboard and contact the salon owner.</p><button className="btn secondary" onClick={reset}>Try again</button></div>;
}
