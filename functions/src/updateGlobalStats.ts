import { onDocumentWritten, onDocumentCreated, Change, FirestoreEvent, DocumentSnapshot } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Cloud Function that triggers on booking writes to keep aggregated statistics up-to-date.
 */
export const updateGlobalStatsOnBookingWrite = onDocumentWritten('bookings/{bookingId}', async (event: FirestoreEvent<Change<DocumentSnapshot> | undefined>) => {
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
      const oldStatus = change.before.data()?.status;
      const newStatus = change.after.data()?.status;
      if (oldStatus !== 'completed' && newStatus === 'completed') {
        await statsRef.update({ completedBookings: increment(1) });
      }
    } else if (!change.before.exists && change.after.exists) {
      // Nieuwe boeking
      await statsRef.update({ totalBookings: increment(1), pendingBookings: increment(1) });
    } else if (change.before.exists && !change.after.exists) {
      // Boeking verwijderd (minder vaak, maar mogelijk)
      await statsRef.update({ totalBookings: increment(-1) });
      // Pas op met decrements bij onvoltooide transacties
    }
    return null;
  });

/**
 * Cloud Function that triggers on user creation to update the total user count.
 */
export const updateUserCountOnUserCreate = onDocumentCreated('users/{userId}', async (event: FirestoreEvent<DocumentSnapshot | undefined>) => {
    const snap = event.data;
    if (!snap) {
      console.error("No snapshot data found in event.");
      return null;
    }
    const statsRef = admin.firestore().collection('statistics').doc('overview');
    await statsRef.set({ totalUsers: admin.firestore.FieldValue.increment(1) }, { merge: true });
    return null;
  });
