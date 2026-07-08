import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import config from "../../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);

// Validate connection to Firestore on boot
async function testConnection() {
  if (typeof window !== "undefined") {
    try {
      await getDocFromServer(doc(db, "test", "connection"));
      console.log("Firebase Firestore connected successfully.");
    } catch (error) {
      if (error instanceof Error && error.message.includes("offline")) {
        console.error("Please check your Firebase configuration. Client is offline.");
      } else {
        console.warn("Firestore connection check completed (non-blocking).");
      }
    }
  }
}

testConnection();

export { app, auth, db };
