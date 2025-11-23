import React, { useState, useRef, useEffect } from "react";
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
  const [current, setCurrent] = useState(startIndex || 0);
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
  const [pendingConfirm, setPendingConfirm] = useState(null);

  const fileRef = useRef(null);
  const addRef = useRef(null);
  const rotatorRef = useRef(null);
  const modalRef = useRef(null);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Ensure rotator shows clicked image
  useEffect(() => {
    if (rotatorRef.current?.setCurrent) rotatorRef.current.setCurrent(startIndex || 0);
    setCurrent(startIndex || 0);
    setIsPaused(false);
  }, [startIndex]);

  if (!product) return null;

  const next = () => {
    rotatorRef.current?.next?.();
    rotatorRef.current?.pause?.();
  };
  const prev = () => {
    rotatorRef.current?.prev?.();
    rotatorRef.current?.pause?.();
  };

  const getStoragePathFromUrl = (url) => {
    try {
      const u = new URL(url);
      const m = u.pathname.match(/\/o\/(.+)$/);
      if (m && m[1]) return decodeURIComponent(m[1]);
      const o = url.match(/\/o\/([^?]+)/);
      if (o && o[1]) return decodeURIComponent(o[1]);
      return null;
    } catch {
      return null;
    }
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

  const handleReplaceImage = async (idx, file) => {
    try {
      const filename = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const path = `products/${user?.uid || "anon"}/${Date.now()}_${idx}_${filename}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);

      try {
        const prevUrl = images[idx];
        if (prevUrl) {
          const prevPath = getStoragePathFromUrl(prevUrl);
          if (prevPath) await deleteObject(storageRef(storage, prevPath));
        }
      } catch {}

      const nextImages = images.slice();
      nextImages[idx] = url;
      await updateDoc(doc(db, "products", product.id), { images: nextImages });
      setImages(nextImages);
    } catch (err) {
      console.error("Failed to replace image", err);
    }
  };

  const handleAddImages = async (files) => {
    if (!files?.length) return;
    try {
      const uploadPromises = Array.from(files).map((f, idx) => {
        const filename = f.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const path = `products/${user?.uid || "anon"}/${Date.now()}_add_${idx}_${filename}`;
        return uploadBytes(storageRef(storage, path), f).then(() => getDownloadURL(storageRef(storage, path)));
      });
      const urls = await Promise.all(uploadPromises);
      const nextImages = [...images, ...urls];
      await updateDoc(doc(db, "products", product.id), { images: nextImages });
      setImages(nextImages);
      setCurrent(images.length);
    } catch (err) {
      console.error("Failed to add images", err);
    }
  };

  const handleDeleteImage = async (idx) => {
    const nextImages = images.filter((_, i) => i !== idx);
    if (nextImages.length === 0) {
      setPendingConfirm({ type: "single", idx });
    } else {
      await performDeleteImage(idx);
    }
  };

  const performDeleteImage = async (idx) => {
    try {
      try {
        const path = getStoragePathFromUrl(images[idx]);
        if (path) await deleteObject(storageRef(storage, path));
      } catch {}
      const nextImages = images.filter((_, i) => i !== idx);
      await updateDoc(doc(db, "products", product.id), { images: nextImages });
      setImages(nextImages);
      setCurrent(Math.max(0, Math.min(current, nextImages.length - 1)));
      if (!nextImages.length) {
        onClose();
        setTimeout(async () => {
          try {
            const likesSnap = await getDocs(collection(db, "products", product.id, "likes"));
            await Promise.all(likesSnap.docs.map(d => deleteDoc(doc(db, "products", product.id, "likes", d.id))));
          } catch {}
          try {
            const commSnap = await getDocs(query(collection(db, "products", product.id, "comments")));
            await Promise.all(commSnap.docs.map(d => deleteDoc(doc(db, "products", product.id, "comments", d.id))));
          } catch {}
          try { await deleteDoc(doc(db, "products", product.id)); } catch {}
        }, 200);
      }
    } catch (err) {
      console.error("Failed to delete image", err);
    }
  };

  const handleDeleteAllImages = () => setPendingConfirm({ type: "all" });
  const performDeleteAllImages = async () => {
    try {
      await Promise.all(images.map(async (url) => {
        try { const path = getStoragePathFromUrl(url); if (path) await deleteObject(storageRef(storage, path)); } catch {}
      }));
      await updateDoc(doc(db, "products", product.id), { images: [] });
      setImages([]);
      setCurrent(0);
      onClose();
      setTimeout(async () => {
        try {
          const likesSnap = await getDocs(collection(db, "products", product.id, "likes"));
          await Promise.all(likesSnap.docs.map(d => deleteDoc(doc(db, "products", product.id, "likes", d.id))));
        } catch {}
        try {
          const commSnap = await getDocs(query(collection(db, "products", product.id, "comments")));
          await Promise.all(commSnap.docs.map(d => deleteDoc(doc(db, "products", product.id, "comments", d.id))));
        } catch {}
        try { await deleteDoc(doc(db, "products", product.id)); } catch {}
      }, 200);
    } catch (err) {
      console.error("Failed to delete all images", err);
    }
  };

  const handleFileChangeReplace = (e) => {
    const file = e.target.files?.[0];
    if (file) handleReplaceImage(current, file);
    e.target.value = null;
  };
  const handleFileChangeAdd = (e) => {
    const files = e.target.files;
    handleAddImages(files);
    e.target.value = null;
  };

  const confirmCancel = () => setPendingConfirm(null);
  const confirmProceed = async () => {
    if (!pendingConfirm) return;
    const p = pendingConfirm;
    setPendingConfirm(null);
    if (p.type === "single") await performDeleteImage(p.idx);
    else if (p.type === "all") await performDeleteAllImages();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-auto">
      <div
        ref={modalRef}
        className="w-full max-w-4xl max-h-[90vh] rounded overflow-auto flex flex-col"
        style={{ backgroundColor: 'var(--panel)', color: 'var(--text)' }}
      >
        {/* Top: Image & Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div className="flex flex-col gap-2">
            {/* Image Rotator */}
            <div
              className="w-full aspect-square rounded overflow-hidden relative flex justify-center items-center"
              style={{ backgroundColor: 'var(--panel)', maxHeight: '70vh', maxWidth: '70vh', minHeight: '200px' }}
            >
              {images?.length > 0 ? (
                <ImageRotator
                  ref={rotatorRef}
                  images={images}
                  autoRotateInterval={3000}
                  useClock
                  pause={isPaused}
                  setPause={setIsPaused}
                  pauseOnInteraction
                  className="w-full h-full"
                  imgClassName="w-full h-full object-contain cursor-pointer"
                  objectFit="contain"
                  onImageClick={() => setIsPaused(true)}
                  onIndexChange={setCurrent}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted">
                  Nav attēla
                </div>
              )}

              {images?.length > 1 && (
                <>
                  <button
                    onClick={() => { prev(); setIsPaused(true); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded bg-btn-ghost-hover-bg"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => { next(); setIsPaused(true); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded bg-btn-ghost-hover-bg"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Buttons (admin-only) */}
            {user && (user.uid === "NLL2HDQcDPVezIih8OKLJ0CCaGl2" || user.uid === "auIgf2eZJkQQffUD0bR4ZYuuArj2") && (
              <div className="flex flex-wrap gap-2 mt-2">
                <input ref={addRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChangeAdd}/>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChangeReplace}/>
                <button onClick={() => addRef.current.click()} className="flex-1 min-w-[120px] py-2 bg-green-200 text-green-800 rounded">Pievienot attēlu</button>
                {images?.length > 0 && <>
                  <button onClick={() => fileRef.current.click()} className="flex-1 min-w-[120px] py-2 bg-yellow-100 text-yellow-800 rounded">Mainīt attēlu</button>
                  <button onClick={() => handleDeleteImage(current)} className="flex-1 min-w-[120px] py-2 bg-red-100 text-red-700 rounded">Noņemt attēlu</button>
                  <button onClick={handleDeleteAllImages} className="flex-1 min-w-[120px] py-2 bg-gray-100 text-gray-800 rounded">Noņemt visus</button>
                </>}
              </div>
            )}

            {/* Thumbnails */}
            {images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto mt-2">
                {images.map((src, i) => (
                  <button key={i} onClick={() => { rotatorRef.current?.setCurrent(i); rotatorRef.current?.pause?.(); setIsPaused(true); }}
                    className={`w-20 h-20 rounded overflow-hidden border ${i === current ? "ring-2" : ""}`} style={{ borderColor: 'var(--btn-ghost-border)' }}>
                    <img src={src} alt={`thumb-${i}`} className="w-full h-full object-cover"/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info & Editing */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-lg">{product.name}</h4>
              <div className="flex items-center gap-4">
                <p className="font-semibold text-lg">{product.price} €</p>
                <button onClick={onClose} className="px-3 py-1 rounded btn btn-ghost">Aizvērt</button>
              </div>
            </div>

            {!editing ? (
              <div className="space-y-2">
                <p className="whitespace-pre-wrap text-muted">{product.description}</p>
                {product.tiktokLink && <a href={product.tiktokLink} target="_blank" rel="noreferrer" className="underline"><img src="/tiktok.png" alt="TikTok" className="tiktok-icon"/></a>}
                <div className="flex gap-2 mt-2">
                  <span className={`px-2 py-1 rounded badge ${available ? 'badge-available' : 'badge-unavailable'}`}>{available ? "Pieejams" : "Pārdots"}</span>
                  {holiday && <span className="px-2 py-1 rounded badge badge-holiday">Svētku piedāvājums</span>}
                </div>
                {user && <button onClick={() => setEditing(true)} className="px-3 py-1 rounded btn-primary mt-2">Rediģēt</button>}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm">Nosaukums</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded px-3 py-2"/>
                <label className="block text-sm">Cena (€)</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full border rounded px-3 py-2"/>
                <label className="block text-sm">Apraksts</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={6} className="w-full border rounded px-3 py-2"/>
                <label className="block text-sm">TikTok saite</label>
                <input value={tiktok} onChange={e => setTiktok(e.target.value)} className="w-full border rounded px-3 py-2"/>
                <div className="mt-4 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <label className="text-sm">Pieejams</label>
                    <button
                      type="button"
                      onClick={() => setAvailable((v) => !v)}
                      className={`switch switch--default`}
                      style={{ background: available ? 'var(--badge-available-bg)' : 'transparent' }}
                      aria-pressed={available}
                    >
                      <div className="knob" style={{ transform: available ? 'translateX(20px)' : 'translateX(0)' }} aria-hidden/>
                    </button>
                    <span className={`ml-2 px-2 py-1 rounded badge ${available ? 'badge-available' : 'badge-unavailable'}`}>{available ? "Pieejams" : "Pārdots"}</span>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <label className="text-sm">Svētku piedāvājums</label>
                    <button
                      type="button"
                      onClick={() => setHoliday((v) => !v)}
                      className={`switch switch--default`}
                      style={{ background: holiday ? 'var(--badge-holiday-bg)' : 'transparent' }}
                      aria-pressed={holiday}
                    >
                      <div className="knob" style={{ transform: holiday ? 'translateX(20px)' : 'translateX(0)' }} aria-hidden/>
                    </button>
                    <span className={`ml-2 px-2 py-1 rounded badge ${holiday ? 'badge-holiday' : 'badge-unavailable'}`}>{holiday ? "Jā" : "Nē"}</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={handleSave} disabled={saving} className="px-3 py-1 rounded btn-primary">Saglabāt</button>
                  <button onClick={() => setEditing(false)} className="px-3 py-1 rounded btn btn-ghost">Atcelt</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation */}
        {pendingConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={confirmCancel}/>
            <div
              className="relative rounded shadow-lg w-11/12 max-w-md p-4 z-70"
              style={{ backgroundColor: 'var(--panel)', color: 'var(--text)' }}
            >
              <h4 className="font-semibold text-lg mb-2">Apstiprināt</h4>
              <p className="text-sm mb-4 text-muted">
                {pendingConfirm.type === "single" ? "Pēdējā attēla noņemšana dzēsīs arī produktu. Turpināt?" : "Noņemt visus attēlus? Tas dzēsīs produktu. Turpināt?"}
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={confirmCancel} className="px-3 py-1 rounded btn btn-ghost">Atcelt</button>
                <button onClick={confirmProceed} className="px-3 py-1 rounded btn btn-danger">Dzēst</button>
              </div>
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="px-4 pb-6">
          <CommentsSection productId={product.id}/>
        </div>
      </div>
    </div>
  );
}
