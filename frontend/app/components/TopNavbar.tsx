"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function TopNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { totalItems } = useCart();
  const { isAuthenticated } = useAuth();
  const showAccount = isMounted && isAuthenticated;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b-[0.5px] border-black/15 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="brand-title text-2xl text-[var(--color-dark-green)]">
          FarmDirect
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="/products" className="text-sm font-semibold text-[var(--color-dark-green)] hover:text-[var(--color-primary-green)]">
            Shop
          </Link>
          <Link href="/contact" className="text-sm font-semibold text-[var(--color-dark-green)] hover:text-[var(--color-primary-green)]">
            Contact
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="relative">
            <Link
              href="/cart"
              className="control inline-flex h-10 w-10 items-center justify-center text-[var(--color-primary-green)]"
              aria-label="Cart"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6h15l-1.5 9h-12z" />
                <path d="M6 6L5 3H2" />
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
              </svg>
            </Link>
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary-green)] px-1 text-xs font-bold text-white">
                {totalItems}
              </span>
            )}
          </div>

          <Link href={showAccount ? "/dashboard" : "/login"} className="btn-primary px-4 py-2 text-sm font-semibold">
            {showAccount ? "My Account" : "Sign In"}
          </Link>
        </div>

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="control inline-flex h-10 w-10 items-center justify-center md:hidden"
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </nav>

      {isOpen && (
        <div className="border-t-[0.5px] border-black/10 bg-white px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-2">
            <Link href="/products" onClick={() => setIsOpen(false)} className="control px-3 py-2 text-sm font-semibold text-[var(--color-dark-green)]">
              Shop
            </Link>
            <Link href="/contact" onClick={() => setIsOpen(false)} className="control px-3 py-2 text-sm font-semibold text-[var(--color-dark-green)]">
              Contact
            </Link>
            <Link href="/cart" onClick={() => setIsOpen(false)} className="control flex items-center justify-between px-3 py-2 text-sm font-semibold text-[var(--color-dark-green)]">
              Cart
              <span className="badge-pill bg-[var(--color-light-green)] text-[var(--color-primary-green)]">{totalItems}</span>
            </Link>
            <Link href={showAccount ? "/dashboard" : "/login"} onClick={() => setIsOpen(false)} className="btn-primary px-3 py-2 text-center text-sm font-semibold">
              {showAccount ? "My Account" : "Sign In"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
