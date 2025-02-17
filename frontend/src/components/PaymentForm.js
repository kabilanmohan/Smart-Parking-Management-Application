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

  // Calculate the current year and 10 years in the future
  const currentYear = new Date().getFullYear();
  const minDate = `${currentYear}-01`; // January of the current year
  const maxDate = `${currentYear + 10}-12`; // December of 10 years from now

  const handleCardNumberChange = (e) => {
    const sanitizedValue = e.target.value.replace(/\D/g, ""); // Remove non-numeric characters
    let formattedValue = "";

    // Add a space after every 4 digits
    for (let i = 0; i < sanitizedValue.length; i += 4) {
      if (i > 0) formattedValue += " "; // Add a space before each group of 4 digits
      formattedValue += sanitizedValue.substring(i, i + 4);
    }

    // Limit the total length to 19 characters (16 digits + 3 spaces)
    if (formattedValue.length <= 19) {
      setCardNumber(formattedValue);
    }
  };

  const validateInputs = () => {
    const numericCardNumber = cardNumber.replace(/\s/g, ""); // Remove spaces for validation

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

    setError(""); // Clear any previous errors
    return true;
  };

  const applyDiscount = async () => {
    if (!discountCode) return;

    const q = query(collection(db, "discounts"), where("code", "==", discountCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      setError("Invalid discount code.");
      return;
    }

    const discountData = querySnapshot.docs[0].data();
    setAmount(amount - discountData.discount);
  };

  const handlePayment = async () => {
    if (!validateInputs()) return;

    if (discountCode) {
      await applyDiscount();
    }

    // Simulate payment processing
    const transaction = {
      name,
      cardNumber: `**** **** **** ${cardNumber.replace(/\s/g, "").slice(-4)}`, // Format last 4 digits
      amount,
      date: new Date().toLocaleString(),
    };

    // Save transaction to Firebase
    await addDoc(collection(db, "transactions"), transaction);

    // Notify parent component
    onPaymentSuccess(transaction);

    alert("Payment Successful!");
    resetForm();
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
    <div className="payment-form">
      <h2>Payment Details</h2>
      <div className="form-group">
        <label>Card Number</label>
        <input
          type="text"
          value={cardNumber}
          onChange={handleCardNumberChange}
          placeholder="Enter card number"
        />
        <i className="icon">💳</i>
      </div>
      <div className="form-group">
        <label>Expiry Date</label>
        <input
          type="month"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          min={minDate} // Set minimum date to current year
          max={maxDate} // Set maximum date to 10 years in the future
        />
        <i className="icon">📅</i>
      </div>
      <div className="form-group">
        <label>CVV</label>
        <input
          type="text"
          value={cvv}
          onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))} // Sanitize CVV
          placeholder="Enter CVV"
        />
        <i className="icon">🔒</i>
      </div>
      <div className="form-group">
        <label>Cardholder Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter cardholder name"
        />
      </div>
      <div className="form-group">
        <label>Discount Code (Optional)</label>
        <input
          type="text"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          placeholder="Enter discount code"
        />
      </div>
      {error && <p className="error">{error}</p>}
      <button onClick={handlePayment}>Pay Now</button>
    </div>
  );
};

export default PaymentForm;