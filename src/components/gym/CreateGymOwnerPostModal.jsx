// --- REPLACE YOUR JSX RETURN WITH THIS ---

return (
  <>
    <style>{`
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
      }

      .modal {
        width: 100%;
        max-width: 520px;
        background: #0b1220;
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,0.06);
        display: flex;
        flex-direction: column;
        max-height: 90vh;
      }

      .textarea {
        width: 100%;
        background: transparent;
        border: none;
        outline: none;
        color: #fff;
        font-size: 16px;
        font-weight: 500;
        resize: none;
      }

      .pill {
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid rgba(255,255,255,0.1);
        color: rgba(255,255,255,0.6);
      }

      .pill.active {
        background: rgba(59,130,246,0.15);
        color: #60a5fa;
        border-color: rgba(59,130,246,0.4);
      }
    `}</style>

    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Create Post</h2>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.5 }}>{gym?.name}</p>
            </div>
            <button onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflowY: 'auto' }}>

          {/* Content (HERO) */}
          <textarea
            className="textarea"
            rows={4}
            placeholder="What do you want to share with your members?"
            value={content}
            onChange={e => setContent(e.target.value)}
          />

          {/* Post type pills */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {POST_TYPES.map(t => (
              <div
                key={t.value}
                className={`pill ${postType === t.value ? 'active' : ''}`}
                onClick={() => setPostType(t.value)}
              >
                {t.label}
              </div>
            ))}
          </div>

          {/* Image */}
          <div style={{ marginTop: 16 }}>
            <label style={{ cursor: 'pointer', fontSize: 13, opacity: 0.7 }}>
              + Add image
              <input type="file" hidden onChange={handleFileUpload} />
            </label>

            {imageUrl && (
              <div style={{ marginTop: 10 }}>
                <img
                  src={imageUrl}
                  style={{ width: '100%', borderRadius: 12 }}
                />
              </div>
            )}
          </div>

          {/* Advanced toggle */}
          <details style={{ marginTop: 20 }}>
            <summary style={{ cursor: 'pointer', fontSize: 13, opacity: 0.6 }}>
              Advanced options
            </summary>

            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Tags */}
              <input
                placeholder="Tags (comma separated)"
                className="dm-inp"
                onBlur={(e) => setTags(e.target.value.split(',').map(t => t.trim()))}
              />

              {/* CTA */}
              <input
                placeholder="CTA Text"
                className="dm-inp"
                onChange={e => setCallToAction({ ...callToAction, enabled: true, text: e.target.value })}
              />
              <input
                placeholder="CTA Link"
                className="dm-inp"
                onChange={e => setCallToAction({ ...callToAction, enabled: true, link: e.target.value })}
              />

              {/* Schedule */}
              <input
                type="datetime-local"
                className="dm-inp"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
              />

              {/* Pin */}
              <label style={{ fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={e => setIsPinned(e.target.checked)}
                /> Pin post
              </label>

            </div>
          </details>

        </div>

        {/* Footer */}
        <div style={{
          padding: 16,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 10
        }}>
          <button onClick={onClose}>Cancel</button>

          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            style={{
              background: '#2563eb',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none'
            }}
          >
            {submitting ? 'Posting...' : scheduledDate ? 'Schedule' : 'Post'}
          </button>
        </div>

      </div>
    </div>
  </>
);