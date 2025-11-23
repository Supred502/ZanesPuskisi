import React, { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import {
  collectionGroup,
  collection,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  getDocs,
  doc as docRef,
} from "firebase/firestore";

function formatDate(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  } catch {
    return "";
  }
}

export default function CommentsAllPage() {
  const [comments, setComments] = useState([]);
  const [productsById, setProductsById] = useState({});
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    // Listen to comments stored under product subcollections (products/{id}/comments)
    const qGroup = query(collectionGroup(db, "comments"));
    // Also listen to a top-level `comments` collection (used by the seed script)
    const qTop = query(collection(db, "comments"));

    const handleSnap = async (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ref: d.ref, data: d.data() }));

      // collect unique product IDs from path: products/{productId}/comments/{commentId}
      const productIds = Array.from(
        new Set(
          docs
            .map((d) => (d.ref.parent.parent ? d.ref.parent.parent.id : null))
            .filter(Boolean)
        )
      );

      // fetch product docs for names (batch)
      const productMap = {};
      await Promise.all(
        productIds.map(async (pid) => {
          try {
            const p = await getDoc(docRef(db, "products", pid));
            productMap[pid] = p.exists() ? p.data() : null;
          } catch {
            productMap[pid] = null;
          }
        })
      );

      setProductsById((prev) => ({ ...prev, ...productMap }));

      setComments((prev) => {
        // merge with previous comments and dedupe by full path (ref.path)
        const merged = [...prev];
        for (const d of docs) {
          const existing = merged.find((m) => m._path === d.ref.path);
          const entry = {
            id: d.id,
            ...d.data,
            createdAt: d.data.createdAt,
            productId: d.ref.parent.parent ? d.ref.parent.parent.id : null,
            _path: d.ref.path,
          };
          if (existing) {
            // replace
            const idx = merged.indexOf(existing);
            merged[idx] = entry;
          } else {
            merged.push(entry);
          }
        }

        // sort by createdAt descending when available
        merged.sort((a, b) => {
          const ta = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
          const tb = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
          return tb - ta;
        });

        return merged;
      });
    };

    // Fallback: if collectionGroup/top-level listeners are blocked, fetch comments
    // by iterating products and reading each product's `comments` subcollection.
    const fetchCommentsPerProduct = async () => {
      try {
        const prodSnap = await getDocs(collection(db, "products"));
        const prods = prodSnap.docs.map((d) => ({ id: d.id, data: d.data() }));

        const all = [];
        const productMap = {};

        await Promise.all(
          prods.map(async (p) => {
            productMap[p.id] = p.data;
            try {
              const cSnap = await getDocs(collection(db, "products", p.id, "comments"));
              cSnap.docs.forEach((cd) => {
                all.push({
                  id: cd.id,
                  ...cd.data(),
                  productId: p.id,
                  _path: cd.ref.path,
                });
              });
            } catch (e) {
              // ignore per-product read errors
            }
          })
        );

        all.sort((a, b) => {
          const ta = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
          const tb = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
          return tb - ta;
        });

        setProductsById((prev) => ({ ...prev, ...productMap }));
        setComments(all);
        setLoadError(null);
        return true;
      } catch (err) {
        console.error("Fallback per-product comments failed:", err);
        setLoadError(err && err.message ? err.message : String(err));
        return false;
      }
    };

    const unsubGroup = onSnapshot(
      qGroup,
      (snap) => handleSnap(snap),
      async (err) => {
        console.error("Comments group listener error:", err);
        // try fallback
        const ok = await fetchCommentsPerProduct();
        if (!ok) setLoadError(err && err.message ? err.message : String(err));
      }
    );

    const unsubTop = onSnapshot(
      qTop,
      (snap) => handleSnap(snap),
      async (err) => {
        console.error("Top-level comments listener error:", err);
        // try fallback
        const ok = await fetchCommentsPerProduct();
        if (!ok) setLoadError(err && err.message ? err.message : String(err));
      }
    );

    return () => {
      unsubGroup();
      unsubTop();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {loadError && (
        <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-400 text-sm">
          <strong>Nevar ielādēt komentārus:</strong> {loadError}
          <div className="mt-2 text-xs text-gray-600">
            Iespējamie soļi: 1) Pārliecinieties, ka `firestore.rules` ir izvietotas uz Firebase ar
            <code>firebase deploy --only firestore:rules</code>, vai 2) pārbaudiet Firestore Console
            piekļuves atļaujas.
          </div>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4">Visi komentāri</h1>
      <p className="text-sm text-gray-600 mb-6">Rāda komentārus no visiem produktiem. Noklikšķiniet uz produkta nosaukuma, lai atvērtu preces lapu (ja pieejama).</p>

      <div className="space-y-4">
        {comments.length === 0 && <div className="text-gray-600">Nav komentāru.</div>}
        {comments.map((c) => (
          <div key={c.id} className="border rounded p-3">
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="text-sm text-gray-600">{c.name || c.author || "Anon"}</div>
                <div className="mt-1">{c.message || c.text || JSON.stringify(c)}</div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>{formatDate(c.createdAt)}</div>
                <div className="mt-2">
                  {c.productId ? (
                    <a
                      href={`/#product-${c.productId}`}
                      className="text-blue-600 underline"
                    >
                      {productsById[c.productId]?.name || `Produkts: ${c.productId}`}
                    </a>
                  ) : (
                    <span className="text-gray-500">Nezināms produkts</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
