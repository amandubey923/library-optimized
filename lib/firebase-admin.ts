import { App, initializeApp, getApps, cert } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "readers-hub-52be2";

let adminApp: App | null = null;

export function getFirebaseAdminApp(): App | null {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  // Check for service account JSON or credentials
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  try {
    if (serviceAccountKey) {
      const parsed = JSON.parse(serviceAccountKey);
      adminApp = initializeApp({
        credential: cert(parsed),
        projectId,
      });
      return adminApp;
    }

    if (clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      return adminApp;
    }

    // Attempt default initialization with project ID
    adminApp = initializeApp({ projectId });
    return adminApp;
  } catch (err) {
    console.warn("[Firebase Admin] Initialization notice:", err);
    return null;
  }
}

export function getFirebaseAdminAuth(): Auth | null {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAuth } = require("firebase-admin/auth");
    return getAuth(app);
  } catch (err) {
    console.warn("[Firebase Admin Auth] Initialization notice:", err);
    return null;
  }
}

export function getFirebaseAdminFirestore(): Firestore | null {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  try {
    return getFirestore(app);
  } catch (err) {
    console.warn("[Firebase Admin Firestore] Initialization notice:", err);
    return null;
  }
}


