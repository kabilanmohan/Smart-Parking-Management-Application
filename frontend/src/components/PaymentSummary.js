import React from "react";

const PaymentSummary = ({ amount }) => {
  return (
    <div className="card payment-summary" style={{ textAlign: "center" }}>
      <h3>Payment Summary</h3>
      <p><strong>Total Amount:</strong> ${amount.toFixed(2)}</p>
    </div>
  );
};

export default PaymentSummary;
