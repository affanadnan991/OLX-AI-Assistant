import React from 'react'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  })

  // Next.js Server Action to add a product directly
  async function createProductAction(formData: FormData) {
    'use server'
    const name = formData.get('name') as string
    const brand = formData.get('brand') as string
    const model = formData.get('model') as string
    const price = parseInt(formData.get('price') as string || '0')
    const minAcceptablePrice = parseInt(formData.get('minAcceptablePrice') as string || '0')
    const batteryHealth = parseInt(formData.get('batteryHealth') as string || '0')
    const condition = formData.get('condition') as string
    const location = formData.get('location') as string
    const ptaApproved = formData.get('ptaApproved') === 'true'

    await prisma.product.create({
      data: {
        name,
        brand,
        model,
        price,
        minAcceptablePrice: minAcceptablePrice || null,
        batteryHealth: batteryHealth || null,
        condition,
        location,
        ptaApproved,
        images: JSON.stringify(['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600'])
      }
    })

    revalidatePath('/products')
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Product Catalog</h1>
          <p>Manage listing prices and minimum floor limits for negotiations</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '1.5rem' }}>
        {/* Products Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', alignContent: 'start' }}>
          {products.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
              <p>No products in database. Create one using the form.</p>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
                {/* Fallback Image */}
                <div style={{
                  height: '140px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  border: '1px solid var(--border-color)'
                }}>
                  📱
                </div>

                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{product.name}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {product.brand} • {product.model}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '0.7rem' }}>
                    {product.condition || '9/10'}
                  </span>
                  <span className="badge" style={{ background: product.ptaApproved ? 'var(--color-cold-bg)' : 'var(--color-spam-bg)', color: product.ptaApproved ? 'var(--color-cold)' : 'var(--text-muted)', fontSize: '0.7rem' }}>
                    {product.ptaApproved ? 'PTA Approved' : 'Non-PTA'}
                  </span>
                  {product.batteryHealth && (
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', fontSize: '0.7rem' }}>
                      🔋 {product.batteryHealth}% BH
                    </span>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>LIST PRICE</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--accent-gold)' }}>PKR {product.price.toLocaleString()}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>FLOOR PRICE</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      PKR {product.minAcceptablePrice ? product.minAcceptablePrice.toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Product Form */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h2>📱 Add New Product</h2>
          <form action={createProductAction} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Product Title</label>
              <input type="text" name="name" required className="input-field" placeholder="e.g. iPhone 13 Pro 128GB" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Brand</label>
                <input type="text" name="brand" required className="input-field" placeholder="Apple" />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Model</label>
                <input type="text" name="model" required className="input-field" placeholder="iPhone 13 Pro" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>List Price (PKR)</label>
                <input type="number" name="price" required className="input-field" placeholder="155000" />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Min Price Floor (PKR)</label>
                <input type="number" name="minAcceptablePrice" className="input-field" placeholder="145000" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Battery Health (%)</label>
                <input type="number" name="batteryHealth" className="input-field" placeholder="87" />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Condition</label>
                <input type="text" name="condition" className="input-field" placeholder="9/10" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Location</label>
                <input type="text" name="location" className="input-field" placeholder="Karachi" />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>PTA Approved?</label>
                <select name="ptaApproved" className="input-field">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-gold" style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}>
              ➕ Create Product
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
