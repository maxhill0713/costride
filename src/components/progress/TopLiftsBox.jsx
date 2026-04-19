import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const CARD = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

function SBDModal({ open, onClose, onSave, initialValues }) {
  const [values, setValues] = useState(initialValues || { squat: '', bench: '', deadlift: '' });

  if (!open) return null;

  const handleSave = () => {
    onSave(values);
    onClose();
  };

  return ReactDOM.createPortal(
    <>
      <div
        className="fixed inset-0 z-[10003] bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-11/12 max-w-sm z-[10004] bg-slate-900/80 backdrop-blur-md border border-slate-700/30 rounded-3xl shadow-2xl shadow-black/40 text-white overflow-hidden">
        {/* top accent line */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.45), transparent)' }} />

        <div className="p-6 pb-4">
          <h3 className="text-xl font-black text-white mb-1">SBD PR Tracker</h3>
          <p className="text-slate-400 text-sm mb-5">
            Keep your squat, bench and deadlift one rep maxes up to date.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: 'squat', label: 'Squat' },
              { key: 'bench', label: 'Bench' },
              { key: 'deadlift', label: 'Deadlift' },
            ].map(({ key, label }) => (
              <div key={key} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em' }}>
                  {label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={values[key]}
                    onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                    style={{
                      width: 72,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: 8,
                      padding: '5px 8px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#e2e8f0',
                      textAlign: 'right',
                      outline: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'textfield',
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-200 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border border-slate-500/40 shadow-[0_4px_0_0_#0f172a,inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-[0_1px_0_0_#0f172a] active:translate-y-[3px] transition-all duration-75 transform-gpu"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-b from-blue-400 via-blue-600 to-blue-800 shadow-[0_4px_0_0_#1e3a8a,inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-[0_1px_0_0_#1e3a8a] active:translate-y-[3px] transition-all duration-75 transform-gpu"
          >
            Save
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

export default function TopLiftsBox({ sbdPRs, onSave }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [prs, setPRs] = useState(sbdPRs || { squat: '', bench: '', deadlift: '' });

  const handleSave = (values) => {
    setPRs(values);
    onSave?.(values);
  };

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        style={{
          ...CARD,
          borderRadius: 16,
          padding: '12px 12px',
          flex: 1,
          minHeight: 180,
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {[
          { key: 'squat', label: 'Squat' },
          { key: 'bench', label: 'Bench' },
          { key: 'deadlift', label: 'Deadlift' },
        ].map(({ key, label }, i) => (
          <div
            key={key}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              paddingTop: i === 0 ? 0 : 8,
              borderTop: i !== 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}
          >
            <h2 style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#e2e8f0',
              letterSpacing: '-0.01em',
              margin: 0,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }}>
              {label}
            </h2>
            {prs[key] ? (
              <p style={{ fontSize: 11, color: '#818cf8', fontWeight: 700, margin: '2px 0 0' }}>
                {prs[key]} kg
              </p>
            ) : (
              <p style={{ fontSize: 10, color: '#334155', fontWeight: 500, margin: '2px 0 0' }}>
                Tap to set
              </p>
            )}
          </div>
        ))}
      </div>

      <SBDModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialValues={prs}
      />
    </>
  );
}