import { db } from "../firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from "react";
import useLikes from "../hooks/useLikes";
import ProductModal from "./ProductModal.jsx";
import ImageRotator from "./ImageRotator.jsx";

export default function ProductsGrid() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const unsubscribeProducts = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(items);
      },
      (err) => {
        // Handle permission/index errors gracefully in UI during development
        console.warn("Products listener error:", err);
        setProducts([]);
      }
    );

    return () => {
      unsubscribeProducts();
    };
  }, []);

  const availableProducts = products.filter((p) => p.available === true);

  const [selectedProduct, setSelectedProduct] = useState(null);

  // If the URL hash indicates a specific product (e.g. #product-<id>), open that product's modal.
  useEffect(() => {
    function openFromHash() {
      const h = window.location.hash;
      if (h && h.startsWith("#product-")) {
        const id = h.replace("#product-", "");
        const found = products.find((p) => p.id === id);
        if (found) {
          setSelectedProduct({ product: found, index: 0 });
        }
      }
    }

    // Try once when products change (after fetching)
    openFromHash();

    // Also listen for hash changes while the page is open
    const onHash = () => openFromHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [products]);

  // useLikes hook provides likesMap, likesCount, toggleLike and user
  const { likesMap, likesCount, toggleLike, user: hookUser } =
    useLikes(products);

  // toggleLike provided by hook

  

  return (
    <>
      <section id="produkti" className="p-8">
        <h2 className="text-3xl font-bold mb-6">Mūsu Produkti - Pieejami</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {availableProducts.map((p) => (
            <div
              key={p.id}
              className="border p-4 rounded"
              style={{ backgroundColor: 'var(--panel)', color: 'var(--text)', borderColor: 'var(--btn-ghost-border)' }}
            >
              <div className="mb-2 w-full aspect-square rounded overflow-hidden">
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
              <h3 className="text-xl font-semibold">{p.name}</h3>
              <p>{p.description}</p>
              <p className="font-bold mt-2">{p.price} €</p>

              {hookUser && (
                <button
                  onClick={() => toggleLike(p.id)}
                  className={`btn mt-2 ${likesMap[p.id] ? "btn-danger" : "btn-primary"}`}
                >
                  {likesMap[p.id] ? "Patīk" : "Like"}
                </button>
              )}

              <p className="mt-1 text-sm">Patīk: {likesCount[p.id] || 0}</p>
            </div>
          ))}
        </div>
      </section>
      {selectedProduct && (
        <ProductModal
          product={selectedProduct.product || selectedProduct}
          startIndex={selectedProduct.index ?? 0}
          user={hookUser}
          onClose={() => {
            setSelectedProduct(null);
            try {
              // Clear hash and navigate to products anchor
              window.history.replaceState(null, "", window.location.pathname + "#produkti");
            } catch {
              /* ignore */
            }
          }}
        />
      )}
    </>
  );
}
