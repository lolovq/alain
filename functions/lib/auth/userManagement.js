"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserProfile = void 0;
const auth_1 = require("firebase-functions/v2/auth");
const admin = require("firebase-admin");
admin.initializeApp();
/**
 * A Cloud Function that triggers when a new user is created.
 * It creates a corresponding user profile document in Firestore.
 */
exports.createUserProfile = (0, auth_1.onUserCreated)(async (event) => {
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
//# sourceMappingURL=userManagement.js.map