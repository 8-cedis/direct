import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "FarmDirect Admin",
  description: "Admin dashboard for FarmDirect",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
