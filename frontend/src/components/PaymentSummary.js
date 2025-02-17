// src/components/PaymentSummary.js
import React from "react";

const PaymentSummary = ({ amount }) => {
  return (
    <div className="payment-summary">
      <h3>Payment Summary</h3>
      <p>Total Amount: ${amount.toFixed(2)}</p>
    </div>
  );
};

export default PaymentSummary;