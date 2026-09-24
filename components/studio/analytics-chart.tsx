export default function AnalyticsChart({ rows }: { rows: Record<string, unknown>[] }) {
  const points = rows.map((row) => ({ label: String(row.day || row.timestamp || "").slice(5, 10), value: Number(row.pageviews || 0) })).filter((point) => point.value > 0 || point.label);
  const max = Math.max(1, ...points.map((point) => point.value));
  if (!points.length) return <div className="studio-empty"><strong>No traffic points returned</strong><p>Vercel did not return a timeline for this range.</p></div>;
  return <div className="studio-chart" aria-label="Page views over time">{points.slice(-30).map((point, index) => <div className="studio-chart-bar" key={`${point.label}-${index}`} title={`${point.label}: ${point.value} views`}><span style={{ height: `${Math.max(3, (point.value / max) * 100)}%` }} /><small>{point.label}</small></div>)}</div>;
}
