import { onCall, CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Cloud Function to simulate bank transaction synchronization.
 * In a real application, this would interact with a PSD2/Open Banking API.
 * Triggered by an HTTP request (callable function).
 */
export const syncBankTransactions = onCall(async (request: CallableRequest) => {
  // Check if the user is authenticated
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const userId = request.auth.uid;

  console.log(`Simulating bank transaction sync for user: ${userId}`);

  // Simulate fetching transactions
  const simulatedTransactions = [
    {
      id: 'trans_001',
      date: '2024-07-01',
      description: 'Payment for Invoice #INV-2024-001',
      amount: 150.00,
      type: 'credit',
      userId: userId,
      status: 'unreconciled',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      id: 'trans_002',
      date: '2024-07-02',
      description: 'Office Supplies',
      amount: -25.50,
      type: 'debit',
      userId: userId,
      status: 'unreconciled',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      id: 'trans_003',
      date: '2024-07-03',
      description: 'Electricity Bill',
      amount: -75.00,
      type: 'debit',
      userId: userId,
      status: 'unreconciled',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  const batch = admin.firestore().batch();
  simulatedTransactions.forEach((transaction) => {
    const docRef = admin.firestore().collection('bankTransactions').doc(transaction.id);
    batch.set(docRef, transaction, { merge: true });
  });

  await batch.commit();

  console.log(`Simulated ${simulatedTransactions.length} transactions for user: ${userId}`);

  return { success: true, message: `Simulated ${simulatedTransactions.length} transactions.` };
});
