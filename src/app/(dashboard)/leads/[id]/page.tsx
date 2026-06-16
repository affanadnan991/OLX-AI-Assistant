import React from 'react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import LeadChatBox from '@/components/leads/LeadChatBox'

export const dynamic = 'force-dynamic'

interface LeadDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const resolvedParams = await params
  const { id } = resolvedParams

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      customer: true,
      product: true,
      scoreHistory: {
        orderBy: { createdAt: 'desc' }
      },
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }
    }
  })

  if (!lead) {
    notFound()
  }

  // Get active conversation (each lead has 1 conversation created at setup)
  const conversation = lead.conversations[0]
  if (!conversation) {
    return (
      <div className="card">
        <h2>No Active Conversation</h2>
        <p>No active conversation thread was initialized for this lead.</p>
        <Link href="/leads" className="btn-secondary">Back to Inbox</Link>
      </div>
    )
  }

  // Extract AI Suggestion and coaching notes from the conversation messages
  const lastSuggestion = conversation.messages
    .filter(msg => msg.role === 'AI_SUGGESTED' && !msg.approved)
    .pop()

  const suggestedReply = lastSuggestion ? lastSuggestion.content : ''
  const lastSuggestionMeta = lastSuggestion ? (lastSuggestion.metadata as Record<string, any>) : {}
  const coachingNotes = lastSuggestionMeta?.coaching || null
  const alternativeReplies = lastSuggestionMeta?.alternativeReplies || []
  const strategy = lastSuggestionMeta?.strategy || ''

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)', gap: '1rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link href="/leads" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              📥 Lead Inbox
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              Lead #{lead.id.substring(lead.id.length - 6)}
            </span>
          </div>
          <h1 style={{ marginTop: '0.25rem', marginBottom: 0 }}>
            {lead.customer?.name || 'Anonymous Buyer'}
          </h1>
        </div>
        <div>
          <span className={`badge badge-${lead.temperature.toLowerCase()}`} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
            {lead.temperature} LEAD
          </span>
        </div>
      </div>

      {/* Main Split Interface */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '1.25rem', flex: 1, minHeight: 0 }}>
        {/* Left Side: Chat Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <LeadChatBox
            conversationId={conversation.id}
            initialMessages={conversation.messages}
            initialSuggestedReply={suggestedReply}
            suggestedMessageId={lastSuggestion?.id || ''}
            alternativeReplies={alternativeReplies}
            strategy={strategy}
          />
        </div>

        {/* Right Side: Meta panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.25rem' }}>
          
          {/* Lead Information */}
          <div className="card">
            <h2>👤 Lead Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Contact Name</span>
                <strong>{lead.customer?.name || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Phone Number</span>
                <strong>{lead.customer?.phone || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Lead Source</span>
                <strong>{lead.source}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Lead Score</span>
                <strong style={{ color: 'var(--accent-gold)' }}>{lead.currentScore} / 100</strong>
              </div>
            </div>
          </div>

          {/* Sales Coach Insights */}
          <div className="card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
            <h2 style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>🧠</span> AI Sales Coach
            </h2>
            {coachingNotes ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '0.15rem' }}>Customer Persona</span>
                  <p style={{ fontSize: '0.85rem' }}>{coachingNotes.customerProfile}</p>
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '0.15rem' }}>Recommended Strategy</span>
                  <p style={{ fontSize: '0.85rem' }}>{coachingNotes.recommendedApproach}</p>
                </div>
                {coachingNotes.riskFactors?.length > 0 && (
                  <div>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-hot)', display: 'block', marginBottom: '0.15rem' }}>Risk Factors</span>
                    <ul style={{ paddingLeft: '1rem', color: 'var(--text-secondary)' }}>
                      {coachingNotes.riskFactors.map((risk: string, i: number) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {coachingNotes.doNot?.length > 0 && (
                  <div>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-warm)', display: 'block', marginBottom: '0.15rem' }}>Do NOT</span>
                    <ul style={{ paddingLeft: '1rem', color: 'var(--text-secondary)' }}>
                      {coachingNotes.doNot.map((warning: string, i: number) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Coaching suggestions will appear here once the buyer sends a message.</p>
            )}
          </div>

          {/* Product Reference */}
          <div className="card">
            <h2>📱 Product Target</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Name</span>
                <strong>{lead.product?.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Condition</span>
                <span>{lead.product?.condition || '9/10'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>PTA Status</span>
                <span>{lead.product?.ptaApproved ? 'PTA Approved' : 'Not Approved'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>List Price</span>
                <strong style={{ color: 'var(--accent-gold)' }}>PKR {lead.product?.price.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Min Acceptable</span>
                <span>PKR {lead.product?.minAcceptablePrice?.toLocaleString() || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Conversation Summary */}
          <div className="card">
            <h2>📝 Conversation Summary</h2>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
              {conversation.summary || 'No summary generated yet.'}
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
