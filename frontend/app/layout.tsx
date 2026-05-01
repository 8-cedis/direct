import type { Metadata } from "next";
import { Lato, Playfair_Display } from "next/font/google";
import AdminAccessFab from "./components/AdminAccessFab";
import Footer from "./components/Footer";
import TopNavbar from "./components/TopNavbar";
import Providers from "./providers";
import "./globals.css";

const lato = Lato({
  variable: "--font-body",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  weight: ["600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FarmDirect",
  description: "Farm fresh produce delivered to urban homes in Accra",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lato.variable} ${playfair.variable} antialiased`}>
        <Providers>
          <div className="site-bg flex min-h-screen flex-col">
            <TopNavbar />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-10">{children}</main>
            <Footer />
            <AdminAccessFab />
          </div>
        </Providers>
      </body>
    </html>
  );
}
