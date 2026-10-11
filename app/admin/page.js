'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/Providers';
import { money } from '@/lib/format';

export default function AdminDashboard() {
  const app = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!app || !app.admin) return;
    (async () => {
      setLoading(true);
      const d = await app.fetchAnalytics();
      setData(d);
      setLoading(false);
    })();
  }, [app && app.admin]);

  if (!app || !app.admin) return null;
  if (loading || !data) return <div style={loadStyle}>Loading analytics…</div>;

  const { totals, daily, topProducts, recentOrders, statusBreakdown } = data;
  const maxRev = Math.max(1, ...daily.map(d => d.revenue));
  const maxOrd = Math.max(1, ...daily.map(d => d.count));
  const statusMap = Object.fromEntries(statusBreakdown.map(s => [s.status, s.count]));

  return (
    <>
      <header className="adm-page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Welcome back, {app.admin.name}. Here’s how WebCodeShop is doing.</p>
        </div>
      </header>

      <div className="kpi-grid">
        <KPI label="Revenue" value={money(totals.revenue)} accent="webcode" sub="All-time completed orders" />
        <KPI label="Orders" value={totals.orders} accent="orange" sub={(statusMap.completed || 0) + ' completed · ' + (statusMap.pending || 0) + ' pending'} />
        <KPI label="Customers" value={totals.customers} accent="teal" sub="Registered accounts" />
        <KPI label="Products" value={totals.products} accent="navy" sub={totals.activeCoupons + ' active coupon' + (totals.activeCoupons !== 1 ? 's' : '')} />
      </div>

      <div className="adm-grid-2">
        <section className="adm-card">
          <header className="adm-card-head">
            <div><h3>Sales this week</h3><p className="muted">Last 7 days</p></div>
            <div className="adm-card-num">{money(daily.reduce((s, d) => s + d.revenue, 0))}</div>
          </header>
          {daily.length === 0 ? (
            <div className="empty-state small">No orders this week yet.</div>
          ) : (
            <div className="barchart">
              {daily.map((d, i) => {
                const barStyle = { height: Math.max(4, Math.round((d.revenue / maxRev) * 100)) + '%' };
                return (
                  <div key={i} className="bar-col">
                    <div className="bar-wrap">
                      <div className="bar" style={barStyle} title={money(d.revenue) + ' • ' + d.count + ' orders'}/>
                    </div>
                    <div className="bar-lbl">{d.day.slice(5)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="adm-card">
          <header className="adm-card-head">
            <div><h3>Top products</h3><p className="muted">By revenue (completed orders)</p></div>
          </header>
          <div className="top-list">
            {topProducts.map((p) => {
              const iconStyle = { background: p.gradient };
              return (
                <div key={p.id} className="top-row">
                  <div className="top-ic" style={iconStyle}>{p.icon}</div>
                  <div className="top-info">
                    <div className="n">{p.name}</div>
                    <div className="muted">{p.sales} sold</div>
                  </div>
                  <div className="top-rev">{money(p.revenue)}</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="adm-card">
        <header className="adm-card-head">
          <div><h3>Recent orders</h3><p className="muted">Latest 8</p></div>
          <Link href="/admin/orders" className="btn btn-soft btn-sm">View all →</Link>
        </header>
        <table className="adm-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id}>
                <td><Link href={'/admin/orders'} className="link">{o.id}</Link></td>
                <td><div className="cell-stack"><b>{o.customer_name}</b><span className="muted">{o.customer_email}</span></div></td>
                <td><b>{money(o.total)}</b></td>
                <td><span className={'status-pill ' + o.status}>{o.status}</span></td>
                <td className="muted">{(o.placed_at || '').slice(0, 10)}</td>
              </tr>
            ))}
            {recentOrders.length === 0 && <tr><td colSpan={5} className="empty-state small">No orders yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </>
  );
}

function KPI({ label, value, sub, accent }) {
  const accentClass = 'kpi kpi-' + (accent || 'webcode');
  return (
    <div className={accentClass}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub muted">{sub}</div>
    </div>
  );
}
const loadStyle = { padding: 60, textAlign: 'center', color: 'var(--muted)' };
