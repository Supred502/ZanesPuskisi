import React, { useState, useRef, useEffect } from "react";
import {
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebase.js";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "../../firebase/firebase.js";
import ImageRotator from "../ImageRotator.jsx";
import useWishlist from "../../hooks/useWishlist.js";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase/firebase.js";
import normalizeFirebaseStorageUrl from "../../utils/normalizeFirebaseStorageUrl";
import { openWhatsApp } from "../../utils/whatsapp";

function buildShareLink(productId) {
  try {
    return `${window.location.origin}/s/${productId}`;
  } catch {
    return `/s/${productId}`;
  }
}

export default function ProductModal({ product, user, onClose, startIndex = 0, onProductUpdated }) {
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

  const wishlist = useWishlist(user);

  const [requestName, setRequestName] = useState("");
  const [requestMsg, setRequestMsg] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);

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
    // Modal typically mounts per product selection; keep this effect limited to
    // syncing the rotator ref (avoid setState-in-effect lint).
    if (rotatorRef.current?.setCurrent) rotatorRef.current.setCurrent(startIndex || 0);
  }, [startIndex]);

  // Keep local editable state in sync when switching products.
  useEffect(() => {
    setEditing(false);
    setName(product?.name || "");
    setDescription(product?.description || "");
    setPrice(product?.price || 0);
    setAvailable(product?.available ?? true);
    setHoliday(product?.holidaySpecial ?? false);
    setTiktok(product?.tiktokLink || "");
    setImages(product?.images || []);
    setCurrent(startIndex || 0);
  }, [
    product?.id,
    product?.name,
    product?.description,
    product?.price,
    product?.available,
    product?.holidaySpecial,
    product?.tiktokLink,
    product?.images,
    startIndex,
  ]);

  if (!product) return null;

  const isAdmin =
    !!user &&
    (user.uid === "NLL2HDQcDPVezIih8OKLJ0CCaGl2" || user.uid === "auIgf2eZJkQQffUD0bR4ZYuuArj2");

  const buildInquiryText = () => {
    const share = buildShareLink(product.id);
    const header = requestName ? `Sveiki! Mani sauc ${requestName}.` : "Sveiki!";
    const details = `Produkts: ${product.name || product.id}\nCena: ${product.price ?? "?"} €\nSaite: ${share}`;
    const msg = requestMsg ? `\n\nZiņa:\n${requestMsg}` : "";
    return `${header}\n\n${details}${msg}`;
  };

  const submitInquiryToSite = async () => {
    if (requestSubmitting) return;
    setRequestSubmitting(true);
    setRequestStatus(null);
    try {
      const share = buildShareLink(product.id);
      await addDoc(collection(db, "products", product.id, "inquiries"), {
        name: requestName?.trim() || "",
        message: requestMsg?.trim() || "",
        createdAt: serverTimestamp(),
        shareLink: share,
      });
      setRequestStatus({ type: "success", message: "Pieprasījums nosūtīts. Mēs ar jums sazināsimies." });
      setRequestName("");
      setRequestMsg("");
      setTimeout(() => setRequestStatus(null), 4000);
    } catch (err) {
      console.error("Failed to submit inquiry", err);
      setRequestStatus({ type: "error", message: "Neizdevās nosūtīt pieprasījumu. Pamēģiniet vēlreiz." });
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

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
      const nextPrice = Number(price);
      await updateDoc(pRef, {
        name,
        description,
        price: nextPrice,
        available,
        holidaySpecial: holiday,
        tiktokLink: tiktok || null,
      });

      if (typeof onProductUpdated === "function") {
        onProductUpdated({
          id: product.id,
          name,
          description,
          price: nextPrice,
          available,
          holidaySpecial: holiday,
          tiktokLink: tiktok || null,
          images,
        });
      }

      setSaving(false);
      setEditing(false);
    } catch (err) {
      console.error("Failed to save product", err);
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setName(product?.name || "");
    setDescription(product?.description || "");
    setPrice(product?.price || 0);
    setAvailable(product?.available ?? true);
    setHoliday(product?.holidaySpecial ?? false);
    setTiktok(product?.tiktokLink || "");
    setEditing(false);
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
      } catch (err) {
        if (import.meta?.env?.DEV) console.warn("Failed to delete previous image:", err);
      }

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
      } catch (err) {
        if (import.meta?.env?.DEV) console.warn("Failed to delete image from storage:", err);
      }
      const nextImages = images.filter((_, i) => i !== idx);
      await updateDoc(doc(db, "products", product.id), { images: nextImages });
      setImages(nextImages);
      setCurrent(Math.max(0, Math.min(current, nextImages.length - 1)));
      if (!nextImages.length) {
        onClose();
        setTimeout(async () => {
          try {
            await deleteDoc(doc(db, "products", product.id));
          } catch (err) {
            if (import.meta?.env?.DEV) console.warn("Failed to delete product during cleanup:", err);
          }
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
        try {
          const path = getStoragePathFromUrl(url);
          if (path) await deleteObject(storageRef(storage, path));
        } catch (err) {
          if (import.meta?.env?.DEV) console.warn("Failed to delete image from storage:", err);
        }
      }));
      await updateDoc(doc(db, "products", product.id), { images: [] });
      setImages([]);
      setCurrent(0);
      onClose();
      setTimeout(async () => {
        try {
          await deleteDoc(doc(db, "products", product.id));
        } catch (err) {
          if (import.meta?.env?.DEV) console.warn("Failed to delete product during cleanup:", err);
        }
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
        className="w-full max-w-4xl max-h-[90vh] rounded-lg overflow-auto flex flex-col"
        style={{ backgroundColor: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--btn-ghost-border)' }}
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

              {holiday && (
                <div
                  className="absolute top-3 right-3 p-1 rounded-lg pointer-events-none select-none"
                  style={{ backgroundColor: "var(--panel)", border: "1px solid var(--btn-ghost-border)" }}
                  aria-hidden="true"
                >
                  <img
                    src="/holiday.png"
                    alt=""
                    className="w-9 h-9"
                    loading="lazy"
                    decoding="async"
                  />
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
            {isAdmin && (
              <div className="flex flex-wrap gap-2 mt-2">
                <input ref={addRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChangeAdd}/>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChangeReplace}/>
                <button onClick={() => addRef.current.click()} className="btn btn-success flex-1 min-w-[120px]">Pievienot attēlu</button>
                {images?.length > 0 && <>
                  <button onClick={() => fileRef.current.click()} className="btn btn-warning flex-1 min-w-[120px]">Mainīt attēlu</button>
                  <button onClick={() => handleDeleteImage(current)} className="btn btn-danger flex-1 min-w-[120px]">Noņemt attēlu</button>
                  <button onClick={handleDeleteAllImages} className="btn btn-neutral flex-1 min-w-[120px]">Noņemt visus</button>
                </>}
              </div>
            )}

            {/* Thumbnails */}
            {images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto mt-2">
                {images.map((src, i) => (
                  <button key={i} onClick={() => { rotatorRef.current?.setCurrent(i); rotatorRef.current?.pause?.(); setIsPaused(true); }}
                    className={`w-20 h-20 rounded overflow-hidden border ${i === current ? "border-2" : ""}`}
                    style={{ borderColor: i === current ? 'var(--btn-primary-bg)' : 'var(--btn-ghost-border)' }}>
                    <img src={normalizeFirebaseStorageUrl(src)} alt={`thumb-${i}`} className="w-full h-full object-cover" loading="lazy" decoding="async"/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info & Editing */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <p className="font-semibold text-lg">{price} €</p>
                <h4 className="font-semibold text-lg truncate" style={{ minWidth: 0 }}>{name}</h4>
              </div>
              <button onClick={onClose} className="px-3 py-1 rounded btn btn-ghost">Aizvērt</button>
            </div>

            <div className="btn-group">
              <button
                type="button"
                className={`btn ${wishlist.isSaved(product.id) ? "btn-danger" : "btn-primary"}`}
                onClick={async () => {
                  await wishlist.toggle({
                    ...product,
                    images: images?.length ? images : product.images || (product.imageURL ? [product.imageURL] : []),
                  });
                }}
              >
                {wishlist.isSaved(product.id) ? "Saglabāts" : "Saglabāt"}
              </button>

              {!editing && isAdmin && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="btn btn-primary"
                >
                  Rediģēt
                </button>
              )}
            </div>

            {!user && wishlist.isSaved(product.id) && (
              <div className="text-sm" style={{ color: "var(--muted)" }}>
                Saglabāts tikai šajā ierīcē. <button type="button" className="btn-link" onClick={handleSignIn}>Pieslēdzies</button>, lai sinhronizētu starp ierīcēm.
              </div>
            )}

            {!editing ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-1 rounded badge ${available ? 'badge-available' : 'badge-unavailable'}`}>{available ? "Pieejams" : "Pārdots"}</span>
                </div>
                <p className="whitespace-pre-wrap text-muted">{description}</p>
                {tiktok && <a href={tiktok} target="_blank" rel="noreferrer" className="underline"><img src="/tiktok.png" alt="TikTok" className="tiktok-icon"/></a>}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm">Nosaukums</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  style={{ borderColor: 'var(--btn-ghost-border)', backgroundColor: 'transparent', color: 'var(--text)' }}
                />
                <label className="block text-sm">Cena (€)</label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  style={{ borderColor: 'var(--btn-ghost-border)', backgroundColor: 'transparent', color: 'var(--text)' }}
                />
                <label className="block text-sm">Apraksts</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={6}
                  className="w-full border rounded px-3 py-2"
                  style={{ borderColor: 'var(--btn-ghost-border)', backgroundColor: 'transparent', color: 'var(--text)' }}
                />
                <label className="block text-sm">TikTok saite</label>
                <input
                  value={tiktok}
                  onChange={e => setTiktok(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  style={{ borderColor: 'var(--btn-ghost-border)', backgroundColor: 'transparent', color: 'var(--text)' }}
                />
                <div className="mt-4 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <label className="text-sm">Pieejams</label>
                    <button
                      type="button"
                      onClick={() => setAvailable((v) => !v)}
                      className={`switch switch--small`}
                      style={{ background: available ? 'var(--badge-available-bg)' : 'transparent' }}
                      aria-pressed={available}
                    >
                      <div className="knob" aria-hidden/>
                    </button>
                    <span className={`ml-2 px-2 py-1 rounded badge ${available ? 'badge-available' : 'badge-unavailable'}`}>{available ? "Pieejams" : "Pārdots"}</span>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <label className="text-sm">Svētku piedāvājums</label>
                    <button
                      type="button"
                      onClick={() => setHoliday((v) => !v)}
                      className={`switch switch--small`}
                      style={{ background: holiday ? 'var(--badge-holiday-bg)' : 'transparent' }}
                      aria-pressed={holiday}
                    >
                      <div className="knob" aria-hidden/>
                    </button>
                    <span className={`ml-2 px-2 py-1 rounded badge ${holiday ? 'badge-holiday' : 'badge-unavailable'}`}>{holiday ? "Jā" : "Nē"}</span>
                  </div>
                </div>
                <div className="btn-group">
                  <button onClick={handleSave} disabled={saving} className="btn btn-primary">Saglabāt</button>
                  <button onClick={handleCancelEdit} className="btn btn-ghost">Atcelt</button>
                </div>
              </div>
            )}

            {/* WhatsApp request form */}
            {!editing && (
              <div className="mt-2 border rounded p-3" style={{ borderColor: 'var(--btn-ghost-border)', backgroundColor: 'var(--panel)' }}>
                <div className="font-semibold">Pieprasīt pasūtījumu / līdzīgu</div>
                <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  Ziņa tiks atvērta WhatsApp ar šī produkta informāciju.
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2">
                  <input
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                    placeholder="Jūsu vārds (nav obligāti)"
                    className="w-full border rounded px-3 py-2"
                    style={{ borderColor: 'var(--btn-ghost-border)', backgroundColor: 'transparent', color: 'var(--text)' }}
                  />
                  <textarea
                    value={requestMsg}
                    onChange={(e) => setRequestMsg(e.target.value)}
                    placeholder="Ko vēlaties? (piem., pirkt, krāsas, datums, piegāde, utt.)"
                    rows={4}
                    className="w-full border rounded px-3 py-2"
                    style={{ borderColor: 'var(--btn-ghost-border)', backgroundColor: 'transparent', color: 'var(--text)' }}
                  />

                  {requestStatus?.message && (
                    <div
                      className="text-sm"
                      style={{ color: requestStatus.type === "error" ? "#ef4444" : "var(--muted)" }}
                    >
                      {requestStatus.message}
                    </div>
                  )}

                  <div className="btn-group">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => openWhatsApp(buildInquiryText())}
                    >
                      Sūtīt WhatsApp
                    </button>

                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={requestSubmitting}
                      onClick={submitInquiryToSite}
                    >
                      Sūtīt pieprasījumu
                    </button>
                  </div>
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

      </div>
    </div>
  );
}
