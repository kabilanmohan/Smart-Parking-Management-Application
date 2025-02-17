// src/components/TransactionHistory.js
import React, { useEffect, useState } from "react";
import { db, collection, getDocs } from "../firebase";

const TransactionHistory = ({ transactions }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const querySnapshot = await getDocs(collection(db, "transactions"));
      const data = querySnapshot.docs.map((doc) => doc.data());
      setHistory(data);
    };

    fetchTransactions();
  }, []);

  return (
    <div className="transaction-history">
      <h3>Transaction History</h3>
      <ul>
        {history.map((txn, index) => (
          <li key={index}>
            <p>{txn.name}</p>
            <p>{txn.cardNumber}</p>
            <p>${txn.amount.toFixed(2)}</p>
            <p>{txn.date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionHistory;