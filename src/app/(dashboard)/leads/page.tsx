import React from 'react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface LeadsPageProps {
  searchParams: Promise<{
    temperature?: string
    status?: string
  }>
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams
  const selectedTemp = params.temperature
  const selectedStatus = params.status

  const where: any = {}
  if (selectedTemp) where.temperature = selectedTemp
  if (selectedStatus) where.status = selectedStatus

  let leads = []
  try {
    leads = await prisma.lead.findMany({
      where,
      include: {
        customer: true,
        product: true,
        conversations: {
          select: { id: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
  } catch (error: any) {
    console.error("Database connection error in leads page:", error)
    return (
      <div className="card" style={{ padding: '2rem', maxWidth: '600px', margin: '2rem auto', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ color: 'var(--color-hot)', marginBottom: '1rem', fontSize: '1.5rem' }}>⚠️ Database Connection Error</h1>
        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Failed to load leads from the database.</p>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', color: '#fca5a5' }}>
          <strong>Error Details:</strong><br />
          {error.message || String(error)}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Lead Inbox</h1>
          <p>Qualify and track active negotiations with buyers</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', padding: '1rem 1.5rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filters:</span>
        
        {/* Temperature Filter */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/leads" className="btn-secondary" style={{
            padding: '0.35rem 0.75rem',
            fontSize: '0.8rem',
            background: !selectedTemp && !selectedStatus ? 'rgba(255,255,255,0.1)' : undefined
          }}>
            All
          </Link>
          <Link href="/leads?temperature=HOT" className="btn-secondary" style={{
            padding: '0.35rem 0.75rem',
            fontSize: '0.8rem',
            borderColor: selectedTemp === 'HOT' ? 'var(--color-hot)' : undefined,
            background: selectedTemp === 'HOT' ? 'var(--color-hot-bg)' : undefined
          }}>
            Hot 🔥
          </Link>
          <Link href="/leads?temperature=WARM" className="btn-secondary" style={{
            padding: '0.35rem 0.75rem',
            fontSize: '0.8rem',
            borderColor: selectedTemp === 'WARM' ? 'var(--color-warm)' : undefined,
            background: selectedTemp === 'WARM' ? 'var(--color-warm-bg)' : undefined
          }}>
            Warm ☀️
          </Link>
          <Link href="/leads?temperature=COLD" className="btn-secondary" style={{
            padding: '0.35rem 0.75rem',
            fontSize: '0.8rem',
            borderColor: selectedTemp === 'COLD' ? 'var(--color-cold)' : undefined,
            background: selectedTemp === 'COLD' ? 'var(--color-cold-bg)' : undefined
          }}>
            Cold ❄️
          </Link>
        </div>
      </div>

      {/* Leads Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {leads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No leads match active filter</p>
            <p style={{ fontSize: '0.85rem' }}>Try clearing filters or check database seeding status.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1rem 1.5rem' }}>Customer</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Product Interest</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Lead Score</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Temperature</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem' }}>Updated At</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="lead-row" style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lead.customer?.name || 'Anonymous'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {lead.customer?.phone || 'No phone'} ({lead.source})
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{lead.product?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Listed: PKR {lead.product?.price.toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          background: 'rgba(255,255,255,0.05)',
                          width: '40px',
                          height: '24px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          border: '1px solid var(--border-color)'
                        }}>
                          {lead.currentScore}
                        </div>
                        <div style={{ flex: 1, height: '4px', width: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${lead.currentScore}%`,
                            background: lead.temperature === 'HOT' ? 'var(--color-hot)' : lead.temperature === 'WARM' ? 'var(--color-warm)' : 'var(--color-cold)'
                          }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span className={`badge badge-${lead.temperature.toLowerCase()}`}>
                        {lead.temperature}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                        {lead.status}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {new Date(lead.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (
                      {new Date(lead.updatedAt).toLocaleDateString()}
                      )
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <Link href={`/leads/${lead.id}`} className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '6px' }}>
                        Open Chat
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .lead-row:hover {
          background: rgba(255, 255, 255, 0.015) !important;
        }
      `}</style>
    </div>
  )
}
