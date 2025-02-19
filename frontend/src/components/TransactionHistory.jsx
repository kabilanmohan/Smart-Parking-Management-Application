import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
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

        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="bg-blue-950 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Transaction History</h2>
      {loading ? (
        <p>Loading transactions...</p>
      ) : transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-700 text-white">
              <th className="p-3">Name</th>
              <th className="p-3">Card Number</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id} className="border-b border-gray-700">
                <td className="p-3">{txn.name}</td>
                <td className="p-3">{txn.cardNumber}</td>
                <td className="p-3">${txn.amount.toFixed(2)}</td>
                <td className="p-3">{txn.date.toLocaleString()}</td> {/* Display formatted date */}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TransactionHistory;