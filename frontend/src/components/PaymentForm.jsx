  import { useState } from "react";
  import { db } from "../firebase";
  import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
  import PaymentSummary from "./PaymentSummary"; // Import the PaymentSummary component
  import PropTypes from 'prop-types';

  const PaymentForm = ({ onPaymentSuccess }) => {
    const [cardNumber, setCardNumber] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [cvv, setCvv] = useState("");
    const [name, setName] = useState("");
    const [discountCode, setDiscountCode] = useState("");
    const [amount, setAmount] = useState(50); // Default amount
    const [finalAmount, setFinalAmount] = useState(50); // Track final amount after discount
    const [error, setError] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const applyDiscount = async () => {
      if (!discountCode) return 0; // No discount code entered

      try {
        const q = query(collection(db, "discounts"), where("code", "==", discountCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("Invalid discount code.");
          return 0; // Return 0 instead of null
        }

        const discountDoc = querySnapshot.docs[0].data();
        const discountValue = discountDoc.discount;

        if (typeof discountValue !== 'number') {
          setError("Invalid discount value in database.");
          return 0;
        }

        // Calculate discount amount as a percentage of the original amount
        const discountAmount = (amount * discountValue) / 100;
        const newFinalAmount = Math.max(amount - discountAmount, 0); // Ensure no negative amount
        setFinalAmount(newFinalAmount); // Update final amount
        setError("");
        return discountAmount; // Return the discount amount
      } catch (error) {
        console.error("Error applying discount:", error);
        setError("Failed to apply discount. Please try again later.");
        return 0;
      }
    };

    const handlePayment = async () => {
      if (!validateInputs()) return;

      setIsProcessing(true);
      const discount = await applyDiscount();
      const newFinalAmount = Math.max(amount - discount, 0); // Recalculate final amount
      setFinalAmount(newFinalAmount); // Update final amount

      const transaction = {
        name,
        cardNumber: `**** **** **** ${cardNumber.replace(/\s/g, "").slice(-4)}`,
        amount: newFinalAmount, // Use the final amount
        date: new Date(),
      };

      try {
        await addDoc(collection(db, "transactions"), transaction);
        onPaymentSuccess(transaction);
        alert("Payment Successful!");
        resetForm();
      } catch (error) {
        console.error("Error processing payment:", error);
        setError("Payment failed. Please try again.");
      }

      setIsProcessing(false);
    };

    const validateInputs = () => {
      const numericCardNumber = cardNumber.replace(/\s/g, "");

      if (!numericCardNumber || !expiryDate || !cvv || !name) {
        setError("All fields are required.");
        return false;
      }

      if (numericCardNumber.length !== 16) {
        setError("Card number must be exactly 16 digits.");
        return false;
      }

      if (cvv.length !== 3) {
        setError("CVV must be exactly 3 digits.");
        return false;
      }

      setError("");
      return true;
    };

    const resetForm = () => {
      setCardNumber("");
      setExpiryDate("");
      setCvv("");
      setName("");
      setDiscountCode("");
      setAmount(50);
      setFinalAmount(50); // Reset final amount
      setError("");
    };

    return (
      <div style={{ backgroundColor: "#0A0F1C" }} className="rounded-lg shadow-lg p-6 max-w-sm mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Payment Details</h2>

        {/* Card Number Input */}
        <div className="mb-4">
          <label className="block font-bold mb-2">Card Number💳</label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => {
              const sanitizedValue = e.target.value.replace(/\D/g, "");
              let formattedValue = sanitizedValue.replace(/(\d{4})/g, "$1 ").trim();
              if (formattedValue.length <= 19) {
                setCardNumber(formattedValue);
              }
            }}
            placeholder="1234 5678 9012 3456"
            className="w-full p-2 rounded bg-gray-800 text-white"
          />
        </div>

        {/* Expiry Date Input */}
        <div className="mb-4">
          <label className="block font-bold mb-2">Expiry Date📅</label>
          <input
            type="month"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            min={`${new Date().getFullYear()}-01`}
            max={`${new Date().getFullYear() + 10}-12`}
            className="w-full p-2 rounded bg-gray-800 text-white"
          />
        </div>

        {/* CVV Input */}
        <div className="mb-4">
          <label className="block font-bold mb-2">CVV🔒</label>
          <input
            type="text"
            value={cvv}
            onChange={(e) => {
              const sanitizedValue = e.target.value.replace(/\D/g, "");
              if (sanitizedValue.length <= 3) {
                setCvv(sanitizedValue);
              }
            }}
            placeholder="123"
            maxLength={3}
            className="w-full p-2 rounded bg-gray-800 text-white"
          />
        </div>

        {/* Cardholder Name Input */}
        <div className="mb-4">
          <label className="block font-bold mb-2">Cardholder Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alice Bob"
            className="w-full p-2 rounded bg-gray-800 text-white"
          />
        </div>

        {/* Discount Code Input */}
        <div className="mb-4">
          <label className="block font-bold mb-2">Discount Code (Optional)</label>
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="DISCOUNT50"
            className="w-full p-2 rounded bg-gray-800 text-white"
          />
          <button
            className="mt-2 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 block mx-auto"
            onClick={applyDiscount}
          >
            Apply Discount
          </button>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Pay Now Button */}
        <button
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-2 rounded hover:from-yellow-500 hover:to-orange-600 transition-all"
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Pay Now"}
        </button>

        {/* Display PaymentSummary with the final amount */}
        <PaymentSummary amount={finalAmount} />
      </div>
    );
  };
  PaymentForm.propTypes = {
    onPaymentSuccess: PropTypes.func.isRequired,
  };

  export default PaymentForm;