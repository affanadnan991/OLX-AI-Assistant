import React from 'react'
import Link from 'next/link'
import '@/app/globals.css'

export const metadata = {
  title: 'OLX AI Sales Operating System',
  description: 'AI-driven Sales OS for OLX Mobile Dealers',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--accent-gold-gradient)',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#0b0f19',
            fontSize: '1.2rem'
          }}>
            ⚡
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.05em' }}>
              OLX SALES OS
            </h2>
            <span style={{ color: 'var(--accent-gold)', fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              AI Assistant v1.0
            </span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <Link href="/" className="sidebar-link" style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            color: 'var(--text-secondary)',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}>
            <span style={{ marginRight: '0.75rem' }}>📊</span> Dashboard
          </Link>
          <Link href="/leads" className="sidebar-link" style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            color: 'var(--text-secondary)',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}>
            <span style={{ marginRight: '0.75rem' }}>📥</span> Lead Inbox
          </Link>
          <Link href="/products" className="sidebar-link" style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            color: 'var(--text-secondary)',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}>
            <span style={{ marginRight: '0.75rem' }}>📱</span> Product Catalog
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', fontSize: '1rem', justifyContent: 'center' }}>
              👨‍💼
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Sales Manager</p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="main-content">
        {children}
      </main>

      {/* Adding simple inline hover effects for vanilla CSS links */}
      <style>{`
        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          color: var(--text-primary) !important;
        }
      `}</style>
    </div>
  )
}
