import PropTypes from "prop-types";

const PaymentSummary = ({ amount }) => {
  // Ensure amount is a number and provide a fallback value if it's not
  const formattedAmount = typeof amount === "number" ? amount.toFixed(2) : "0.00";

  return (
    <div style={{ backgroundColor: "#0A0F1C" }} className="rounded-lg shadow-lg p-6 text-center mt-6">
      <h3 className="text-xl font-bold mb-4">Payment Summary</h3>
      <p>
        <strong>Total Amount:</strong> ${formattedAmount}
      </p>
    </div>
  );
};

// Define prop types for better validation
PaymentSummary.propTypes = {
  amount: PropTypes.number,
};

// Provide a default value for amount
PaymentSummary.defaultProps = {
  amount: 0,
};

export default PaymentSummary;