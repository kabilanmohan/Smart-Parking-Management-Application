import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  updateDoc,
} from "firebase/firestore";
import PropTypes from 'prop-types';
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";

// Parking slot availability update function remains unchanged
const updateParkingSlotAvailability = async (parkingSpaceId, selectedSlot, bookingId, checkoutTime) => {
  const { level, row, col } = selectedSlot;
  
  // Get the ParkingSlots document
  const parkingSlotsRef = doc(db, "ParkingSlots", parkingSpaceId);
  const parkingSlotsDoc = await getDoc(parkingSlotsRef);
  
  if (parkingSlotsDoc.exists()) {
    const parkingSlotsData = parkingSlotsDoc.data();
    
    // Make sure the required paths exist in the data
    if (parkingSlotsData.levels && 
        parkingSlotsData.levels[level] && 
        parkingSlotsData.levels[level].availability) {
      
      // Find the row in availability data
      const availabilityRow = parkingSlotsData.levels[level].availability.find(
        r => r.rows === row
      );
      
      if (availabilityRow && availabilityRow.cols && availabilityRow.cols[col]) {
        // Create a deep copy of the data
        const updatedData = JSON.parse(JSON.stringify(parkingSlotsData));
        
        // Update the isOccupied status and add booking reference
        updatedData.levels[level].availability.find(r => r.rows === row).cols[col] = {
          ...availabilityRow.cols[col],
          isOccupied: true,
          bookingId: bookingId,
          checkoutTime: checkoutTime.toISOString()
        };
        
        // Update the document in Firestore
        await updateDoc(parkingSlotsRef, updatedData);
      }
    }
  }

  // Also update the ParkingSpaces document to decrease available slots count
  try {
    const parkingSpaceRef = doc(db, "ParkingSpaces", parkingSpaceId);
    const parkingSpaceDoc = await getDoc(parkingSpaceRef);
    
    if (parkingSpaceDoc.exists()) {
      const spaceData = parkingSpaceDoc.data();
      const availableSlots = Math.max((spaceData.AvailableSlots || 0) - 1, 0);
      
      await updateDoc(parkingSpaceRef, {
        AvailableSlots: availableSlots,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error updating available slots count:", error);
  }
};

const PaymentForm = ({ onPaymentSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const parkingData = location.state || {};
  
  const [discountCode, setDiscountCode] = useState("");
  const [amount, setAmount] = useState(parkingData.totalPrice || 50);
  const [finalAmount, setFinalAmount] = useState(parkingData.totalPrice || 50);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUpiForm, setShowUpiForm] = useState(false);
  const [upiId, setUpiId] = useState("");
  
  const [{ isPending }] = usePayPalScriptReducer();

  // Update the amount if parkingData changes
  useEffect(() => {
    if (parkingData.totalPrice) {
      setAmount(parkingData.totalPrice);
      setFinalAmount(parkingData.totalPrice);
    }
  }, [parkingData.totalPrice]);

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

  const processBooking = async (paymentDetails) => {
    try {
      // Current user
      const currentUser = auth.currentUser;
      
      // Current time for booking
      const now = new Date();
      
      // Calculate checkout time based on hours booked
      const checkoutTime = new Date(now);
      checkoutTime.setHours(checkoutTime.getHours() + (parkingData.hours || 1));
      
      // Create transaction record
      const transaction = {
        userId: currentUser ? currentUser.uid : 'anonymous',
        name: parkingData.parkingSpaceName || "Unknown",
        amount: paymentDetails.amount,
        date: now,
        vehicleType: parkingData.vehicleType || "Car",
        spotNumber: parkingData.spotNumber || "Unknown",
        location: parkingData.parkingSpaceName || "Unknown location",
        status: "completed",
        duration: `${parkingData.hours || 1} hours`,
        paymentMethod: paymentDetails.paymentMethod,
        transactionId: paymentDetails.transactionId,
        payerEmail: paymentDetails.payerEmail
      };

      // Add transaction to Firestore
      const transactionRef = await addDoc(collection(db, "transactions"), transaction);
      
      // Create booking record
      const booking = {
        userId: currentUser ? currentUser.uid : 'anonymous',
        userEmail: currentUser ? currentUser.email : 'anonymous',
        parkingSpaceId: parkingData.parkingSpaceId,
        parkingSpaceName: parkingData.parkingSpaceName,
        spotNumber: parkingData.spotNumber,
        vehicleType: parkingData.vehicleType,
        transactionId: transactionRef.id,
        amount: paymentDetails.amount,
        hours: parkingData.hours || 1,
        status: "active",
        checkinTime: now,
        checkoutTime: checkoutTime,
        createdAt: serverTimestamp(),
        slotDetails: parkingData.selectedSlot || {},
        parkingLevel: parkingData.selectedSlot?.level || 1
      };
      
      // Add booking to Firestore
      const bookingRef = await addDoc(collection(db, "bookings"), booking);
      
      // Update parking slot availability
      if (parkingData.parkingSpaceId && parkingData.selectedSlot) {
        await updateParkingSlotAvailability(parkingData.parkingSpaceId, parkingData.selectedSlot, bookingRef.id, checkoutTime);
      }
      
      // Call success callback
      onPaymentSuccess(transaction);
      
      // Show success message
      alert("Payment Successful! Your booking has been confirmed.");
      
      // Reset form and redirect
      setDiscountCode("");
      navigate("/dashboard");
      
      return true;
    } catch (error) {
      console.error("Error processing booking:", error);
      setError("Booking creation failed. Please try again.");
      return false;
    }
  };

  const handlePayPalApproval = async (data, actions) => {
    try {
      const details = await actions.order.capture();
      console.log("PayPal payment completed", details);
      
      // Process the booking with PayPal payment details
      const paymentDetails = {
        paymentMethod: "PayPal",
        transactionId: details.id,
        payerEmail: details.payer.email_address,
        amount: finalAmount,
        status: "completed"
      };

      await processBooking(paymentDetails);
      
      return true;
    } catch (error) {
      console.error("PayPal payment error:", error);
      setError("PayPal payment failed. Please try again.");
      return false;
    }
  };

  // Handle UPI Payment (dummy implementation)
  const handleUpiPayment = async (e) => {
    e.preventDefault();
    
    if (!upiId) {
      setError("Please enter a UPI ID");
      return;
    }
    
    // Validate UPI ID format (basic validation)
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(upiId)) {
      setError("Invalid UPI ID format. Please use format: username@bank");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful payment
      const paymentDetails = {
        paymentMethod: "UPI (PayU)",
        transactionId: "UPI" + Date.now().toString(),
        payerEmail: upiId,
        amount: finalAmount,
        status: "completed"
      };
      
      await processBooking(paymentDetails);
      setShowUpiForm(false);
      setUpiId("");
    } catch (error) {
      console.error("UPI payment error:", error);
      setError("UPI payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-auto border border-[#E5E7EB] hover:shadow-2xl transition-shadow duration-300">
      <h2 className="text-2xl font-bold text-center mb-6 text-[#1F2937] relative">
        <span className="relative after:content-[''] after:absolute after:-bottom-2 after:left-1/4 after:w-1/2 after:h-1 after:bg-[#3B82F6] after:rounded-full">Payment Details</span>
      </h2>
      
      {/* Parking summary section */}
      {parkingData.parkingSpaceName && (
        <div className="mb-6 p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
          <h3 className="font-medium text-[#1F2937] mb-2">Booking Details</h3>
          <p className="text-sm text-[#4B5563]"><span className="font-medium">Parking:</span> {parkingData.parkingSpaceName}</p>
          <p className="text-sm text-[#4B5563]"><span className="font-medium">Spot:</span> {parkingData.spotNumber}</p>
          <p className="text-sm text-[#4B5563]"><span className="font-medium">Vehicle:</span> {parkingData.vehicleType}</p>
          <p className="text-sm text-[#4B5563]"><span className="font-medium">Duration:</span> {parkingData.hours} hour{parkingData.hours !== 1 ? 's' : ''}</p>
          <p className="text-sm font-bold text-[#1F2937] mt-2">Total: ₹{parkingData.totalPrice?.toFixed(2)}</p>
        </div>
      )}

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

      {/* Payment Methods */}
      <div className="mb-6">
        <p className="block font-medium mb-3 text-[#1F2937]">Select Payment Method</p>
        
        {/* PayPal Payment Option */}
        {isPending ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
            <p className="ml-2">Loading PayPal...</p>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-sm mb-2 text-[#4B5563] font-medium">Pay with PayPal</p>
            <div className="border border-[#E5E7EB] rounded-md p-4">
              <PayPalButtons
                style={{ 
                  color: "gold", 
                  shape: "rect", 
                  label: "pay", 
                  height: 50 
                }}
                createOrder={(data, actions) => {
                  return actions.order.create({
                    purchase_units: [{
                      description: `Parking at ${parkingData.parkingSpaceName || "Unknown location"}`,
                      amount: {
                        currency_code: "USD",
                        value: finalAmount.toFixed(2)
                      }
                    }]
                  });
                }}
                onApprove={handlePayPalApproval}
                onError={(err) => {
                  console.error("PayPal error:", err);
                  setError("PayPal encountered an error. Please try again.");
                }}
              />
              <p className="text-center text-[#6B7280] text-xs mt-2">
                Credit/Debit cards accepted via PayPal
              </p>
            </div>
          </div>
        )}

        {/* UPI Payment Option */}
        <div className="mt-4">
          <p className="text-sm mb-2 text-[#4B5563] font-medium">Pay with UPI</p>
          <div className="border border-[#E5E7EB] rounded-md p-4">
            {showUpiForm ? (
              <form onSubmit={handleUpiPayment}>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1 text-[#1F2937]">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="yourname@bankname"
                    className="w-full p-3 rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#DBEAFE] focus:border-[#3B82F6]"
                    disabled={isProcessing}
                    required
                  />
                  <p className="text-xs text-[#6B7280] mt-1">Format: username@bankname (e.g. john@okaxis)</p>
                </div>
                <div className="flex justify-between gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowUpiForm(false)}
                    className="flex-1 py-2 px-4 border border-[#E5E7EB] rounded-md text-[#4B5563] hover:bg-[#F9FAFB]"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2 px-4 bg-[#10B981] hover:bg-[#059669] text-white rounded-md flex justify-center items-center"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Pay Now'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setShowUpiForm(true)}
                className="w-full py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-md flex justify-center items-center"
              >
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" 
                  alt="UPI logo" 
                  className="h-6 w-auto mr-2"
                />
                Pay with UPI via PayU
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Payment Summary */}
      <div className="mt-8 p-5 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] shadow-inner">
        <h3 className="text-lg font-medium mb-3 text-[#1F2937] flex items-center">
          <svg xmlns="https://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Payment Summary
        </h3>
        <div className="flex justify-between items-center mt-2 pb-2 border-b border-[#E5E7EB]">
          <span className="text-[#4B5563]">Base Amount:</span>
          <span className="font-medium text-[#1F2937]">₹{amount.toFixed(2)}</span>
        </div>
        {amount !== finalAmount && (
          <div className="flex justify-between items-center mt-2 pb-2 border-b border-[#E5E7EB] text-[#10B981]">
            <span>Discount:</span>
            <span>-₹{(amount - finalAmount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center mt-3 pt-2">
          <span className="text-[#1F2937] font-medium">Total Amount:</span>
          <span className="font-bold text-xl text-[#1F2937]">₹{finalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-6 text-center text-[#4B5563] text-sm flex items-center justify-center">
        <svg xmlns="https://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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