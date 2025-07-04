import { useEffect, useState } from 'react';
import { auth, db, functions } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/router';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  userId: string;
  status: 'unreconciled' | 'reconciled';
  createdAt: any;
}

const BankPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        const q = query(collection(db, "bankTransactions"), where("userId", "==", user.uid));
        const unsubscribeTransactions = onSnapshot(q, (snapshot) => {
          const transactionsData: BankTransaction[] = [];
          snapshot.forEach((doc) => {
            transactionsData.push({ id: doc.id, ...doc.data() } as BankTransaction);
          });
          setTransactions(transactionsData);
        });
        return () => unsubscribeTransactions();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  const handleSyncTransactions = async () => {
    setError(null);
    if (!user) {
      setError("Please log in to sync transactions.");
      return;
    }

    setSyncing(true);
    try {
      const syncTransactionsCallable = httpsCallable(functions, 'syncBankTransactions');
      const result = await syncTransactionsCallable();
      alert((result.data as any).message);
    } catch (err: any) {
      console.error("Error syncing transactions:", err);
      setError(err.message || "Error syncing transactions.");
    } finally {
      setSyncing(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Bank Reconciliation</h1>

      <h2>Sync Bank Transactions</h2>
      <button onClick={handleSyncTransactions} disabled={syncing}>
        {syncing ? "Syncing..." : "Sync Transactions"}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Bank Transactions</h2>
      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <ul>
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              <p><strong>Date:</strong> {transaction.date}</p>
              <p><strong>Description:</strong> {transaction.description}</p>
              <p><strong>Amount:</strong> {transaction.amount.toFixed(2)}</p>
              <p><strong>Type:</strong> {transaction.type}</p>
              <p><strong>Status:</strong> {transaction.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BankPage;
