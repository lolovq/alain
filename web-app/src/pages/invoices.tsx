import { useEffect, useState } from 'react';
import { auth, db, functions } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/router';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id?: string;
  invoiceNumber: string;
  companyId: string;
  customerId: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: any;
  updatedAt?: any;
}

const InvoicesPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    customerId: '',
    issueDate: '',
    dueDate: '',
    items: [{ description: '', quantity: 0, unitPrice: 0, total: 0 }],
    status: 'draft',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        // Fetch invoices for the current user's company
        // This assumes a user is associated with a company, which needs to be implemented
        // For now, we'll fetch all invoices (which will be restricted by security rules)
        const q = query(collection(db, "invoices")); // TODO: Add where clause for companyId
        const unsubscribeInvoices = onSnapshot(q, (snapshot) => {
          const invoicesData: Invoice[] = [];
          snapshot.forEach((doc) => {
            invoicesData.push({ id: doc.id, ...doc.data() } as Invoice);
          });
          setInvoices(invoicesData);
        });
        return () => unsubscribeInvoices();
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = newInvoice.items?.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        return updatedItem;
      }
      return item;
    });
    setNewInvoice({ ...newInvoice, items: updatedItems });
  };

  const addItem = () => {
    setNewInvoice({ ...newInvoice, items: [...(newInvoice.items || []), { description: '', quantity: 0, unitPrice: 0, total: 0 }] });
  };

  const calculateTotals = () => {
    const subtotal = newInvoice.items?.reduce((sum, item) => sum + item.total, 0) || 0;
    const tax = subtotal * 0.1; // Example 10% tax
    const totalAmount = subtotal + tax;
    setNewInvoice(prev => ({ ...prev, subtotal, tax, totalAmount }));
  };

  useEffect(() => {
    calculateTotals();
  }, [newInvoice.items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!user || !newInvoice.companyId) { // companyId is a placeholder for now
      setError('User not logged in or company ID missing.');
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "invoices"), {
        ...newInvoice,
        createdAt: serverTimestamp(),
        companyId: newInvoice.companyId, // This needs to be dynamically set based on user's company
      });
      setNewInvoice({
        invoiceNumber: '',
        customerId: '',
        issueDate: '',
        dueDate: '',
        items: [{ description: '', quantity: 0, unitPrice: 0, total: 0 }],
        status: 'draft',
      });
      alert('Invoice added successfully!');
    } catch (err: any) {
      console.error('Error adding invoice:', err);
      setError(err.message || 'Error adding invoice.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async (invoice: Invoice) => {
    setError(null);
    setLoading(true);
    try {
      const generatePdf = httpsCallable(functions, 'generateInvoicePdf');
      const result = await generatePdf({ invoice });
      const pdfBase64 = (result.data as any).pdf;

      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError(err.message || 'Error generating PDF.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Invoices</h1>

      <h2>Create New Invoice</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Invoice Number:</label>
          <input
            type="text"
            value={newInvoice.invoiceNumber || ''}
            onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
            required
          />
        </div>
        <div>
          <label>Customer ID:</label>
          <input
            type="text"
            value={newInvoice.customerId || ''}
            onChange={(e) => setNewInvoice({ ...newInvoice, customerId: e.target.value })}
            required
          />
        </div>
        <div>
          <label>Issue Date:</label>
          <input
            type="date"
            value={newInvoice.issueDate || ''}
            onChange={(e) => setNewInvoice({ ...newInvoice, issueDate: e.target.value })}
            required
          />
        </div>
        <div>
          <label>Due Date:</label>
          <input
            type="date"
            value={newInvoice.dueDate || ''}
            onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
            required
          />
        </div>

        <h3>Items</h3>
        {newInvoice.items?.map((item, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
            <label>Description:</label>
            <input
              type="text"
              value={item.description}
              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
              required
            />
            <label>Quantity:</label>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
              required
            />
            <label>Unit Price:</label>
            <input
              type="number"
              value={item.unitPrice}
              onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
              required
            />
            <p>Total: {item.total.toFixed(2)}</p>
          </div>
        ))}
        <button type="button" onClick={addItem}>Add Item</button>

        <div>
          <p>Subtotal: {newInvoice.subtotal?.toFixed(2)}</p>
          <p>Tax: {newInvoice.tax?.toFixed(2)}</p>
          <h3>Total Amount: {newInvoice.totalAmount?.toFixed(2)}</h3>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Invoice'}</button>
      </form>

      <h2>Existing Invoices</h2>
      {invoices.length === 0 ? (
        <p>No invoices found.</p>
      ) : (
        <ul>
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              Invoice Number: {invoice.invoiceNumber} - Total: {invoice.totalAmount.toFixed(2)} - Status: {invoice.status}
              <button onClick={() => handleGeneratePdf(invoice)} disabled={loading}>Generate PDF</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InvoicesPage;
