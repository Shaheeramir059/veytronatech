import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.VERCEL === "1" ? ".next" : process.env.VEYTRONA_DIST_DIR || (process.env.NODE_ENV === "development" ? ".next-dev" : ".next"),
  async headers() {
    return [{ source:"/:path*",headers:[
      {key:"X-Content-Type-Options",value:"nosniff"},
      {key:"X-Frame-Options",value:"DENY"},
      {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
      {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
      {key:"Content-Security-Policy",value:"object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"},
      ...(process.env.VEYTRONA_CSP_REPORT_ONLY === "1" ? [{key:"Content-Security-Policy-Report-Only",value:"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"}] : []),
    ] },
    {source:"/audio/receptionist/:asset(v[0-9]+-[a-z0-9-]+-[a-f0-9]{12}\\.mp3)",headers:[{key:"Cache-Control",value:"public, max-age=31536000, immutable"}]},
    {source:"/audio/receptionist/manifest.json",headers:[{key:"Cache-Control",value:"public, max-age=0, must-revalidate"}]},
    ];
  },
};
export default nextConfig;
