'use client'

import React, { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: string
  content: string
  approved: boolean
  createdAt: Date | string
}

interface LeadChatBoxProps {
  conversationId: string
  initialMessages: Message[]
  initialSuggestedReply: string
  suggestedMessageId: string
  alternativeReplies: string[]
  strategy: string
}

export default function LeadChatBox({
  conversationId,
  initialMessages,
  initialSuggestedReply,
  suggestedMessageId,
  alternativeReplies,
  strategy,
}: LeadChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.filter(m => m.role !== 'AI_SUGGESTED' || m.approved)
  )
  const [customerInput, setCustomerInput] = useState('')
  const [suggestedInput, setSuggestedInput] = useState(initialSuggestedReply)
  const [currentSuggestedId, setCurrentSuggestedId] = useState(suggestedMessageId)
  const [localAlternatives, setLocalAlternatives] = useState<string[]>(alternativeReplies)
  const [localStrategy, setLocalStrategy] = useState(strategy)
  
  const [isSimulating, setIsSimulating] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Simulate receiving a Customer message
  const handleSimulateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerInput.trim() || isSimulating) return

    setIsSimulating(true)
    const content = customerInput
    setCustomerInput('')

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'CUSTOMER',
          content
        })
      })

      const data = await res.json()

      if (res.ok && data.pipelineTriggered) {
        const { pipelineResult, latestMessages } = data
        
        // Filter out unapproved AI suggestion messages from the main timeline
        const filteredMessages = latestMessages
          .filter((m: any) => m.role !== 'AI_SUGGESTED' || m.approved)
          .reverse() // Keep cronological order

        setMessages(filteredMessages)

        // Update suggested text box and meta details
        setSuggestedInput(pipelineResult.suggestedReply?.message || '')
        setLocalAlternatives(pipelineResult.suggestedReply?.alternativeReplies || [])
        setLocalStrategy(pipelineResult.suggestedReply?.strategy || '')
        
        // Find the newly created AI suggestion ID in the response if any
        const newSuggestion = latestMessages.find((m: any) => m.role === 'AI_SUGGESTED' && !m.approved)
        if (newSuggestion) {
          setCurrentSuggestedId(newSuggestion.id)
        }

        // Force a page revalidation so the side panels get updated scores/advice
        window.location.reload()
      }
    } catch (error) {
      console.error('Customer simulation failed:', error)
    } finally {
      setIsSimulating(false)
    }
  }

  // Approve and send the AI Suggested Reply as Seller
  const handleApproveSuggested = async () => {
    if (!suggestedInput.trim() || isApproving) return

    setIsApproving(true)

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'SELLER',
          content: suggestedInput,
          suggestedMessageId: currentSuggestedId || undefined
        })
      })

      const data = await res.json()

      if (res.ok) {
        // Append approved message
        setMessages(prev => [...prev, data.message])
        
        // Clear suggested fields since it was sent
        setSuggestedInput('')
        setCurrentSuggestedId('')
        setLocalAlternatives([])
        setLocalStrategy('')
      }
    } catch (error) {
      console.error('Approve failed:', error)
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '1rem' }}>
      
      {/* 1. Chat Logs Container */}
      <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-secondary)' }}>
            <p>No messages yet in this conversation.</p>
            <p style={{ fontSize: '0.8rem' }}>Type in the simulator below to start!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCustomer = msg.role === 'CUSTOMER'
            return (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: isCustomer ? 'flex-start' : 'flex-end',
                width: '100%'
              }}>
                <div style={{
                  maxWidth: '75%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  borderTopLeftRadius: isCustomer ? '2px' : '12px',
                  borderTopRightRadius: isCustomer ? '12px' : '2px',
                  background: isCustomer ? '#1e293b' : 'var(--accent-blue-gradient)',
                  color: 'var(--text-primary)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '0.7rem', color: isCustomer ? 'var(--text-secondary)' : '#bfdbfe', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                    {isCustomer ? 'CUSTOMER' : 'SELLER'}
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', wordBreak: 'break-word', whiteSpace: 'pre-line' }}>{msg.content}</p>
                  <span style={{ fontSize: '0.65rem', color: isCustomer ? 'var(--text-muted)' : '#93c5fd', display: 'block', marginTop: '0.25rem', textAlign: 'right' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 2. Suggested Response Editor */}
      {suggestedInput && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '4px solid var(--accent-blue)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
              ⚡ Suggested Response Draft (Editable)
            </span>
            {localStrategy && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Strategy: {localStrategy}
              </span>
            )}
          </div>

          <textarea
            value={suggestedInput}
            onChange={(e) => setSuggestedInput(e.target.value)}
            className="input-field"
            rows={3}
            style={{ resize: 'none', fontSize: '0.9rem' }}
          />

          {/* Alternative Responses */}
          {localAlternatives.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Alternative drafts:</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {localAlternatives.map((alt, i) => (
                  <button
                    key={i}
                    onClick={() => setSuggestedInput(alt)}
                    className="btn-secondary"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px', textAlign: 'left', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    title={alt}
                  >
                    📝 Option {i + 1}: "{alt}"
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              onClick={handleApproveSuggested}
              disabled={isApproving}
              className="btn-primary"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
            >
              {isApproving ? 'Sending...' : '✅ Approve & Send'}
            </button>
          </div>
        </div>
      )}

      {/* 3. Customer Simulator Input */}
      <div className="card" style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px dashed rgba(239, 68, 68, 0.2)' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-hot)', display: 'block', marginBottom: '0.5rem' }}>
          📱 SIMULATOR: Send Message as Customer
        </span>
        <form onSubmit={handleSimulateCustomer} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={customerInput}
            onChange={(e) => setCustomerInput(e.target.value)}
            placeholder="Type a buyer message... (e.g. 'Bhai last price kya he?')"
            className="input-field"
            disabled={isSimulating}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            disabled={isSimulating}
            className="btn-gold"
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', flexShrink: 0 }}
          >
            {isSimulating ? 'Processing...' : '⚡ Send Mock Buyer'}
          </button>
        </form>
      </div>

    </div>
  )
}
