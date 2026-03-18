import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const T = {
  bg:     '#060c18',
  card:   '#0b1120',
  border: 'rgba(255,255,255,0.08)',
  text1:  '#f0f4f8',
  text2:  '#94a3b8',
  text3:  '#475569',
  blue:   '#0ea5e9',
  green:  '#10b981',
  red:    '#ef4444',
  divider:'rgba(255,255,255,0.05)',
};

const DEFAULT_TIERS = [
  { name: 'Monthly',  price: '', description: 'Rolling monthly membership' },
  { name: 'Annual',   price: '', description: 'Best value — save 2 months' },
  { name: 'Day Pass', price: '', description: 'Pay per visit' },
];

export default function EditPricingModal({ open, onClose, gym, onSave, isLoading }) {
  const existing = gym?.membership_tiers?.length > 0
    ? gym.membership_tiers
    : DEFAULT_TIERS.map(t => ({ ...t, price: t.name === 'Monthly' ? (gym?.price || '') : '' }));

  const [tiers, setTiers] = useState(existing);

  const updateTier = (i, field, val) => {
    setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
  };

  const addTier = () => setTiers(prev => [...prev, { name: '', price: '', description: '' }]);
  const removeTier = (i) => setTiers(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    const filtered = tiers.filter(t => t.name.trim());
    // Also update the top-level price field from the Monthly tier
    const monthly = filtered.find(t => t.name.toLowerCase() === 'monthly');
    onSave({
      membership_tiers: filtered,
      ...(monthly?.price ? { price: monthly.price } : {}),
    });
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${T.divider}` }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text1 }}>Membership Pricing</div>
            <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>Set pricing tiers visible to prospective members</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, color: T.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tiers.map((tier, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 12, background: T.bg, border: `1px solid ${T.border}`, position: 'relative' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Tier Name</div>
                    <input
                      value={tier.name}
                      onChange={e => updateTier(i, 'name', e.target.value)}
                      placeholder="e.g. Monthly, Annual"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, color: T.text1, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Price (£)</div>
                    <input
                      value={tier.price}
                      onChange={e => updateTier(i, 'price', e.target.value)}
                      placeholder="e.g. 39.99"
                      type="number"
                      step="0.01"
                      min="0"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, color: T.text1, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Description (optional)</div>
                  <input
                    value={tier.description}
                    onChange={e => updateTier(i, 'description', e.target.value)}
                    placeholder="e.g. Best value — save 2 months"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, color: T.text1, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                {tiers.length > 1 && (
                  <button onClick={() => removeTier(i)} style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 6, background: `${T.red}14`, border: `1px solid ${T.red}22`, color: T.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 style={{ width: 11, height: 11 }} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addTier} style={{ padding: '10px 14px', borderRadius: 10, background: `${T.blue}08`, border: `1px dashed ${T.blue}30`, color: T.blue, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
              <Plus style={{ width: 13, height: 13 }} /> Add Tier
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.divider}`, display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, color: T.text2, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={isLoading} style={{ flex: 2, padding: '9px 14px', borderRadius: 9, background: isLoading ? 'rgba(14,165,233,0.3)' : T.blue, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: isLoading ? 'default' : 'pointer', fontFamily: 'inherit' }}>
            {isLoading ? 'Saving…' : 'Save Pricing'}
          </button>
        </div>
      </div>
    </div>
  );
}