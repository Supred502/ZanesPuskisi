"use server";

import { updateTag } from "next/cache";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { ADMIN_UIDS, firebaseConfig } from "@/lib/firebase";

// Verifying a login token only needs the project id (Google's public keys), no service account.
const admin = getApps()[0] ?? initializeApp({ projectId: firebaseConfig.projectId });

/** Called by the admin after saving to Firestore: drops the public pages' cached catalogue. */
export async function refreshCatalog(idToken: string) {
  const { uid } = await getAuth(admin).verifyIdToken(idToken);
  if (!ADMIN_UIDS.includes(uid)) throw new Error("Not an admin");
  updateTag("products");
}
