import { useState, useEffect } from "react";
import { db, auth } from "../firebase/firebase";
import {
  collectionGroup,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

export default function useLikes(products = []) {
  const [user, setUser] = useState(auth.currentUser);
  const [likesMap, setLikesMap] = useState({}); // productId => liked?
  const [likesCount, setLikesCount] = useState({}); // productId => total likes

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const likesQuery = collectionGroup(db, "likes");
    const unsubscribe = onSnapshot(
      likesQuery,
      (snapshot) => {
        try {
          const counts = {};
          const map = {};
          snapshot.docs.forEach((d) => {
            try {
              const likesRef = d.ref; // products/{productId}/likes/{uid}
              const productRef = likesRef?.parent?.parent; // products/{productId}
              if (!productRef) return;
              const pid = productRef.id;
              counts[pid] = (counts[pid] || 0) + 1;
              if (user && d.id === user.uid) map[pid] = true;
            } catch {
              // ignore per-document issues
            }
          });

          // Ensure all visible products have entries (0 or false)
          products.forEach((p) => {
            if (!(p.id in counts)) counts[p.id] = 0;
            if (!(p.id in map)) map[p.id] = false;
          });

          setLikesCount(counts);
          setLikesMap(map);
        } catch (e) {
          console.error("Error processing likes snapshot:", e);
        }
      },
      (err) => {
        console.warn("Likes listener error:", err);
        // If permissions or an internal SDK error occurs, unsubscribe to avoid
        // repeated internal assertion failures in some SDK versions.
        try {
          unsubscribe();
        } catch {
          /* ignore */
        }
        // Reset to safe defaults
        setLikesCount({});
        setLikesMap({});
      }
    );

    return () => {
      try {
        unsubscribe();
      } catch {
        /* ignore */
      }
    };
  }, [products, user]);

  const toggleLike = async (productId) => {
    if (!user) return;
    const likeDoc = doc(db, "products", productId, "likes", user.uid);
    try {
      if (likesMap[productId]) {
        await deleteDoc(likeDoc);
      } else {
        await setDoc(likeDoc, { liked: true });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  return { likesMap, likesCount, toggleLike, user };
}
