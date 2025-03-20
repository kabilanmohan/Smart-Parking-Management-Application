import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import batmanParkingImage from "../assets/batman-parking2.jpeg";
import { FaGoogle, FaApple, FaFacebook, FaUser, FaPhone, FaCar, FaCogs, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaParking, FaCarSide, FaCarAlt, FaMapMarkerAlt, FaArrowLeft } from "react-icons/fa";
import { db, doc, setDoc, getDoc, updateDoc } from "../firebase";

const Auth = () => {
  const navigate = useNavigate(); // Initialize navigate
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    name: '',
    phoneNumber: '',
    vehicleNumber: '',
    vehicleType: 'car',
  });
  const [message, setMessage] = useState('');

  // Add function to handle back navigation
  const handleBackToLanding = () => {
    navigate('/');
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle form submission with Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        setMessage("Login successful! Redirecting...");
      } else {
        // Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );
        
        // Create a user document in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber || '',
          vehicleNumber: formData.vehicleNumber || '',
          vehicleType: formData.vehicleType || 'car',
          role: 'customer', // Default role for new users
          createdAt: new Date(),
          paymentMethods: [],
          favoriteSpots: [],
          bookingHistory: [],
          notificationPreferences: {
            email: true,
            push: true,
          }
        });
        
        setMessage("Account created successfully! Redirecting...");
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error:", error);
      setMessage(error.message);
    }
  };

  // Handle Google sign-in
