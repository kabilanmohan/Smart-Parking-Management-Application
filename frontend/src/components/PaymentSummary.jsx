import React from "react";

const PaymentSummary = ({ amount }) => {
  return (
    <div className="bg-blue-950 rounded-lg shadow-lg p-6 text-center mt-6">
      <h3 className="text-xl font-bold mb-4">Payment Summary</h3>
      <p><strong>Total Amount:</strong> ${amount.toFixed(2)}</p>
    </div>
  );
};

export default PaymentSummary;