import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import ProductModal from "./ProductModal.jsx";
import ImageRotator from "./ImageRotator.jsx";

export default function InspirationsGrid() {
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

  return (
    <section id="idejas" className="p-8" style={{ background: 'var(--hero-bg)', color: 'var(--text)' }}>
      <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text)' }}>Iedvesma - Pārdoti</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sold.map((p) => (
          <div key={p.id} className="border p-4 rounded" style={{ background: 'var(--panel)', borderColor: 'var(--btn-ghost-border)', color: 'var(--text)' }}>
            <div className="mb-2 w-full aspect-square rounded overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
              <ImageRotator
                images={p.images || (p.imageURL ? [p.imageURL] : [])}
                autoRotateInterval={3000}
                useClock={true}
                pauseOnInteraction={false}
                onImageClick={() => setSelectedProduct(p)}
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
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          user={auth.currentUser}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
}