// Update the handleGoogleSignIn function
const handleGoogleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if this is a new user
    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);
    
    if (userSnap.exists()) {
      // If user already exists, just update lastLogin
      await updateDoc(userDocRef, {
        lastLogin: new Date(),
      });
    } else {
      // Only create a new document if user doesn't exist
      await setDoc(userDocRef, {
        name: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        profileImageUrl: user.photoURL || '',
        role: 'customer',
        createdAt: new Date(),
        lastLogin: new Date(),
        vehicleNumber: '',
        vehicleType: 'car',
        paymentMethods: [],
        favoriteSpots: [],
        bookingHistory: [],
        notificationPreferences: {
          email: true,
          push: true,
        }
      });
    }
    
    setMessage("Google sign-in successful! Redirecting...");
    setTimeout(() => setMessage(''), 3000);
  } catch (error) {
    console.error("Error during Google Sign-In:", error);
    setMessage(error.message);
  }
};

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!formData.email) {
      setMessage("Please enter your email address.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back button to landing page */}
      <button 
        onClick={handleBackToLanding}
        className="absolute top-6 left-6 z-20 flex items-center text-[#1F2937] hover:text-[#C94B4B] transition-colors bg-white/80 px-4 py-2 rounded-lg shadow-md hover:shadow-lg"
      >
        <FaArrowLeft className="mr-2" />
        <span>Back to Home</span>
      </button>

      {/* Background Design Elements */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#ffffff] to-[#C94B4B] opacity-30 blur-2xl"></div>
      <div className="absolute top-1/2 -translate-y-1/2 left-10 text-[#E5E7EB] opacity-10">
        <FaParking className="w-24 h-24 mb-10" />
        <FaCarSide className="w-16 h-16 mb-10 ml-16" />
        <FaMapMarkerAlt className="w-12 h-12 ml-8" />
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-10 text-[#E5E7EB] opacity-10">
        <FaCarAlt className="w-16 h-16 mb-10 mr-12" />
        <FaParking className="w-20 h-20 mb-10" />
        <FaMapMarkerAlt className="w-12 h-12 mr-8" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1200px] h-auto md:h-[85vh] flex flex-col md:flex-row shadow-2xl rounded-2xl overflow-hidden bg-white relative z-10">
        {/* Left Hero Section */}
        <div className="hidden md:block md:w-1/2 relative overflow-hidden">
          <img
            src={batmanParkingImage}
            alt="Smart Parking"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1F2937]/90 to-transparent p-12 flex flex-col justify-between">
            <div className="text-white">
              <h1 className="text-4xl font-extrabold mb-4">VINTAGE PARKING</h1>
              <p className="text-xl text-gray-300 font-light">Smart Parking Solutions</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center text-white opacity-90">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <FaMapMarkerAlt className="w-4 h-4" />
                </div>
                <p>Find the perfect spot in seconds</p>
              </div>
              <div className="flex items-center text-white opacity-90">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <FaCarAlt className="w-4 h-4" />
                </div>
                <p>Secure parking for your vehicle</p>
              </div>
              <div className="flex items-center text-white opacity-90">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <FaCogs className="w-4 h-4" />
                </div>
                <p>Smart management system</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Auth Section */}
        <div className="w-full md:w-1/2 bg-white p-6 md:p-10 flex flex-col justify-center">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-[#1F2937] mb-2">Welcome to Vintage Parking</h2>
            <p className="text-[#4B5563]">Access the future of smart parking solutions</p>
          </div>

          <div className="mb-8 flex justify-center">
            <div className="bg-[#F9FAFB] rounded-full p-1 shadow-sm">
              <button
                className={`px-6 py-2 rounded-full transition-all duration-300 ${isLogin ? 'bg-[#C94B4B] text-white' : 'text-[#4B5563]'}`}
                onClick={() => setIsLogin(true)}
              >
                Sign In
              </button>
              <button
                className={`px-6 py-2 rounded-full transition-all duration-300 ${!isLogin ? 'bg-[#C94B4B] text-white' : 'text-[#4B5563]'}`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>
          </div>

          <div className="max-w-md mx-auto w-full"> {/* Make form area narrower */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#4B5563]" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-[#F9FAFB] text-[#1F2937] px-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C94B4B] border border-[#E5E7EB]"
                      placeholder="Full Name"
                      required
                    />
                  </div>
                  
                  <div className="relative">
                    <FaPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#4B5563]" />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full bg-[#F9FAFB] text-[#1F2937] px-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C94B4B] border border-[#E5E7EB]"
                      placeholder="Phone Number"
                    />
                  </div>
                  
                  <div className="relative">
                    <FaCar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#4B5563]" />
                    <input
                      type="text"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleInputChange}
                      className="w-full bg-[#F9FAFB] text-[#1F2937] px-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C94B4B] border border-[#E5E7EB]"
                      placeholder="Vehicle Number (e.g., ABC-123)"
                    />
                  </div>
                  
                  <div className="relative">
                    <FaCogs className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#4B5563]" />
                    <select
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleInputChange}
                      className="w-full bg-[#F9FAFB] text-[#1F2937] px-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C94B4B] border border-[#E5E7EB] appearance-none"
                    >
                      <option value="car">Car</option>
                      <option value="bike">Motorcycle/Scooter</option>
                      <option value="van">Van/SUV</option>
                    </select>
                  </div>
                </>
              )}

              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#4B5563]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-[#F9FAFB] text-[#1F2937] px-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C94B4B] border border-[#E5E7EB]"
                  placeholder="Email Address"
                  required
                />
              </div>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#4B5563]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-[#F9FAFB] text-[#1F2937] px-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C94B4B] border border-[#E5E7EB]"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#4B5563] hover:text-[#C94B4B] transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {isLogin && (
                <div className="flex items-center justify-between text-[#4B5563]">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-[#E5E7EB] text-[#C94B4B] focus:ring-[#C94B4B]"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[#C94B4B] hover:text-[#C94B4B]/80 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-[#C94B4B] hover:bg-[#C94B4B]/90 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
              <div className="relative text-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E5E7EB]"></div>
                </div>
                <span className="relative px-4 bg-white text-[#4B5563]">Or continue with</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex items-center justify-center space-x-2 bg-[#F9FAFB] text-[#1F2937] py-2 rounded-lg hover:bg-[#DBEAFE] transition-colors border border-[#E5E7EB]"
                >
                  <FaGoogle className="text-[#C94B4B]" />
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center space-x-2 bg-[#F9FAFB] text-[#1F2937] py-2 rounded-lg hover:bg-[#DBEAFE] transition-colors border border-[#E5E7EB]"
                >
                  <FaApple className="text-[#1F2937]" />
                  <span>Apple</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center space-x-2 bg-[#F9FAFB] text-[#1F2937] py-2 rounded-lg hover:bg-[#DBEAFE] transition-colors border border-[#E5E7EB]"
                >
                  <FaFacebook className="text-[#3B82F6]" />
                  <span>Facebook</span>
                </button>
              </div>
            </form>
            {message && (
              <div className={`mt-4 p-3 rounded-lg ${
                message.includes('success') ? 'bg-[#D1FAE5] text-[#10B981]' : 'bg-[#FEE2E2] text-[#EF4444]'
              }`}>
                <p className="text-center text-sm">{message}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-[#4B5563] text-sm">
            <p>&copy; 2025 Vintage Parking. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;