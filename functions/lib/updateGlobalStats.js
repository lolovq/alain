"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserCountOnUserCreate = exports.updateGlobalStatsOnBookingWrite = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();
/**
 * Cloud Function that triggers on booking writes to keep aggregated statistics up-to-date.
 */
exports.updateGlobalStatsOnBookingWrite = (0, firestore_1.onDocumentWritten)('bookings/{bookingId}', async (event) => {
    var _a, _b;
    const change = event.data;
    const statsRef = admin.firestore().collection('statistics').doc('overview');
    const increment = admin.firestore.FieldValue.increment;
    if (!change) {
        console.error("No change data found in event.");
        return null;
    }
    if (change.before.exists && change.after.exists) {
        // Update: Statuswijzigingen hoeven niet altijd tellers te beïnvloeden
        // Dit is alleen als bijvoorbeeld 'completed' boekingen geteld moeten worden.
        const oldStatus = (_a = change.before.data()) === null || _a === void 0 ? void 0 : _a.status;
        const newStatus = (_b = change.after.data()) === null || _b === void 0 ? void 0 : _b.status;
        if (oldStatus !== 'completed' && newStatus === 'completed') {
            await statsRef.update({ completedBookings: increment(1) });
        }
    }
    else if (!change.before.exists && change.after.exists) {
        // Nieuwe boeking
        await statsRef.update({ totalBookings: increment(1), pendingBookings: increment(1) });
    }
    else if (change.before.exists && !change.after.exists) {
        // Boeking verwijderd (minder vaak, maar mogelijk)
        await statsRef.update({ totalBookings: increment(-1) });
        // Pas op met decrements bij onvoltooide transacties
    }
    return null;
});
/**
 * Cloud Function that triggers on user creation to update the total user count.
 */
exports.updateUserCountOnUserCreate = (0, firestore_1.onDocumentCreated)('users/{userId}', async (event) => {
    const snap = event.data;
    if (!snap) {
        console.error("No snapshot data found in event.");
        return null;
    }
    const statsRef = admin.firestore().collection('statistics').doc('overview');
    await statsRef.set({ totalUsers: admin.firestore.FieldValue.increment(1) }, { merge: true });
    return null;
});
//# sourceMappingURL=updateGlobalStats.js.map