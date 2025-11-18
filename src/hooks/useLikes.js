import { useState, useEffect } from "react";
import { db, auth } from "../firebase/firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
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
    // Use per-product listeners for stability. CollectionGroup listeners can
    // trigger internal SDK assertion failures or be blocked by browser
    // extensions; subscribing to each visible product's `likes` subcollection
    // is more robust and aligns with the security rules which govern per-doc
    // access.
    const unsubs = [];
    const counts = {};
    const map = {};

    products.forEach((p) => {
      counts[p.id] = 0;
      map[p.id] = false;

      const likesCol = collection(db, "products", p.id, "likes");
      try {
        const unsub = onSnapshot(
          likesCol,
          (snap) => {
            try {
              counts[p.id] = snap.size;
              if (user) {
                map[p.id] = snap.docs.some(
                  (d) => d.id === user.uid || d.data().userId === user.uid
                );
              } else {
                map[p.id] = false;
              }
              setLikesCount({ ...counts });
              setLikesMap({ ...map });
            } catch (e) {
              console.error("Per-product likes processing error:", e);
            }
          },
          (err) => {
            console.warn("Per-product likes listener error for", p.id, err);
          }
        );
        unsubs.push(unsub);
      } catch (e) {
        console.warn("Failed to subscribe to likes for product", p.id, e);
      }
    });

    // set initial state asynchronously to avoid synchronous setState inside
    // the effect (prevents cascading renders).
    let initTimer = setTimeout(() => {
      try {
        setLikesCount({ ...counts });
        setLikesMap({ ...map });
      } catch {
        /* ignore */
      }
    }, 0);

    return () => {
      try {
        clearTimeout(initTimer);
      } catch {
        /* ignore */
      }
      unsubs.forEach((u) => {
        try {
          u();
        } catch {
          /* ignore */
        }
      });
    };
  }, [products, user]);

  const toggleLike = async (productId) => {
    if (!user) return;
    const likeDoc = doc(db, "products", productId, "likes", user.uid);
    try {
      if (likesMap[productId]) {
        await deleteDoc(likeDoc);
      } else {
        // Include the owner's UID in the like document so Firestore rules
        // (which require the document's `userId` to match the authenticated
        // user) will allow the create operation.
        await setDoc(likeDoc, {
          userId: user.uid,
          liked: true,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  return { likesMap, likesCount, toggleLike, user };
}
