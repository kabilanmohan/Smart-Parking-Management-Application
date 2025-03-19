import { useState } from "react";
import { FaCarAlt, FaCreditCard, FaHistory, FaShieldAlt } from "react-icons/fa";
import PaymentForm from "./components/PaymentForm";

function App2() {
  const [activeTab, setActiveTab] = useState("payment");

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1F2937] font-['Proxima Nova', 'Roboto', sans-serif] flex flex-col">
      {/* Navigation Bar */}
      <nav className="sticky top-0 bg-white shadow-md py-4 border-b border-[#E5E7EB] z-10">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="flex items-center">
            <FaCarAlt className="text-[#C94B4B] text-2xl mr-2" />
            <div className="text-xl font-bold text-[#1F2937]">
              Smart <span className="text-[#C94B4B]">Parking</span> System
            </div>
          </div>
          <div className="flex gap-5">
            <a 
              href="#payment" 
              onClick={() => setActiveTab("payment")}
              className={`flex items-center transition-colors font-medium px-3 py-2 rounded-md ${
                activeTab === "payment" 
                  ? "bg-[#DBEAFE] text-[#3B82F6]" 
                  : "text-[#4B5563] hover:text-[#3B82F6] hover:bg-[#F3F4F6]"
              }`}
            >
              <FaCreditCard className="mr-2" />
              Payment
            </a>
            <a 
              href="/payment-history" 
              className="flex items-center transition-colors font-medium px-3 py-2 rounded-md text-[#4B5563] hover:text-[#3B82F6] hover:bg-[#F3F4F6]"
            >
              <FaHistory className="mr-2" />
              History
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10 flex-1">
        <section id="payment" className="mb-12">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 mb-6 border border-[#E5E7EB]">
            <h1 className="text-2xl font-bold mb-2 text-center text-[#1F2937] flex items-center justify-center">
              <FaCreditCard className="text-[#3B82F6] mr-2" />
              Make a Payment
            </h1>
            <p className="text-[#4B5563] text-center mb-6">
              Complete your parking payment securely and easily
            </p>
            <div className="max-w-md mx-auto">
              <PaymentForm
                onPaymentSuccess={() => {
                  window.location.href = "/payment-history";
                }}
              />
            </div>
          </div>

          {/* Security Info Card */}
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="p-6 md:w-1/2">
                <h3 className="text-xl font-bold text-[#1F2937] mb-2 flex items-center">
                  <FaShieldAlt className="text-[#3B82F6] mr-2" />
                  Secure Payments
                </h3>
                <p className="text-[#4B5563] leading-relaxed">
                  Your payment information is encrypted and securely processed. We use industry-standard 
                  security measures to protect your data.
                </p>
              </div>
              <div className="p-6 bg-[#DBEAFE] md:w-1/2 flex flex-col justify-center">
                <h4 className="font-bold text-[#1F2937] mb-2">We Accept</h4>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-white px-3 py-1 rounded shadow-sm text-sm">Visa</div>
                  <div className="bg-white px-3 py-1 rounded shadow-sm text-sm">Mastercard</div>
                  <div className="bg-white px-3 py-1 rounded shadow-sm text-sm">American Express</div>
                  <div className="bg-white px-3 py-1 rounded shadow-sm text-sm">Discover</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <FaCarAlt className="text-[#C94B4B] text-xl mr-2" />
              <span className="font-semibold text-[#1F2937]">
                Smart Parking Management System
              </span>
            </div>
            <div className="text-[#4B5563] text-sm">
              © {new Date().getFullYear()} All rights reserved
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App2; 