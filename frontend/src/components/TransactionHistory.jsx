import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]); // Initialize as an empty array
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const q = query(collection(db, "transactions"), orderBy("date", "desc")); // Order transactions by date descending
        const querySnapshot = await getDocs(q);

        const data = querySnapshot.docs.map((doc) => {
          const transaction = doc.data();
          return {
            id: doc.id,
            ...transaction,
            date: transaction.date?.toDate() || new Date(), // Convert Firestore Timestamp to Date
          };
        });

        setTransactions(data || []); // Ensure data is always an array
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]); // Fallback to an empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div style={{ backgroundColor: "#0A0F1C" }} className="rounded-lg shadow-lg p-6 text-center mt-6">
      <h2 className="text-2xl font-bold text-center mb-6">Transaction History</h2>
      {loading ? (
        <p>Loading transactions...</p>
      ) : transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <table className="w-full border-collapse overflow-hidden rounded-lg">
  <thead className="bg-[#101828] text-white rounded-lg">
    <tr>
      <th className="p-3 first:rounded-tl-lg first:rounded-bl-lg last:rounded-tr-lg last:rounded-br-lg">
        Name
      </th>
      <th className="p-3">Card Number</th>
      <th className="p-3">Amount</th>
      <th className="p-3 first:rounded-bl-lg last:rounded-br-lg">Date</th>
    </tr>
  </thead>
  <tbody className="bg-[#0A0F1C] text-white">
    {transactions.map((txn) => (
      <tr key={txn.id} className="border-b border-gray-700 last:rounded-lg">
        <td className="p-3">{txn.name}</td>
        <td className="p-3">{txn.cardNumber}</td>
        <td className="p-3">${txn.amount.toFixed(2)}</td>
        <td className="p-3">{txn.date.toLocaleString()}</td>
      </tr>
    ))}
  </tbody>
</table>

      )}
    </div>
  );
};

export default TransactionHistory;