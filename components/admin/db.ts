"use client";

import { getAuth } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getFirestore, serverTimestamp, updateDoc } from "firebase/firestore";
import { deleteObject, getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app, firebaseConfig } from "@/lib/firebase";
import { shrinkImage } from "@/lib/resize";
import { refreshCatalog } from "@/app/admin/actions";

export const db = getFirestore(app);
const storage = getStorage(app);

export type ProductInput = {
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  holidaySpecial: boolean;
  holidayPrice: number | null;
  tiktokLink: string | null;
  images: string[];
};

/** Tell the public site to drop its cached catalogue, so customers see the change on their next page load.
 *  Never throws: the save already succeeded, and an error here would make the admin save again (= duplicate). */
async function refresh() {
  try {
    const token = await getAuth(app).currentUser?.getIdToken();
    if (token) await refreshCatalog(token);
  } catch (e) {
    console.error("Catalogue refresh failed; the public site updates within a day anyway", e);
  }
}

export async function uploadImage(file: File, uid: string, n: number): Promise<string> {
  const blob = await shrinkImage(file);
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const r = ref(storage, `products/${uid}/${Date.now()}_${n}.${ext}`);
  await uploadBytes(r, blob, { contentType: blob.type, cacheControl: "public, max-age=31536000, immutable" });
  return getDownloadURL(r);
}

/** Best effort: a leftover file only costs a little storage, so failures are ignored. */
async function deleteImages(urls: string[]) {
  const ours = urls.filter((u) => u.includes(`/b/${firebaseConfig.storageBucket}/`));
  await Promise.allSettled(ours.map((u) => deleteObject(ref(storage, u))));
}

export async function saveProduct(id: string | null, data: ProductInput, removedImages: string[]): Promise<string> {
  let savedId = id;
  if (id) await updateDoc(doc(db, "products", id), data);
  else savedId = (await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() })).id;
  await deleteImages(removedImages); // only after the product no longer points at them
  await refresh();
  return savedId!;
}

export async function setAvailable(id: string, available: boolean) {
  await updateDoc(doc(db, "products", id), { available });
  await refresh();
}

export async function removeProduct(id: string, images: string[]) {
  await deleteDoc(doc(db, "products", id));
  await deleteImages(images);
  await refresh();
}
