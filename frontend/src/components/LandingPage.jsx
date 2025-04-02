import React from "react";
import { useNavigate } from "react-router-dom";
import batmanlogosvg from "../assets/batmanlogosvg.svg";
import { auth } from "../firebase";
import { FaParking, FaClock, FaMapMarkerAlt, FaShieldAlt, FaMobileAlt, FaUserShield } from "react-icons/fa";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleEnterClick = () => {
    auth.currentUser ? navigate("/dashboard") : navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#F9FAFB] to-[#feecec]">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-[#C94B4B]/10 rounded-full -top-20 -left-20 animate-pulse opacity-30"></div>
        <div className="absolute w-72 h-72 bg-[#C94B4B]/15 rounded-full -bottom-20 -right-20 animate-pulse opacity-40"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <img
            src={batmanlogosvg}
            alt="Batman Logo"
            className="w-48 h-40 mx-auto mb-8 filter saturate-110 contrast-125 animate-float"
          />

          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-[#C94B4B] to-[#b33737] bg-clip-text text-transparent">
            Gotham Parking
          </h1>
          <p className="text-xl text-[#4B5563]/90 font-medium mb-8">
            Smart Parking Solutions for Modern Cities
          </p>
<button
          className="px-8 py-4 bg-[#C94B4B] text-white font-semibold rounded-xl
          hover:bg-[#C94B4B]/90 transition-all duration-300 shadow-md
          hover:scale-105 hover:shadow-lg active:scale-95 mb-4"
          onClick={handleEnterClick}
        >
<<<<<<< HEAD
          Enter the Batcave
=======
          User Login
>>>>>>> 3e639149d5a0d7301e391b32ebe172c42c42afc8
        </button>

        {/* Centered Admin Login Button with matching hover effect */}
        <div className="w-full flex justify-center mb-4">
          <button
            onClick={() => navigate("/admin-login")}
            className="px-8 py-3 bg-transparent text-[#4B5563] font-medium rounded-xl
            border border-[#4B5563] hover:bg-[#F9FAFB] transition-all duration-300
            flex items-center justify-center hover:scale-105 hover:shadow-lg active:scale-95"
          >
            <FaUserShield className="mr-2" />
            Admin Login
          </button>
        </div>

{/* Feature Grid - Adjusted margin-top */}
<div className="grid md:grid-cols-3 gap-8 mt-4 mb-20">  {/* Added mt-4 here */}
  {/* ... feature cards content remains the same ... */}
</div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="feature-card p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
              <FaParking className="text-4xl text-[#C94B4B] mb-4 mx-auto" />
              <h3 className="text-xl font-bold mb-2">Real-Time Availability</h3>
              <p className="text-[#4B5563]">Check parking spot availability in real-time across Gotham City</p>
            </div>

            <div className="feature-card p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
              <FaClock className="text-4xl text-[#C94B4B] mb-4 mx-auto" />
              <h3 className="text-xl font-bold mb-2">Instant Reservations</h3>
              <p className="text-[#4B5563]">Book your parking spot in advance with our mobile app</p>
            </div>

            <div className="feature-card p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow">
              <FaMapMarkerAlt className="text-4xl text-[#C94B4B] mb-4 mx-auto" />
              <h3 className="text-xl font-bold mb-2">Smart Navigation</h3>
              <p className="text-[#4B5563]">Turn-by-turn navigation to your reserved parking spot</p>
            </div>
          </div>

          {/* Video Demo Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-8 text-[#1F2937]">How It Works</h2>
            <div className="aspect-video bg-gray-100 rounded-2xl shadow-xl overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="play-button bg-[#C94B4B] p-6 rounded-full hover:bg-[#b33737] transition-colors">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="stat-card text-center p-6">
              <div className="text-4xl font-bold text-[#C94B4B] mb-2">24/7</div>
              <div className="text-[#4B5563]">Security Monitoring</div>
            </div>
            <div className="stat-card text-center p-6">
              <div className="text-4xl font-bold text-[#C94B4B] mb-2">Parking Spots</div>
              <div className="text-[#4B5563]">Across City</div>
            </div>
            <div className="stat-card text-center p-6">
              <div className="text-4xl font-bold text-[#C94B4B] mb-2">100%</div>
              <div className="text-[#4B5563]">Customer Satisfaction</div>
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <div className="p-8 bg-white rounded-2xl shadow-lg">
              <FaShieldAlt className="text-4xl text-[#C94B4B] mb-4" />
              <h3 className="text-2xl font-bold mb-4">Secure & Protected</h3>
              <p className="text-[#4B5563] mb-4">
                24/7 surveillance and regular security patrols ensure your vehicle s safety
              </p>
            </div>
            
            <div className="p-8 bg-white rounded-2xl shadow-lg">
              <FaMobileAlt className="text-4xl text-[#C94B4B] mb-4" />
              <h3 className="text-2xl font-bold mb-4">Mobile App Integration</h3>
              <p className="text-[#4B5563] mb-4">
                Manage bookings, extend parking time, and receive notifications through our mobile app
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-[#1F2937] text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-4">&copy; 2025 ParkGrid. All rights reserved.</p>
          <div className="flex justify-center space-x-6">
            <a href="#privacy" className="hover:text-[#C94B4B] transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-[#C94B4B] transition-colors">Terms of Service</a>
            <a href="#contact" className="hover:text-[#C94B4B] transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;