import React, { useState } from "react";
import { db, collection, addDoc, getDocs, query, where } from "../firebase";
import { serverTimestamp } from "firebase/firestore";

const PaymentForm = ({ onPaymentSuccess }) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [amount, setAmount] = useState(50); // Default amount
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear}-01`;
  const maxDate = `${currentYear + 10}-12`;

  const handleCardNumberChange = (e) => {
    const sanitizedValue = e.target.value.replace(/\D/g, "");
    let formattedValue = sanitizedValue.replace(/(\d{4})/g, "$1 ").trim();
    if (formattedValue.length <= 19) {
      setCardNumber(formattedValue);
    }
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

  const applyDiscount = async () => {
    if (!discountCode) return 0; // No discount code entered

    try {
      const q = query(collection(db, "discounts"), where("code", "==", discountCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Invalid discount code.");
        return 0; // Return 0 instead of null
      }

      const discountValue = querySnapshot.docs[0].data().discount;
      setAmount((prevAmount) => Math.max(prevAmount - discountValue, 0)); // Ensure no negative amount
      setError("");
      return discountValue;
    } catch (error) {
      console.error("Error applying discount:", error);
      setError("Failed to apply discount.");
      return 0;
    }
  };

  const handlePayment = async () => {
    if (!validateInputs()) return;

    setIsProcessing(true);
    const discount = await applyDiscount();
    const finalAmount = Math.max(amount - discount, 0);

    const transaction = {
      name,
      cardNumber: `**** **** **** ${cardNumber.replace(/\s/g, "").slice(-4)}`,
      amount: finalAmount, // Store the correct final amount
      date: serverTimestamp(),
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

  const resetForm = () => {
    setCardNumber("");
    setExpiryDate("");
    setCvv("");
    setName("");
    setDiscountCode("");
    setAmount(50);
    setError("");
  };

  return (
    <div className="bg-blue-950 rounded-lg shadow-lg p-6 max-w-sm mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Payment Details</h2>

      <div className="mb-4">
        <label className="block font-bold mb-2">Card Number💳</label>
        <input
          type="text"
          value={cardNumber}
          onChange={handleCardNumberChange}
          placeholder="1234 5678 9012 3456"
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block font-bold mb-2">Expiry Date📅</label>
        <input
          type="month"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          min={minDate}
          max={maxDate}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
      </div>

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

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <button
        className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-2 rounded hover:from-yellow-500 hover:to-orange-600 transition-all"
        onClick={handlePayment}
        disabled={isProcessing}
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
};

export default PaymentForm;
