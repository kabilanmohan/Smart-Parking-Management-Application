import { useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import PaymentSummary from "./PaymentSummary";
import PropTypes from 'prop-types';

const PaymentForm = ({ onPaymentSuccess }) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [amount, setAmount] = useState(50);
  const [finalAmount, setFinalAmount] = useState(50);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const applyDiscount = async () => {
    if (!discountCode) return 0;

    try {
      const q = query(collection(db, "discounts"), where("code", "==", discountCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Invalid discount code.");
        return 0;
      }

      const discountDoc = querySnapshot.docs[0].data();
      const discountValue = discountDoc.discount;

      if (typeof discountValue !== 'number') {
        setError("Invalid discount value in database.");
        return 0;
      }

      const discountAmount = (amount * discountValue) / 100;
      const newFinalAmount = Math.max(amount - discountAmount, 0);
      setFinalAmount(newFinalAmount);
      setError("");
      return discountAmount;
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
    const newFinalAmount = Math.max(amount - discount, 0);
    setFinalAmount(newFinalAmount);

    const transaction = {
      name,
      cardNumber: `**** **** **** ${cardNumber.replace(/\s/g, "").slice(-4)}`,
      amount: newFinalAmount,
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
    setFinalAmount(50);
    setError("");
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-auto font-['Proxima Nova', 'Roboto', sans-serif] border border-[#E5E7EB] hover:shadow-2xl transition-shadow duration-300">
      <h2 className="text-2xl font-bold text-center mb-6 text-[#1F2937] relative">
        <span className="relative after:content-[''] after:absolute after:-bottom-2 after:left-1/4 after:w-1/2 after:h-1 after:bg-[#3B82F6] after:rounded-full">Payment Details</span>
      </h2>

      {/* Card Number Input */}
      <div className="mb-6">
        <label className="block font-medium mb-2 text-[#1F2937]">Card Number 💳</label>
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
          className="w-full p-3 rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#DBEAFE] focus:border-[#3B82F6] text-[#1F2937] shadow-sm hover:shadow-md transition-shadow"
        />
      </div>

      {/* Expiry Date Input */}
      <div className="mb-6">
        <label className="block font-medium mb-2 text-[#1F2937]">Expiry Date 📅</label>
        <input
          type="month"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          min={`${new Date().getFullYear()}-01`}
          max={`${new Date().getFullYear() + 10}-12`}
          className="w-full p-3 rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#DBEAFE] focus:border-[#3B82F6] text-[#1F2937] shadow-sm hover:shadow-md transition-shadow"
        />
      </div>

      {/* CVV Input */}
      <div className="mb-6">
        <label className="block font-medium mb-2 text-[#1F2937]">CVV 🔒</label>
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
          className="w-full p-3 rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#DBEAFE] focus:border-[#3B82F6] text-[#1F2937] shadow-sm hover:shadow-md transition-shadow"
        />
      </div>

      {/* Cardholder Name Input */}
      <div className="mb-6">
        <label className="block font-medium mb-2 text-[#1F2937]">Cardholder Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alice Bob"
          className="w-full p-3 rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#DBEAFE] focus:border-[#3B82F6] text-[#1F2937] shadow-sm hover:shadow-md transition-shadow"
        />
      </div>

      {/* Discount Code Input */}
      <div className="mb-6">
        <label className="block font-medium mb-2 text-[#1F2937]">Discount Code (Optional)</label>
        <div className="flex shadow-sm hover:shadow-md transition-shadow">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="DISCOUNT50"
            className="flex-grow p-3 rounded-l-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#DBEAFE] focus:border-[#3B82F6] text-[#1F2937]"
          />
          <button
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-3 rounded-r-md transition-colors shadow-sm font-medium hover:shadow-md"
            onClick={applyDiscount}
          >
            Apply
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-[#FEF2F2] border border-[#EF4444] rounded-md text-[#EF4444] shadow-md">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </div>
      )}

      {/* Pay Now Button */}
      <button
        className="w-full bg-[#C94B4B] hover:bg-[#B83E3E] text-white font-bold py-4 rounded-md transition-all duration-300 transform hover:translate-y-[-2px] shadow-lg hover:shadow-xl active:translate-y-0 active:shadow-md"
        onClick={handlePayment}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </div>
        ) : (
          "Pay Now"
        )}
      </button>

      {/* Payment Summary */}
      <div className="mt-8 p-5 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] shadow-inner">
        <h3 className="text-lg font-medium mb-3 text-[#1F2937] flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Payment Summary
        </h3>
        <div className="flex justify-between items-center mt-2 pb-2 border-b border-[#E5E7EB]">
          <span className="text-[#4B5563]">Base Amount:</span>
          <span className="font-medium text-[#1F2937]">${amount.toFixed(2)}</span>
        </div>
        {amount !== finalAmount && (
          <div className="flex justify-between items-center mt-2 pb-2 border-b border-[#E5E7EB] text-[#10B981]">
            <span>Discount:</span>
            <span>-${(amount - finalAmount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center mt-3 pt-2">
          <span className="text-[#1F2937] font-medium">Total Amount:</span>
          <span className="font-bold text-xl text-[#1F2937]">${finalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-6 text-center text-[#4B5563] text-sm flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Secured by 256-bit encryption
      </div>
    </div>
  );
};

PaymentForm.propTypes = {
  onPaymentSuccess: PropTypes.func.isRequired,
};

export default PaymentForm;