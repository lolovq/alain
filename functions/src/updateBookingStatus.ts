import { onCall, CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Cloud Function to safely update the status of a booking.
 * Triggered by an HTTP request (callable function).
 */
export const updateBookingStatus = onCall(async (request: CallableRequest) => {
    // 1. Authenticatie en autorisatie: Alleen geauthenticeerde gebruikers, en controleer hun rol
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authenticatie vereist.');
    }
    const userId = request.auth.uid;
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userRole = userDoc.data()?.role; // Gebruik optional chaining voor veiligheid

    const { bookingId, newStatus } = request.data; // Data doorgegeven door de frontend
    const bookingRef = admin.firestore().collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
        throw new HttpsError('not-found', 'Boeking niet gevonden.');
    }

    const bookingData = bookingDoc.data();
    // 2. Controleer permissies: Alleen provider kan status updaten (tenzij Admin)
    if (bookingData?.providerId !== userId && userRole !== 'admin') {
        throw new HttpsError('permission-denied', 'Alleen de aanbieder of admin mag de status wijzigen.');
    }

    // 3. Valideer de nieuwe statusovergang
    // Bijv: 'pending' -> 'accepted'/'rejected'; 'accepted' -> 'completed'
    // Voorkom ongeoorloofde sprongen in status
    if (newStatus === 'accepted' && bookingData?.status !== 'pending') {
        throw new HttpsError('invalid-argument', 'Boeking kan alleen geaccepteerd worden als de status "pending" is.');
    }
    // ... voeg hier meer statusovergangslogica toe

    // 4. Update de status
    await bookingRef.update({ status: newStatus, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    // 5. Trigger Notificatie (aparte functie of in-line)
    await admin.firestore().collection('notifications').add({
        userId: bookingData?.bookerId, // Notify the booker
        type: 'booking_status_update',
        bookingId: bookingId,
        newStatus: newStatus,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { message: 'Status succesvol geüpdatet.' };
});
