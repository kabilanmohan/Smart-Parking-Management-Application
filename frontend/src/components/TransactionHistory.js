import React, { useEffect, useState } from "react";
import { db, collection, getDocs } from "../firebase";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "transactions"));
        let data = querySnapshot.docs.map((doc) => doc.data());
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
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
    <div className="card transaction-history">
      <h2 className="text-center">Transaction History</h2>
      {loading ? (
        <p>Loading transactions...</p>
      ) : transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Card Number</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn, index) => (
              <tr key={index}>
                <td>{txn.name}</td>
                <td>{txn.cardNumber}</td>
                <td>${txn.amount.toFixed(2)}</td>
                <td>{txn.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TransactionHistory;
