import { useState } from 'react';
import { functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';

const FiscalAdvicePage = () => {
  const [query, setQuery] = useState('');
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetAdvice = async () => {
    if (!query.trim()) {
      setError("Please enter a query.");
      return;
    }

    setLoading(true);
    setError(null);
    setAdvice(null);

    try {
      const getAdviceCallable = httpsCallable(functions, 'getFiscalAdvice');
      // Simulate user data for context
      const simulatedUserData = {
        companyType: "ZZP",
        industry: "IT Consulting",
        annualRevenue: 50000,
        recentExpenses: ["laptop", "software subscription"],
      };
      const result = await getAdviceCallable({ query, userData: simulatedUserData });
      setAdvice((result.data as any).advice);
    } catch (err: any) {
      console.error("Error getting fiscal advice:", err);
      setError(err.message || "Failed to get fiscal advice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>AI Fiscal Advice</h1>

      <div>
        <textarea
          placeholder="Ask a question about fiscal matters..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={5}
          cols={50}
        />
      </div>
      <button onClick={handleGetAdvice} disabled={loading}>
        {loading ? "Getting Advice..." : "Get Advice"}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {advice && (
        <div>
          <h2>Advice:</h2>
          <p>{advice}</p>
        </div>
      )}
    </div>
  );
};

export default FiscalAdvicePage;
