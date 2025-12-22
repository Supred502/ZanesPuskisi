const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

setGlobalOptions({ region: "europe-north1" });

if (!admin.apps.length) {
  admin.initializeApp();
}

const WHATSAPP_PHONE = defineSecret("WHATSAPP_PHONE");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getFirstImageUrl(product) {
  const images = Array.isArray(product?.images) ? product.images : [];
  if (images.length) return images[0];
  if (product?.imageURL) return product.imageURL;
  return "";
}

exports.share = onRequest(
  {
    cors: false,
    memory: "128MiB",
  },
  async (req, res) => {
    try {
      // Accept /share/<id> via hosting rewrite, or direct query ?id=<id>
      const pathParts = (req.path || "/").split("/").filter(Boolean);
      const productId = req.query.id || pathParts[pathParts.length - 1];
      const sharePrefix = pathParts[0] === "s" ? "s" : "share";

      if (!productId) {
        res
          .status(400)
          .set("Content-Type", "text/plain; charset=utf-8")
          .send("Missing product id");
        return;
      }

      const snap = await admin.firestore().doc(`products/${productId}`).get();
      if (!snap.exists) {
        res
          .status(404)
          .set("Content-Type", "text/plain; charset=utf-8")
          .send("Product not found");
        return;
      }

      const product = snap.data() || {};

      // When invoked via Firebase Hosting rewrite, the request's Host can be the
      // underlying Cloud Run domain. Use forwarded headers to build links on the
      // public Hosting domain so the deep-link opens the actual site.
      const forwardedProto = (req.get("x-forwarded-proto") || "")
        .split(",")[0]
        .trim();
      const proto = forwardedProto || "https";
      const requestedHost =
        req.get("x-fh-requested-host") ||
        req.get("x-forwarded-host") ||
        req.get("host");

      const origin = `${proto}://${requestedHost}`;
      const shareUrl = `${origin}/${sharePrefix}/${encodeURIComponent(
        productId
      )}`;
      // Use a query param (not a #hash) so in-app browsers can't lose the product id during redirects.
      // The SPA will read ?p=<id> and open the modal.
      const openUrl = `${origin}/produkti?p=${encodeURIComponent(productId)}`;

      const title = product?.name ? `${product.name}` : "Produkts";
      const price = product?.price != null ? `${product.price} €` : "";
      const descRaw = product?.description || "";
      const description = [price, descRaw]
        .filter(Boolean)
        .join(" — ")
        .slice(0, 200);

      const imageUrl = getFirstImageUrl(product);

      // Keep cache short to avoid stale HTML (host/proto) sticking around.
      res.set("Cache-Control", "public, max-age=60, s-maxage=60");

      // Always return HTML with OG tags.
      // Some preview systems use different UAs and won't follow redirects for OG.
      // Real browsers will immediately redirect via meta refresh + JS.
      res.set("Content-Type", "text/html; charset=utf-8");

      const html = `<!doctype html>
<html lang="lv">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>

    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(shareUrl)}" />
    ${
      imageUrl
        ? `<meta property="og:image" content="${escapeHtml(imageUrl)}" />`
        : ""
    }

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    ${
      imageUrl
        ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`
        : ""
    }

    <link rel="canonical" href="${escapeHtml(shareUrl)}" />

    <meta http-equiv="refresh" content="0;url=${escapeHtml(openUrl)}" />
  </head>
  <body>
    <p>Atver produktu…</p>
    <p><a href="${escapeHtml(openUrl)}">Atvērt</a></p>
    <script>
      // Redirect real browsers to the SPA deep-link.
      setTimeout(function () {
        window.location.replace(${JSON.stringify(openUrl)})
      }, 50)
    </script>
  </body>
</html>`;

      res.status(200).send(html);
    } catch (err) {
      console.error("share() failed:", err);
      res
        .status(500)
        .set("Content-Type", "text/plain; charset=utf-8")
        .send("Internal error");
    }
  }
);

exports.whatsapp = onRequest(
  {
    cors: false,
    memory: "128MiB",
    secrets: [WHATSAPP_PHONE],
  },
  async (req, res) => {
    try {
      const phone = (WHATSAPP_PHONE.value() || "").trim();
      if (!phone) {
        res
          .status(500)
          .set("Content-Type", "text/plain; charset=utf-8")
          .send("Missing WHATSAPP_PHONE secret");
        return;
      }

      const textRaw = req.query?.text;
      const text = typeof textRaw === "string" ? textRaw : "";
      const target = `https://wa.me/${encodeURIComponent(
        phone
      )}?text=${encodeURIComponent(text)}`;

      res.set("Cache-Control", "no-store");
      res.redirect(302, target);
    } catch (err) {
      console.error("whatsapp() failed:", err);
      res
        .status(500)
        .set("Content-Type", "text/plain; charset=utf-8")
        .send("Internal error");
    }
  }
);
