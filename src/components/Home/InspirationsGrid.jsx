import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase.js";
import ProductModal from "../Modal/ProductModal.jsx";
import ImageRotator from "../ImageRotator.jsx";

export default function InspirationsGrid({ maxRows } = {}) {
  const [sold, setSold] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "products"),
      where("available", "==", false)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSold(items);
    });
    return () => unsub();
  }, []);

  // Track window width to compute columns when a row limit is requested
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    function onResize() {
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const columns = windowWidth >= 1024 ? 4 : windowWidth >= 768 ? 3 : windowWidth >= 640 ? 2 : 1;
  const visibleCount = maxRows ? columns * maxRows : sold.length;
  const visibleSold = sold.slice(0, visibleCount);

  return (
    <section id="idejas" className="p-8" style={{ background: 'var(--hero-bg)', color: 'var(--text)' }}>
      <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text)' }}>Iedvesma - Pārdoti</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {visibleSold.map((p) => (
          <div key={p.id} className="border p-4 rounded" style={{ background: 'var(--panel)', borderColor: 'var(--btn-ghost-border)', color: 'var(--text)' }}>
            <div className="mb-2 w-full aspect-square rounded overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
              <ImageRotator
                images={p.images || (p.imageURL ? [p.imageURL] : [])}
                autoRotateInterval={3000}
                useClock={true}
                pauseOnInteraction={false}
                onImageClick={(i) => setSelectedProduct({ product: p, index: i ?? 0 })}
                className="w-full h-full"
                imgClassName="cursor-pointer"
                fallback={<div className="text-gray-400">Nav attēla</div>}
              />
            </div>
            <h3 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>{p.name}</h3>
            <p style={{ color: 'var(--muted)' }}>{p.description}</p>
          </div>
        ))}
      </div>
      {maxRows && sold.length > visibleCount && (
        <div className="mt-6">
          <button
            type="button"
            className="w-full py-3 rounded text-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
            onClick={(e) => {
              e.preventDefault();
              try {
                window.location.assign("/iedvesma");
              } catch {
                window.location.href = "/iedvesma";
              }
            }}
          >
            Parādīt visas iedvesmas
          </button>
        </div>
      )}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct.product || selectedProduct}
          startIndex={selectedProduct.index ?? 0}
          user={auth.currentUser}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
}
