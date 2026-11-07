// ---------------------------------------------------------------------------
// drive.js — Google Drive video links (prompt Section 17).
// Community videos are NEVER uploaded to this hosting. A member pastes a
// link to a video in their own personal Google Drive; we validate it is
// really a Drive link, extract the file id, and embed Drive's own player
// (streamed from Drive, lazy-loaded). Anything that is not a Drive link
// is rejected with a clear error — no broken player is ever published.
// ---------------------------------------------------------------------------

// Accept the common Drive share URL shapes and pull out the file id.
// Returns the file id string, or null when the URL is not a Drive link.
export function parseDriveFileId(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  let id = null;
  // https://drive.google.com/file/d/<id>/view?usp=sharing
  let m = trimmed.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
  if (m) id = m[1];
  // https://drive.google.com/open?id=<id>  or  .../uc?id=<id>
  if (!id) {
    m = trimmed.match(/drive\.google\.com\/(?:open|uc)[?&][^#]*\bid=([A-Za-z0-9_-]+)/);
    if (m) id = m[1];
  }
  // https://docs.google.com/.../d/<id>/...
  if (!id) {
    m = trimmed.match(/docs\.google\.com\/\w+\/d\/([A-Za-z0-9_-]+)/);
    if (m) id = m[1];
  }
  return id;
}

export function isDriveLink(url) {
  return parseDriveFileId(url) !== null;
}

// Drive's embed/preview player URL for a file id. The video streams
// from Google Drive — no file is ever downloaded to this hosting.
export function driveEmbedUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

// The fallback link shown under the player.
export function driveViewUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}
