"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookingStatus = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();
/**
 * Cloud Function to safely update the status of a booking.
 * Triggered by an HTTP request (callable function).
 */
exports.updateBookingStatus = (0, https_1.onCall)(async (request) => {
    var _a;
    // 1. Authenticatie en autorisatie: Alleen geauthenticeerde gebruikers, en controleer hun rol
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authenticatie vereist.');
    }
    const userId = request.auth.uid;
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userRole = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role; // Gebruik optional chaining voor veiligheid
    const { bookingId, newStatus } = request.data; // Data doorgegeven door de frontend
    const bookingRef = admin.firestore().collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();
    if (!bookingDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Boeking niet gevonden.');
    }
    const bookingData = bookingDoc.data();
    // 2. Controleer permissies: Alleen provider kan status updaten (tenzij Admin)
    if ((bookingData === null || bookingData === void 0 ? void 0 : bookingData.providerId) !== userId && userRole !== 'admin') {
        throw new https_1.HttpsError('permission-denied', 'Alleen de aanbieder of admin mag de status wijzigen.');
    }
    // 3. Valideer de nieuwe statusovergang
    // Bijv: 'pending' -> 'accepted'/'rejected'; 'accepted' -> 'completed'
    // Voorkom ongeoorloofde sprongen in status
    if (newStatus === 'accepted' && (bookingData === null || bookingData === void 0 ? void 0 : bookingData.status) !== 'pending') {
        throw new https_1.HttpsError('invalid-argument', 'Boeking kan alleen geaccepteerd worden als de status "pending" is.');
    }
    // ... voeg hier meer statusovergangslogica toe
    // 4. Update de status
    await bookingRef.update({ status: newStatus, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    // 5. Trigger Notificatie (aparte functie of in-line)
    await admin.firestore().collection('notifications').add({
        userId: bookingData === null || bookingData === void 0 ? void 0 : bookingData.bookerId,
        type: 'booking_status_update',
        bookingId: bookingId,
        newStatus: newStatus,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { message: 'Status succesvol geüpdatet.' };
});
//# sourceMappingURL=updateBookingStatus.js.map