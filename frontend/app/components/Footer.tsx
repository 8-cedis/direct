import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 bg-[var(--color-dark-green)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className="brand-title text-2xl">FarmDirect</p>
            <p className="mt-2 text-sm text-white/85">Farm fresh. City delivered.</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Shop</p>
            <Link href="/products" className="footer-link block text-sm text-white/85 hover:text-white">
              Vegetables
            </Link>
            <Link href="/products?category=fruits" className="footer-link block text-sm text-white/85 hover:text-white">
              Fruits
            </Link>
            <Link href="/products?category=grains" className="footer-link block text-sm text-white/85 hover:text-white">
              Grains
            </Link>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Company</p>
            <Link href="/contact" className="footer-link block text-sm text-white/85 hover:text-white">
              Contact
            </Link>
            <Link href="/dashboard" className="footer-link block text-sm text-white/85 hover:text-white">
              Dashboard
            </Link>
            <Link href="/orders/tracking" className="footer-link block text-sm text-white/85 hover:text-white">
              Track Order
            </Link>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Support</p>
            <a
              href="https://wa.me/233240000000"
              target="_blank"
              rel="noreferrer"
              className="footer-link block text-sm text-white/85 hover:text-white"
            >
              WhatsApp: +233 24 000 0000
            </a>
            <p className="text-sm text-white/75">Mon-Sat, 8:00 AM - 7:00 PM</p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/20 pt-4 text-sm text-white/75">
          <p>Copyright 2026 FarmDirect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
