import React, { useState } from "react";
import { db, collection, addDoc, getDocs, query, where } from "../firebase";

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
    if (!discountCode) return 0;

    try {
      const q = query(collection(db, "discounts"), where("code", "==", discountCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Invalid discount code.");
        return 0;
      }

      return querySnapshot.docs[0].data().discount;
    } catch (error) {
      console.error("Error applying discount:", error);
      return 0;
    }
  };

  const handlePayment = async () => {
    if (!validateInputs()) return;

    setIsProcessing(true);
    const discount = await applyDiscount();
    const finalAmount = amount - discount;

    const transaction = {
      name,
      cardNumber: `**** **** **** ${cardNumber.replace(/\s/g, "").slice(-4)}`,
      amount: finalAmount,
      date: new Date().toLocaleString(),
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
    <div className="card payment-form">
      <h2 className="text-center">Payment Details</h2>
      <div className="form-group">
        <label>Card Number💳</label>
        <input
          type="text"
          value={cardNumber}
          onChange={handleCardNumberChange}
          placeholder="1234 5678 9012 3456"
        />
      </div>
      <div className="form-group">
        <label>Expiry Date📅</label>
        <input
          type="month"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          min={minDate}
          max={maxDate}
        />
      </div>
      <div className="form-group">
        <label>CVV🔒</label>
        <input
          type="text"
          value={cvv}
          onChange={(e) => {
            const sanitizedValue = e.target.value.replace(/\D/g, ""); // Remove non-digits
            if (sanitizedValue.length <= 3) {
              setCvv(sanitizedValue); // Allow only up to 3 digits
            }
          }}
          placeholder="123"
          maxLength={3} // Ensure the input field doesn't allow more than 3 characters
        />
      </div>
      <div className="form-group">
        <label>Cardholder Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alice Bob"
        />
      </div>
      <div className="form-group">
        <label>Discount Code (Optional)</label>
        <input
          type="text"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          placeholder="DISCOUNT50"
        />
      </div>
      {error && <p className="error">{error}</p>}
      <button className="pay-button" onClick={handlePayment} disabled={isProcessing}>
        {isProcessing ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
};

export default PaymentForm;