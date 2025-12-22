export default function normalizeFirebaseStorageUrl(input) {
  if (!input || typeof input !== "string") return input;

  // Leave local assets / special schemes untouched.
  if (
    input.startsWith("/") ||
    input.startsWith("blob:") ||
    input.startsWith("data:")
  ) {
    return input;
  }

  const swapSuffix = (bucket) => {
    if (typeof bucket !== "string") return bucket;
    // Project's current bucket is *.firebasestorage.app. Some older URLs may
    // use the historical *.appspot.com bucket name.
    if (bucket.endsWith(".appspot.com")) {
      return bucket.replace(/\.appspot\.com$/i, ".firebasestorage.app");
    }
    return bucket;
  };

  try {
    // Handle Firebase Storage API URLs:
    // - https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?...
    // - https://storage.googleapis.com/download/storage/v1/b/<bucket>/o/<path>?...
    const u = new URL(input);

    // Pattern: .../b/<bucket>/o/...
    const m = u.pathname.match(/\/b\/([^/]+)\/o\//);
    if (m && m[1]) {
      const rawBucket = m[1];
      const decodedBucket = decodeURIComponent(rawBucket);
      const nextBucket = swapSuffix(decodedBucket);
      if (nextBucket !== decodedBucket) {
        const nextRaw = encodeURIComponent(nextBucket);
        u.pathname = u.pathname.replace(`/b/${rawBucket}/`, `/b/${nextRaw}/`);
        return u.toString();
      }
    }

    // Pattern: https://storage.googleapis.com/<bucket>/<object>
    if (u.hostname === "storage.googleapis.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 1) {
        const decodedBucket = decodeURIComponent(parts[0]);
        const nextBucket = swapSuffix(decodedBucket);
        if (nextBucket !== decodedBucket) {
          parts[0] = encodeURIComponent(nextBucket);
          u.pathname = "/" + parts.join("/");
          return u.toString();
        }
      }
    }

    return input;
  } catch {
    // If it's not a valid URL (e.g. some older stored value), keep it as-is.
    return input;
  }
}
