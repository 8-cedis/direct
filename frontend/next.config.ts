import type { NextConfig } from "next";

const adminPortalBaseUrl = (process.env.NEXT_PUBLIC_ADMIN_PORTAL_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/admin",
        destination: `${adminPortalBaseUrl}/admin`,
        permanent: false,
      },
      {
        source: "/admin/:path*",
        destination: `${adminPortalBaseUrl}/admin/:path*`,
        permanent: false,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        // Supabase Storage — covers all buckets on this project
        protocol: "https",
        hostname: "wzttxlhuecvyeldhmcqc.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
