// Next.js config — LearnChart FX (Phase 1: user side only).
// No video files are ever served from this hosting; video comes from
// YouTube (course lessons) and Google Drive (community posts) embeds.
const nextConfig = {
  // Uploaded profile/community pictures live under /public/uploads.
  images: { remotePatterns: [] },
};
export default nextConfig;
