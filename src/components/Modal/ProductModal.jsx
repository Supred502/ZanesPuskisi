import React, { useState, useRef } from "react";
import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
} from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "../../firebase/firebase.js";
import CommentsSection from "./CommentsSection.jsx";
import ImageRotator from "../ImageRotator.jsx";

export default function ProductModal({ product, user, onClose, startIndex = 0 }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price || 0);
  const [available, setAvailable] = useState(product?.available ?? true);
  const [holiday, setHoliday] = useState(product?.holidaySpecial ?? false);
  const [tiktok, setTiktok] = useState(product?.tiktokLink || "");
  const [images, setImages] = useState(product?.images || []);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const addRef = useRef(null);
  const [pendingConfirm, setPendingConfirm] = useState(null);

  // pendingConfirm: null or { type: 'single'|'all', idx?: number }
  const rotatorRef = useRef(null);

  // When modal opens, ensure the rotator shows the image that was clicked
  // in the grid. We set the rotator's current index imperatively on mount.
  React.useEffect(() => {
    if (rotatorRef.current && typeof rotatorRef.current.setCurrent === "function") {
      rotatorRef.current.setCurrent(startIndex || 0);
    }
    // ensure modal-local pause is reset on open (user interactions pause only modal)
    setIsPaused(false);
    setCurrent(startIndex || 0);
  }, [startIndex]);

  if (!product) return null;

  const next = () => {
    if (rotatorRef.current && rotatorRef.current.next) rotatorRef.current.next();
    if (rotatorRef.current && rotatorRef.current.pause) rotatorRef.current.pause();
  };
  const prev = () => {
    if (rotatorRef.current && rotatorRef.current.prev) rotatorRef.current.prev();
    if (rotatorRef.current && rotatorRef.current.pause) rotatorRef.current.pause();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const pRef = doc(db, "products", product.id);
      await updateDoc(pRef, {
        name,
        description,
        price: Number(price),
        available,
        holidaySpecial: holiday,
        tiktokLink: tiktok || null,
      });
      setSaving(false);
      setEditing(false);
    } catch (err) {
      console.error("Failed to save product", err);
      setSaving(false);
    }
  };

  const handleDeleteImage = async (idx) => {
    const nextImages = images.filter((_, i) => i !== idx);
    // If removing this image will leave zero images, show styled confirmation
    if (nextImages.length === 0) {
      setPendingConfirm({ type: "single", idx });
      return;
    }
    // otherwise perform immediately
    await performDeleteImage(idx);
  };

  const performDeleteImage = async (idx) => {
    try {
      // attempt to delete the storage object for the removed image (best-effort)
      try {
        const removed = images[idx];
        const path = getStoragePathFromUrl(removed);
        if (path) await deleteObject(storageRef(storage, path));
      } catch {
        // ignore
      }
      const nextImages = images.filter((_, i) => i !== idx);
      const pRef = doc(db, "products", product.id);
      await updateDoc(pRef, { images: nextImages });
      setImages(nextImages);
      setCurrent((c) => Math.max(0, Math.min(c, nextImages.length - 1)));

      // If we've removed the last image, remove the product as well (background)
      if (nextImages.length === 0) {
        try {
          // close modal first to avoid watch races
          try {
            onClose();
          } catch {
            /* ignore */
          }
        } finally {
          // run deletion in background
          setTimeout(async () => {
            try {
              // delete likes
              try {
                const likesSnap = await getDocs(
                  collection(db, "products", product.id, "likes")
                );
                await Promise.all(
                  likesSnap.docs.map((d) =>
                    deleteDoc(doc(db, "products", product.id, "likes", d.id))
                  )
                );
              } catch {
                /* ignore */
              }
              // delete comments
              try {
                const q = query(
                  collection(db, "products", product.id, "comments")
                );
                const commSnap = await getDocs(q);
                await Promise.all(
                  commSnap.docs.map((d) =>
                    deleteDoc(doc(db, "products", product.id, "comments", d.id))
                  )
                );
              } catch {
                /* ignore */
              }
              // delete product
              try {
                await deleteDoc(doc(db, "products", product.id));
              } catch {
                /* ignore */
              }
            } catch (err) {
               
              console.error("Background product delete failed", err);
            }
          }, 200);
        }
      }
    } catch (err) {
      console.error("Failed to delete image", err);
    }
  };

  const handleReplaceImage = async (idx, file) => {
    try {
      const filename = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const path = `products/${
        user?.uid || "anon"
      }/${Date.now()}_${idx}_${filename}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);
      // try to delete previous image file (best-effort)
      try {
        const prevUrl = images[idx];
        if (prevUrl) {
          const prevPath = getStoragePathFromUrl(prevUrl);
          if (prevPath) {
            await deleteObject(storageRef(storage, prevPath));
          }
        }
      } catch {
        // ignore
      }
      const nextImages = images.slice();
      nextImages[idx] = url;
      const pRef = doc(db, "products", product.id);
      await updateDoc(pRef, { images: nextImages });
      setImages(nextImages);
    } catch (err) {
       
      console.error("Failed to replace image", err);
    }
  };

  const handleAddImages = async (files) => {
    if (!files || files.length === 0) return;
    try {
      const uploadPromises = Array.from(files).map((f, idx) => {
        const filename = f.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const path = `products/${
          user?.uid || "anon"
        }/${Date.now()}_add_${idx}_${filename}`;
        const ref = storageRef(storage, path);
        return uploadBytes(ref, f).then(() => getDownloadURL(ref));
      });
      const urls = await Promise.all(uploadPromises);
      const nextImages = [...images, ...urls];
      const pRef = doc(db, "products", product.id);
      await updateDoc(pRef, { images: nextImages });
      setImages(nextImages);
      setCurrent(images.length); // jump to first new
    } catch (err) {
       
      console.error("Failed to add images", err);
    }
  };

  const handleFileChangeReplace = (e) => {
    const file = e.target.files?.[0];
    if (file == null) return;
    handleReplaceImage(current, file);
    e.target.value = null;
  };

  const handleFileChangeAdd = (e) => {
    const files = e.target.files;
    handleAddImages(files);
    e.target.value = null;
  };

  const handleDeleteAllImages = async () => {
    // show styled confirmation before removing all images
    setPendingConfirm({ type: "all" });
  };

  const performDeleteAllImages = async () => {
    try {
      // attempt to delete storage files for each image
      if (images && images.length) {
        await Promise.all(
          images.map(async (url) => {
            try {
              const path = getStoragePathFromUrl(url);
              if (path) await deleteObject(storageRef(storage, path));
            } catch {
              // ignore
            }
          })
        );
      }
      const pRef = doc(db, "products", product.id);
      await updateDoc(pRef, { images: [] });
      setImages([]);
      setCurrent(0);

      // After removing all images, close modal and remove product in background
      try {
        onClose();
      } catch {
        /* ignore */
      }
      setTimeout(async () => {
        try {
          // delete likes
          try {
            const likesSnap = await getDocs(
              collection(db, "products", product.id, "likes")
            );
            await Promise.all(
              likesSnap.docs.map((d) =>
                deleteDoc(doc(db, "products", product.id, "likes", d.id))
              )
            );
          } catch {
            /* ignore */
          }
          // delete comments
          try {
            const q = query(collection(db, "products", product.id, "comments"));
            const commSnap = await getDocs(q);
            await Promise.all(
              commSnap.docs.map((d) =>
                deleteDoc(doc(db, "products", product.id, "comments", d.id))
              )
            );
          } catch {
            /* ignore */
          }
          // delete product
          try {
            await deleteDoc(doc(db, "products", product.id));
          } catch {
            /* ignore */
          }
        } catch (err) {
           
          console.error("Background product delete failed", err);
        }
      }, 200);
    } catch (err) {
       
      console.error("Failed to delete all images", err);
    }
  };

  // Helper: derive storage path from a Firebase download URL
  const getStoragePathFromUrl = (url) => {
    try {
      const u = new URL(url);
      // path like /v0/b/<bucket>/o/<encodedPath>
      const m = u.pathname.match(/\/o\/(.+)$/);
      if (m && m[1]) return decodeURIComponent(m[1]);
      // fallback: try /o/<path> in full url
      const o = url.match(/\/o\/([^?]+)/);
      if (o && o[1]) return decodeURIComponent(o[1]);
      return null;
    } catch {
      return null;
    }
  };

  // Confirmation dialog actions
  const confirmCancel = () => setPendingConfirm(null);
  const confirmProceed = async () => {
    if (!pendingConfirm) return;
    const p = pendingConfirm;
    setPendingConfirm(null);
    if (p.type === "single") {
      await performDeleteImage(p.idx);
    } else if (p.type === "all") {
      await performDeleteAllImages();
    }
  };

  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-11/12 max-w-4xl max-h-[90vh] overflow-auto rounded" style={{ backgroundColor: 'var(--panel)', color: 'var(--text)' }}>

        <div className="px-4 pt-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="w-full mb-2">
              {images && images.length > 0 ? (
                <div className="w-full aspect-square rounded overflow-hidden relative" style={{ background: 'var(--panel)' }}>
                  <ImageRotator
                    ref={rotatorRef}
                    images={images}
                    autoRotateInterval={3000}
                    useClock={true}
                    pause={isPaused}
                    setPause={setIsPaused}
                    pauseOnInteraction={true}
                    className="w-full h-full"
                    imgClassName="object-contain cursor-pointer"
                    onImageClick={() => setIsPaused(true)}
                    onIndexChange={(i) => setCurrent(i)}
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => { prev(); setIsPaused(true); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded"
                        style={{ background: 'var(--btn-ghost-hover-bg)' }}
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => { next(); setIsPaused(true); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded"
                        style={{ background: 'var(--btn-ghost-hover-bg)' }}
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full aspect-square rounded flex items-center justify-center" style={{ background: 'var(--panel)', color: 'var(--muted)' }}>
                  Nav attēla
                </div>
              )}
            </div>

            <div className="flex gap-2 items-center">
              <input
                onChange={handleFileChangeAdd}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                id="add-files"
                ref={addRef}
              />
              <button
                type="button"
                onClick={() => addRef.current?.click()}
                className="px-4 py-2 rounded bg-green-200 text-green-800"
              >
                Pievienot attēlu
              </button>

              <input
                ref={fileRef}
                onChange={handleFileChangeReplace}
                type="file"
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 rounded bg-yellow-100 text-yellow-800"
              >
                Mainīt attēlu
              </button>

              <button
                onClick={() => handleDeleteImage(current)}
                className="px-4 py-2 rounded bg-red-100 text-red-700"
              >
                Noņemt attēlu
              </button>
              <button
                onClick={handleDeleteAllImages}
                className="px-4 py-2 rounded bg-gray-100 text-gray-800"
              >
                Noņemt visus
              </button>
            </div>

            {images && images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto mt-2">
                {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (rotatorRef.current && rotatorRef.current.setCurrent) rotatorRef.current.setCurrent(i);
                        if (rotatorRef.current && rotatorRef.current.pause) rotatorRef.current.pause();
                        setIsPaused(true);
                      }}
                      className={`w-20 h-20 rounded overflow-hidden border ${
                      i === current ? "ring-2" : ""
                    }`}
                      style={{ borderColor: 'var(--btn-ghost-border)', boxShadow: i === current ? `0 0 0 3px rgba(100,108,255,0.12)` : 'none' }}
                    >
                    <img
                      src={src}
                      alt={`thumb-${i}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{product.name}</h4>
              <div className="flex items-center gap-4">
                <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{product.price} €</p>
                <button onClick={onClose} className="px-3 py-1 rounded btn btn-ghost">
                  Aizvērt
                </button>
              </div>
            </div>
            {!editing ? (
              <div>
                <p className="mt-2 whitespace-pre-wrap" style={{ color: 'var(--muted)' }}>{product.description}</p>
                {product.tiktokLink && (
                  <p className="mt-2">
                    <a
                      href={product.tiktokLink}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                      style={{ color: 'var(--primary)' }}
                      aria-label="Atvērt TikTok"
                    >
                      <img src="/tiktok.png" alt="TikTok" className="tiktok-icon" />
                    </a>
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <span className={`px-2 py-1 rounded badge ${available ? 'badge-available' : 'badge-unavailable'}`}>
                    {available ? "Pieejams" : "Pārdots"}
                  </span>
                  {holiday && (
                    <span className="px-2 py-1 rounded badge badge-holiday">Svētku piedāvājums</span>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  {user && (
                    <button
                      onClick={() => setEditing(true)}
                      className="px-3 py-1 rounded btn-primary"
                    >
                      Rediģēt
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm">Nosaukums</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
                <label className="block text-sm">Cena (€)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
                <label className="block text-sm">Apraksts</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full border rounded px-3 py-2"
                />
                <label className="block text-sm">TikTok saite</label>
                <input
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Pieejams</label>
                    <button
                      type="button"
                      onClick={() => setAvailable((v) => !v)}
                      className={`switch switch--default`}
                      style={{ background: available ? 'var(--badge-available-bg)' : 'transparent' }}
                      aria-pressed={available}
                    >
                      <div className="knob" style={{ transform: available ? 'translateX(20px)' : 'translateX(0)' }} aria-hidden />
                    </button>
                    <span className={`ml-2 px-2 py-1 rounded badge ${available ? 'badge-holiday' : 'badge-unavailable'}`}>
                      {available ? "Jā" : "Nē"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm">Svētku piedāvājums</label>
                    <button
                      type="button"
                      onClick={() => setHoliday((v) => !v)}
                      className={`switch switch--default`}
                      style={{ background: holiday ? 'var(--badge-holiday-bg)' : 'transparent' }}
                      aria-pressed={holiday}
                    >
                      <div className="knob" style={{ transform: holiday ? 'translateX(20px)' : 'translateX(0)' }} aria-hidden />
                    </button>
                    <span className={`ml-2 px-2 py-1 rounded badge ${holiday ? 'badge-holiday' : 'badge-unavailable'}`}>
                      {holiday ? "Jā" : "Nē"}
                    </span>
                  </div>
                </div>
                    <div className="flex gap-2 items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-3 py-1 rounded btn-primary"
                    >
                      Saglabāt
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-3 py-1 rounded btn btn-ghost"
                    >
                      Atcelt
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-6">
          {pendingConfirm && (
            <div className="fixed inset-0 z-60 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={confirmCancel}
              />
              <div className="relative rounded shadow-lg w-11/12 max-w-md p-4 z-70" style={{ backgroundColor: 'var(--panel)', color: 'var(--text)' }}>
                <h4 className="font-semibold text-lg mb-2">Apstiprināt</h4>
                <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                  {pendingConfirm.type === "single"
                    ? "Pēdējā attēla noņemšana dzēsīs arī produktu. Turpināt?"
                    : "Noņemt visus attēlus? Tas dzēsīs produktu. Turpināt?"}
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={confirmCancel}
                    className="px-3 py-1 rounded btn btn-ghost"
                  >
                    Atcelt
                  </button>
                  <button
                    onClick={confirmProceed}
                    className="px-3 py-1 rounded btn btn-danger"
                  >
                    Dzēst
                  </button>
                </div>
              </div>
            </div>
          )}
          <CommentsSection productId={product.id} />
        </div>
      </div>
    </div>
  );
}
