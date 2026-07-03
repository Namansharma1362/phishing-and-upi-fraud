/**
 * SentinelAI — Badge Component
 *
 * Displays a verdict or status label with appropriate colour coding.
 *
 * Props:
 *   variant : "safe" | "phishing" | "fraud" | "suspicious" | "info"
 *   dot     : bool — show a coloured dot prefix (default: false)
 */

const VARIANT_ICONS = {
  safe:       "✓",
  phishing:   "⚠",
  fraud:      "⚠",
  suspicious: "?",
  info:       "i",
};

export default function Badge({ children, variant = "info", dot = false, className = "" }) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {dot && (
        <span
          className="badge-dot"
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            marginRight: 4,
          }}
        />
      )}
      {children}
    </span>
  );
}
