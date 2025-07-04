import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getPerformance } from "firebase/performance";
import { getMessaging, getToken } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics"; // Import getAnalytics

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Add your Measurement ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const performance = typeof window !== 'undefined' && getPerformance(app);
const messaging = typeof window !== 'undefined' && getMessaging(app);
const analytics = typeof window !== 'undefined' && getAnalytics(app); // Initialize Firebase Analytics

// Function to request and save FCM token
export const requestForToken = async (userId: string) => {
  if (!messaging) {
    console.warn('Firebase Messaging is not available.');
    return;
  }
  try {
    const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY }); // Replace with your VAPID key
    if (currentToken) {
      console.log('FCM Token:', currentToken);
      // Save the token to Firestore for the current user
      await setDoc(doc(db, "users", userId), { fcmToken: currentToken }, { merge: true });
    } else {
      console.log('No registration token available. Request permission to generate one.');
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
};

export { auth, db, functions, performance, messaging, analytics };
