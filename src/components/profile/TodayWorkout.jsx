// ─── PATCH: replace the existing showInfo block in TodayWorkout.jsx ───────────
//
// Find this block (starts around the showInfo conditional, inside the Header section):
//
//   {showInfo &&
//   <div className="relative z-50 bg-blue-500/10 border border-blue-400/30 rounded-lg p-3" onClick={(e) => e.stopPropagation()}>
//       <p className="text-xs text-blue-200 leading-relaxed mb-2 font-medium">
//         <strong className="text-blue-100">How to use:</strong>
//       </p>
//       <ul className="text-[11px] text-blue-200/90 space-y-1.5 leading-relaxed">
//         <li>• <strong>Expand:</strong> Tap the down arrow to view all exercises</li>
//         ...
//       </ul>
//     </div>
//   }
//
// Replace it with the block below:

          {showInfo &&
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(96,165,250,0.07) 0%, rgba(52,211,153,0.04) 100%)',
              border: '1px solid rgba(96,165,250,0.16)',
              borderRadius: 10,
              padding: '10px 13px',
              overflow: 'hidden',
            }}>
            {/* top shimmer line */}
            <div style={{
              position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.35), transparent)',
            }} />
            <p style={{
              fontSize: 11, fontWeight: 700, color: '#93c5fd',
              margin: '0 0 7px', letterSpacing: '0.02em',
            }}>
              How to use
            </p>
            <ul style={{
              margin: 0, padding: 0, listStyle: 'none',
              display: 'flex', flexDirection: 'column', gap: 5,
            }}>
              {[
                { label: 'Check in', text: 'You must be at your gym for the check-in button to appear — hit it at the start of every session to start your timer and unlock logging.' },
                { label: 'Expand', text: 'Tap the down arrow to view all exercises.' },
                { label: 'Switch workout', text: 'Tap the workout name to swap to a different day\'s session.' },
                { label: 'Update weight/reps', text: 'Click the pencil icon next to any exercise, enter new values, then save.' },
                { label: 'Track progress', text: 'Green/red badges show weight increases/decreases vs. last workout.' },
                { label: 'Timer', text: 'Tap Timer to open the rest/cardio timer bar at the bottom of the screen.' },
                { label: 'Plate calculator', text: 'Use the calculator icon to see which plates to load on the bar.' },
                { label: 'Log completion', text: 'Hit "Log Workout" when finished to save your progress.' },
              ].map(({ label, text }) => (
                <li key={label} style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                  <span style={{ color: '#475569', fontSize: 11, lineHeight: 1.55, flexShrink: 0 }}>•</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.55, fontWeight: 500 }}>
                    <span style={{ color: '#93c5fd', fontWeight: 700 }}>{label}:</span>{' '}{text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          }