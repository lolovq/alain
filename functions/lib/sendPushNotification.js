"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();
/**
 * Cloud Function to send a push notification via FCM when a new notification is added to Firestore.
 */
exports.sendPushNotification = (0, firestore_1.onDocumentCreated)('notifications/{notificationId}', async (event) => {
    var _a;
    const snapshot = event.data;
    const notification = snapshot.data();
    const userId = notification === null || notification === void 0 ? void 0 : notification.userId;
    // TODO: Implement smart alert logic here to prevent notification fatigue
    // For example, check user preferences, notification frequency, or importance of the event.
    // if (!shouldSendNotification(notification, userPreferences)) {
    //   console.log(`Skipping notification for user ${userId} due to smart alert logic.`);
    //   return null;
    // }
    // Get the user's FCM token from Firestore
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const fcmToken = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.fcmToken;
    if (fcmToken) {
        const payload = {
            notification: {
                title: 'New Notification',
                body: `Type: ${notification.type}`,
            },
            data: {
                // You can add custom data here to handle in your app
                notificationId: snapshot.id,
                type: notification.type,
            },
        };
        try {
            await admin.messaging().sendEachForMulticast(message);
            console.log('Push notification sent successfully to:', userId);
        }
        catch (error) {
            console.error('Error sending push notification to:', userId, error);
        }
    }
    else {
        console.log('No FCM token found for user:', userId);
    }
    return null;
});
//# sourceMappingURL=sendPushNotification.js.map