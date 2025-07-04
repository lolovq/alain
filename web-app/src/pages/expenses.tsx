import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/router';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface Expense {
  id?: string;
  filePath: string;
  bucketName: string;
  processedAt: any;
  extractedData: { [key: string]: any };
  userId: string;
}

const ExpensesPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const storage = getStorage();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        const q = query(collection(db, "expenses"), where("userId", "==", user.uid));
        const unsubscribeExpenses = onSnapshot(q, (snapshot) => {
          const expensesData: Expense[] = [];
          snapshot.forEach((doc) => {
            expensesData.push({ id: doc.id, ...doc.data() } as Expense);
          });
          setExpenses(expensesData);
        });
        return () => unsubscribeExpenses();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    setError(null);
    if (!file || !user) {
      setError("Please select a file and ensure you are logged in.");
      return;
    }

    setUploading(true);
    const storageRef = ref(storage, `expense-receipts/${user.uid}/${file.name}`);
    try {
      const snapshot = await uploadBytes(storageRef, file, { customMetadata: { userId: user.uid } });
      const downloadURL = await getDownloadURL(snapshot.ref);
      alert("File uploaded successfully! Processing will begin shortly.");
      setFile(null);
    } catch (err: any) {
      console.error("Error uploading file:", err);
      setError(err.message || "Error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Expenses</h1>

      <h2>Upload Expense Receipt</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? "Uploading..." : "Upload Receipt"}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Processed Expenses</h2>
      {expenses.length === 0 ? (
        <p>No expenses found.</p>
      ) : (
        <ul>
          {expenses.map((expense) => (
            <li key={expense.id}>
              <p><strong>File:</strong> {expense.filePath}</p>
              <p><strong>Processed At:</strong> {new Date(expense.processedAt.toDate()).toLocaleString()}</p>
              <h3>Extracted Data:</h3>
              <ul>
                {Object.entries(expense.extractedData).map(([key, value]) => (
                  <li key={key}><strong>{key}:</strong> {value}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ExpensesPage;
