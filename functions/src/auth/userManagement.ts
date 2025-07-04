import { auth } from 'firebase-functions/v2';
import { UserRecord } from 'firebase-admin/auth';
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * A Cloud Function that triggers when a new user is created.
 * It creates a corresponding user profile document in Firestore.
 */
export const createUserProfile = auth.user().onCreate(async (event) => {
  const user = event.data;

  if (!user) {
    console.error("No user data found in event.");
    return;
  }

  const userProfile = {
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  return admin.firestore().collection("users").doc(user.uid).set(userProfile);
});
