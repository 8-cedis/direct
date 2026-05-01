"use client";

export default function Button({ variant = "primary", size = "md", children, className = "", ...props }) {
  const variantClass = {
    primary: "fd-btn fd-btn-primary",
    secondary: "fd-btn fd-btn-secondary",
    ghost: "fd-btn",
    destructive: "fd-btn fd-btn-primary",
  }[variant];

  const sizeClass = { sm: "px-3 py-2 text-sm", md: "px-4 py-2.5", lg: "px-5 py-3 text-lg" }[size];

  return (
    <button className={`${variantClass} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
