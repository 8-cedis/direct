export default function AdminAccessFab() {
  const adminPortalHref = process.env.NEXT_PUBLIC_ADMIN_PORTAL_BASE_URL || "http://localhost:3001/admin/login";

  return (
    <a
      href={adminPortalHref}
      className="fixed bottom-5 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-earth-brown)] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-[#6f4109] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-light-green)] focus-visible:ring-offset-2 md:bottom-6 md:right-6"
      aria-label="Open admin dashboard"
    >
      <span aria-hidden="true">▦</span>
      <span>Open Dashboard</span>
    </a>
  );
}
