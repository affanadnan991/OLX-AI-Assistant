import React from 'react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Fetch statistics directly from the database
  const [
    totalLeads,
    hotLeads,
    negotiatingLeads,
    wonLeads,
    totalProducts,
    recentLeads
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { temperature: 'HOT' } }),
    prisma.lead.count({ where: { status: 'NEGOTIATING' } }),
    prisma.lead.count({ where: { status: 'CLOSED_WON' } }),
    prisma.product.count({ where: { status: 'ACTIVE' } }),
    prisma.lead.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        customer: true,
        product: true,
      }
    })
  ])

  // Simple conversion rate calculation
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0'

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Sales Dashboard</h1>
          <p>Real-time analytics and customer lead qualification</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/leads" className="btn-primary">
            📥 View Lead Inbox
          </Link>
          <Link href="/products" className="btn-secondary">
            📱 Product Catalog
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* KPI 1 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL LEADS</span>
          <span style={{ fontSize: '2rem', fontWeight: 800 }}>{totalLeads}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 'bold' }}>Active OLX enquiries</span>
        </div>

        {/* KPI 2 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>HOT LEADS 🔥</span>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-hot)' }}>{hotLeads}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ready for purchase</span>
        </div>

        {/* KPI 3 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>NEGOTIATING</span>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-warm)' }}>{negotiatingLeads}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Price discussion active</span>
        </div>

        {/* KPI 4 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CONVERSION RATE</span>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{conversionRate}%</span>
          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>{wonLeads} deals won</span>
        </div>
      </div>

      {/* Main Grid: Active Products & Recent Leads */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem'
      }}>
        {/* Recent Activity */}
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚡</span> Recent Lead Activity
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {recentLeads.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem' }}>No recent leads found. Seed your database first!</p>
            ) : (
              recentLeads.map((lead) => (
                <div key={lead.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.04)'
                }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {lead.customer?.name || 'Anonymous Buyer'}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Interested in: <strong>{lead.product?.name}</strong> (PKR {lead.product?.price.toLocaleString()})
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`badge badge-${lead.temperature.toLowerCase()}`}>
                      {lead.temperature}
                    </span>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                      {lead.status}
                    </span>
                    <Link href={`/leads/${lead.id}`} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px' }}>
                      Chat
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Business Settings Quick Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2>⚙️ Sales Operating Rules</h2>
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>ACTIVE INVENTORY</h4>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{totalProducts} Active Ads</p>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>NEGOTIATION FLOOR</h4>
            <p style={{ fontSize: '0.85rem' }}>Max discount cap is configured at <strong>15%</strong>.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>Urgency weights are active for buyer scoring.</p>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>AI AGENT PROVIDER</h4>
            <p style={{ fontSize: '0.85rem' }}>Model: <code>gpt-4o / gpt-4o-mini</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
