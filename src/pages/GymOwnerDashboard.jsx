// ─── PATCH NOTES for GymOwnerDashboard.jsx ───────────────────────────────────
//
// In the desktop <header> block (search for "── MAIN ──" then the <header> tag):
//
// CHANGE 1 — Add a formatted date on the LEFT of the header (replaces empty <div>)
// CHANGE 2 — Remove the members count / gym name subtitle that was conditionally
//            rendered under the tab title when tab === 'members'
//
// Replace the existing <header> JSX (from "Top bar" comment to closing </header>)
// with the snippet below. Everything else in the file stays the same.
// ─────────────────────────────────────────────────────────────────────────────

/*

        { /* ── TOP BAR ── *}
        <header style={{ height: 54, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: D.bgSidebar, borderBottom: `1px solid ${D.border}` }}>
          
          { /* LEFT: formatted date *}
          <div style={{ fontSize: 13, fontWeight: 600, color: D.t2, letterSpacing: '-0.01em' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>

          { /* RIGHT: actions *}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isGymOwner && selectedGym?.join_code &&
            <button onClick={() => setShowPoster(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 7, background: 'rgba(255,255,255,0.03)', border: `1px solid ${D.border}`, color: D.t2, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'border-color 0.12s', fontFamily: 'inherit' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = D.borderHi}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = D.border}>
                <QrCode style={{ width: 11, height: 11 }} />
                <span style={{ fontFamily: 'monospace', letterSpacing: '0.10em' }}>{selectedGym.join_code}</span>
              </button>
            }

            {atRisk > 0 &&
            <button onClick={() => setTab('members')}
            style={{ background: D.redDim, color: D.red, border: `1px solid ${D.redBrd}`, borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '5px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                <AlertTriangle style={{ width: 11, height: 11 }} />{atRisk} at risk
              </button>
            }

            <button onClick={() => openModal('qrScanner')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', color: D.t2, border: `1px solid ${D.border}`, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit' }}
            onMouseEnter={(e) => {e.currentTarget.style.color = D.t1;e.currentTarget.style.borderColor = D.borderHi;}}
            onMouseLeave={(e) => {e.currentTarget.style.color = D.t2;e.currentTarget.style.borderColor = D.border;}}>
              <QrCode style={{ width: 12, height: 12 }} /> Scan QR
            </button>

            <button onClick={() => openModal('post')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: D.blue, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.12s', fontFamily: 'inherit' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
              <Plus style={{ width: 12, height: 12 }} /> New Post
            </button>

            <ProfileDropdown currentUser={currentUser} coaches={coaches} currentRole={selectedCoachId || (isCoach ? 'coach' : 'gym_owner')} onRoleSelect={handleRoleSelect} />

            <button
              onClick={() => setShowChat((o) => !o)}
              style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: showChat ? D.blueDim : 'rgba(255,255,255,0.03)', border: `1px solid ${showChat ? D.blueBrd : D.border}`, color: showChat ? D.blue : D.t3, cursor: 'pointer', position: 'relative', transition: 'all 0.12s', fontFamily: 'inherit' }}
              onMouseEnter={(e) => {if (!showChat) {e.currentTarget.style.color = D.t1;e.currentTarget.style.borderColor = D.borderHi;}}}
              onMouseLeave={(e) => {if (!showChat) {e.currentTarget.style.color = D.t3;e.currentTarget.style.borderColor = D.border;}}}>
              <MessageCircle style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </header>

*/

// This file is a patch guide only. Apply the header block above into
// GymOwnerDashboard.jsx, replacing from the "Top bar" comment to </header>.
// The two key changes vs the original:
//   1. Left side now shows the live date — no tab title, no member count line.
//   2. The `{tab === 'members' && <div>…</div>}` subtitle block is gone entirely.