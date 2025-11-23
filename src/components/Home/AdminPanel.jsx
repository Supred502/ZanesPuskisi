import React, { useState, useRef, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { db, storage } from "../../firebase/firebase";

function AdminPanelInner({ user }) {
  const [images, setImages] = useState([]); // { file, url }
  const [current, setCurrent] = useState(0);
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [available, setAvailable] = useState(true);
  const [holiday, setHoliday] = useState(false);
  const [tiktok, setTiktok] = useState("");
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // useEffect to reference error/success so ESLint doesn't flag them as unused
  useEffect(() => {
    if (error) console.error(error);
    if (success) console.log(success);
  }, [error, success]);

  const canSubmit =
    title.trim().length > 0 &&
    Number(price) > 0 &&
    images.length > 0 &&
    !submitting;

  const disabled = !canSubmit;

  // Track images in a ref so we can revoke remaining object URLs on unmount
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((i) => URL.revokeObjectURL(i.url));
    };
  }, []);

  const onFiles = (files) => {
    const arr = Array.from(files).map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
    setImages((prev) => {
      const prevLen = prev.length;
      const next = [...prev, ...arr];
      if (arr.length > 0) setCurrent(prevLen); // jump to first new
      return next;
    });
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (replaceIndex !== null) {
      const f = files[0];
      const newItem = { file: f, url: URL.createObjectURL(f) };
      setImages((prev) => {
        const next = prev.slice();
        if (next[replaceIndex]) URL.revokeObjectURL(next[replaceIndex].url);
        next[replaceIndex] = newItem;
        return next;
      });
      setCurrent(replaceIndex);
      setReplaceIndex(null);
    } else {
      onFiles(files);
    }
    e.target.value = null;
  };

  const removeImage = (idx) => {
    setImages((prev) => {
      const toRemove = prev[idx];
      const next = prev.filter((_, i) => i !== idx);
      if (toRemove) URL.revokeObjectURL(toRemove.url);
      setCurrent((c) => Math.max(0, Math.min(c, next.length - 1)));
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const uploadPromises = images.map((im, idx) => {
        const filename = im.file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const path = `products/${
          user?.uid || "anon"
        }/${Date.now()}_${idx}_${filename}`;
        const ref = storageRef(storage, path);
        return uploadBytes(ref, im.file).then(() => getDownloadURL(ref));
      });

      const urls = await Promise.all(uploadPromises);

      const docRef = await addDoc(collection(db, "products"), {
        name: title,
        description,
        price: Number(price),
        available,
        holidaySpecial: holiday,
        tiktokLink: tiktok || null,
        images: urls,
        createdAt: serverTimestamp(),
      });

      setSuccess(`Produkts pievienots (${docRef.id})`);

      // reset form
      setTitle("");
      setDescription("");
      setPrice(0);
      setAvailable(true);
      setHoliday(false);
      setTiktok("");
      images.forEach((i) => URL.revokeObjectURL(i.url));
      setImages([]);
      imagesRef.current = [];
      if (fileInputRef.current) fileInputRef.current.value = null;
      setCurrent(0);
      // clear success after a moment so user sees it but form is usable
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to save product", err);
      setError(err?.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="p-8" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <h2 className="text-2xl font-bold mb-6">Admin Panelis — Zanes Pušķīši</h2>

      <div className="rounded-lg shadow-sm p-6" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--btn-ghost-border)' }}>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {success && <div className="text-green-600 mb-4">{success}</div>}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Left: Preview */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <div className="rounded-lg p-4 shadow-inner" style={{ backgroundColor: 'var(--panel)' }}>
              <div className="w-full aspect-square">
                {images.length === 0 ? (
                  <div className="w-full h-full rounded-md" style={{ backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                    Produkta priekšskatījums
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    <img
                      src={images[current].url}
                      alt="preview"
                      className="w-full h-full object-cover rounded-md"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrent(
                              (c) => (c - 1 + images.length) % images.length
                            )
                          }
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrent((c) => (c + 1) % images.length)
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2"
                        >
                          ›
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-stretch gap-2 mt-2">
              <input
                ref={fileInputRef}
                onChange={handleFileInput}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
              />

              {/* Add Image */}
              <button
                type="button"
                onClick={() => {
                  setReplaceIndex(null);
                  fileInputRef.current.click();
                }}
                className="grow shrink basis-[calc(25%-0.5rem)] min-w-[120px] px-2 py-2 rounded bg-green-200 text-green-800 text-center text-sm wrap-break-word h-16 md:h-[61px]"
              >
                Pievienot attēlu
              </button>

              {images.length > 0 && (
                <>
                  {/* Replace Image */}
                  <button
                    type="button"
                    onClick={() => {
                      setReplaceIndex(current);
                      fileInputRef.current.click();
                    }}
                    className="grow shrink basis-[calc(25%-0.5rem)] min-w-[120px] px-2 py-2 rounded bg-yellow-100 text-yellow-800 text-center text-sm wrap-break-word h-16 md:h-[61px]"
                  >
                    Mainīt attēlu
                  </button>

                  {/* Remove Current Image */}
                  <button
                    type="button"
                    onClick={() => removeImage(current)}
                    className="grow shrink basis-[calc(25%-0.5rem)] min-w-[120px] px-2 py-2 rounded bg-red-100 text-red-700 text-center text-sm wrap-break-word h-16 md:h-[61px]"
                  >
                    Noņemt attēlu
                  </button>

                  {/* Remove All */}
                  <button
                    type="button"
                    onClick={() => setImages([])}
                    className="grow shrink basis-[calc(25%-0.5rem)] min-w-[120px] px-2 py-2 rounded bg-gray-100 text-gray-800 text-center text-sm wrap-break-word h-16 md:h-[61px]"
                  >
                    Noņemt visus
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto mt-2">
                {images.map((im, i) => (
                  <div
                    key={i}
                    className={`w-20 h-20 rounded overflow-hidden border ${
                      i === current ? "ring-2 ring-green-300" : ""
                    }`}
                  >
                    <img
                      src={im.url}
                      onClick={() => setCurrent(i)}
                      className="w-full h-full object-cover cursor-pointer"
                      alt={`thumb-${i}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="text-xs w-full bg-white/70"
                    >
                      Noņemt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Form */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nosaukums
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cena (€)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apraksts
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="mt-4 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <label className="text-sm">Pieejams</label>
                <button
                  type="button"
                  onClick={() => setAvailable((v) => !v)}
                  className={`switch switch--default`}
                  style={{
                    background: available ? 'var(--badge-available-bg)' : 'transparent'
                  }}
                  aria-pressed={available}
                >
                  <div
                    className="knob"
                    style={{ transform: available ? 'translateX(20px)' : 'translateX(0)' }}
                    aria-hidden
                  />
                </button>
                <span className={`ml-2 px-2 py-1 rounded badge ${available ? 'badge-available' : 'badge-unavailable'}`}>
                  {available ? "Pieejams" : "Pārdots"}
                </span>
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
                  <div
                    className="knob"
                    style={{ transform: holiday ? 'translateX(20px)' : 'translateX(0)' }}
                    aria-hidden
                  />
                </button>
                <span className={`ml-2 px-2 py-1 rounded badge ${holiday ? 'badge-holiday' : 'badge-unavailable'}`}>
                  {holiday ? "Jā" : "Nē"}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TikTok saite (pēc izvēles)
              </label>
              <input
                type="url"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="https://"
              />
            </div>
          </div>

          {/* Bottom full-width submit */}
          <div className="md:col-span-3">
              <div className="mt-6">
              <button
                type="submit"
                disabled={disabled}
                aria-disabled={disabled}
                className={`w-full py-3 rounded text-lg ${!disabled ? 'btn-primary' : 'bg-gray-200 text-gray-600 cursor-not-allowed'}`}
              >
                Pievienot produktu
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

export default function AdminPanel({ user }) {
  if (!user) return null;
  return <AdminPanelInner user={user} />;
}
