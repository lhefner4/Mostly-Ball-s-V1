export default function SiteNoticeModal({ notice, onClose }) {
  if (!notice) return null
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 1000 }}
    >
      <div
        role="dialog" aria-modal="true" aria-label="Site Notice"
        onClick={e => e.stopPropagation()}
        style={{ background: "#1B2A6B", border: "3px solid #FFD700", borderRadius: 12, padding: "28px 24px 22px", maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
      >
        <p style={{ color: "#F5F0E0", fontFamily: "'Arial', sans-serif", fontSize: 15, lineHeight: 1.55, marginBottom: 22, whiteSpace: "pre-wrap" }}>
          {notice}
        </p>
        <button
          autoFocus
          onClick={onClose}
          style={{ background: "#FFD700", color: "#1B2A6B", border: "none", borderRadius: 6, padding: "10px 36px", fontSize: 15, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}
        >
          OK
        </button>
      </div>
    </div>
  )
}
