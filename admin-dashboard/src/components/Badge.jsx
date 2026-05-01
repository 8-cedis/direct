export default function Badge({ tone = "neutral", children, className = "" }) {
  const toneClass = {
    success: "fd-badge fd-badge-success",
    warning: "fd-badge fd-badge-warning",
    info: "fd-badge fd-badge-info",
    danger: "fd-badge fd-badge-danger",
    neutral: "fd-badge fd-badge-neutral",
    earth: "fd-badge fd-badge-earth",
    platinum: "fd-badge fd-badge-platinum",
  }[tone];

  return <span className={`${toneClass} ${className}`}>{children}</span>;
}
