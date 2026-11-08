// Next.js config — LearnChart FX (Phase 1: user side only).
// No video files are ever served from this hosting; video comes from
// YouTube (course lessons) and Google Drive (community posts) embeds.
const nextConfig = {
  // Uploaded profile/community pictures live under /public/uploads.
  images: { remotePatterns: [] },
  // Runtime uploads are served by the /api/files route handler (files
  // written to public/uploads/ at runtime 404 under `next start` on
  // this deployment), so /uploads/* rewrites there. Stored DB URLs
  // (/uploads/<folder>/<name>) keep working unchanged.
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: "/api/files/:path*" }];
  },
};
export default nextConfig;
