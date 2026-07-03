/**
 * SentinelAI — Card Component
 *
 * A surface container with optional glass morphism and hover effects.
 *
 * Props:
 *   glass   : bool — glassmorphism style (default: false)
 *   hover   : bool — lift-on-hover animation (default: false)
 *   padding : "sm" | "md" | "lg" (default: "md")
 *   as      : element type (default: "div")
 */

export default function Card({
  children,
  glass = false,
  hover = false,
  padding = "md",
  as: Tag = "div",
  className = "",
  ...props
}) {
  const paddingMap = { sm: "var(--space-4)", md: "var(--space-6)", lg: "var(--space-8)" };

  const classes = [
    glass ? "card-glass" : "card",
    hover ? "card-hover" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      className={classes}
      style={{ "--card-padding": paddingMap[padding] }}
      {...props}
    >
      {children}
    </Tag>
  );
}
