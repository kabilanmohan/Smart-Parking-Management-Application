import React, { useState } from "react";
import PaymentForm from "./components/PaymentForm";
import PaymentSummary from "./components/PaymentSummary";
import TransactionHistory from "./components/TransactionHistory";

function App2() {
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState(50); // Default amount

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Bar */}
      <nav className="sticky top-0 bg-blue-950 shadow-lg py-4">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="text-xl font-bold">Parking Payment</div>
          <div className="flex gap-5">
            <a href="#payment" className="hover:text-yellow-400 transition-colors">Payment</a>
            <a href="#history" className="hover:text-yellow-400 transition-colors">History</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-20">
        <section id="payment" className="mb-12">
          <PaymentForm
            onPaymentSuccess={(transaction) => {
              setTransactions([...transactions, transaction]);
              setAmount(transaction.amount); // Update amount dynamically
            }}
          />
          <PaymentSummary amount={amount} />
        </section>
        <section id="history">
          <TransactionHistory />
        </section>
      </main>
    </div>
  );
}

export default App2;