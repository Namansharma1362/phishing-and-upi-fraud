/**
 * SentinelAI — Button Component
 *
 * Props:
 *   variant  : "primary" | "secondary" | "ghost" | "danger"  (default: "primary")
 *   size     : "sm" | "md" | "lg" | "xl"                     (default: "md")
 *   loading  : bool — shows spinner, disables click
 *   disabled : bool
 *   as       : "button" | "a" — renders as anchor when needed
 *   All other props (onClick, href, type, etc.) are forwarded.
 */

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  as: Tag = "button",
  className = "",
  ...props
}) {
  const classes = [
    "btn",
    `btn-${variant}`,
    `btn-${size}`,
    loading ? "btn-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {children}
    </Tag>
  );
}
