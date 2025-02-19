import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import batmanParkingImage from "../assets/batman-parking2.jpeg";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    name: '',
  });
  const [message, setMessage] = useState('');

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        setMessage("Login successful! Redirecting...");
      } else {
        await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        setMessage("Account created! Redirecting...");
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.message);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setMessage("Google sign-in successful! Redirecting...");
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
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
    <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-4">
      {/* Main Container */}
      <div className="w-full max-w-[1440px] h-[90vh] flex shadow-2xl rounded-2xl overflow-hidden">
        {/* Left Hero Section */}
          <div className="hidden md:block w-1/2 relative overflow-hidden">
            <img
              src={batmanParkingImage}
              alt="Smart Parking"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F1C]/80 to-transparent p-12 flex flex-col justify-between">
              <div className="text-white">
                <h1 className="text-4xl font-extrabold mb-4">GOTHAM PARKING</h1>
                <p className="text-xl text-gray-300 font-light">The Dark Knight&apos;s Parking Solution</p>
              </div>
              {/* <div className="space-y-3">
                <div className="flex items-center space-x-4 text-white">
            <i className="fas fa-shield-alt text-2xl text-[#00F0FF]"></i>
            <div>
              <h3 className="text-xl font-semibold">Secure Access</h3>
              <p className="text-gray-300">Advanced encryption for your safety</p>
            </div>
                </div>
                <div className="flex items-center space-x-4 text-white">
            <i className="fas fa-mobile-alt text-2xl text-[#00F0FF]"></i>
            <div>
              <h3 className="text-xl font-semibold">Smart Control</h3>
              <p className="text-gray-300">Manage parking from your phone</p>
            </div>
                </div>
                <div className="flex items-center space-x-4 text-white">
            <i className="fas fa-clock text-2xl text-[#00F0FF]"></i>
            <div>
              <h3 className="text-xl font-semibold">Real-time Updates</h3>
              <p className="text-gray-300">Instant notifications and status</p>
            </div>
                </div>
              </div> */}
          </div>
        </div>

        {/* Right Auth Section */}
        <div className="w-full md:w-1/2 bg-[#0A0F1C] p-6 md:p-12 flex flex-col justify-center">
          <div className="mb-8 flex justify-center">
            <div className="bg-[#1A1F2C] rounded-full p-1">
              <button
                className={`px-6 py-2 rounded-full transition-all duration-300 ${isLogin ? 'bg-[#2E6FFF] text-white' : 'text-gray-400'}`}
                onClick={() => setIsLogin(true)}
              >
                Sign In
              </button>
              <button
                className={`px-6 py-2 rounded-full transition-all duration-300 ${!isLogin ? 'bg-[#2E6FFF] text-white' : 'text-gray-400'}`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-[#1A1F2C] text-white px-12 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E6FFF] transition-all"
                  placeholder="Full Name"
                  required
                />
                <i className="fas fa-user absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
            )}

            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-[#1A1F2C] text-white px-12 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E6FFF] transition-all"
                placeholder="Email Address"
                required
              />
              <i className="fas fa-envelope absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full bg-[#1A1F2C] text-white px-12 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E6FFF] transition-all"
                placeholder="Password"
                required
              />
              <i className="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {isLogin && (
              <div className="flex items-center justify-between text-gray-400">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-600 text-[#2E6FFF] focus:ring-[#2E6FFF]"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[#2E6FFF] hover:text-[#00F0FF] transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#2E6FFF] to-[#00F0FF] text-white py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
            <div className="relative text-center my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <span className="relative px-4 bg-[#0A0F1C] text-gray-400">Or continue with</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {['Google', 'Apple', 'Facebook'].map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={provider === 'Google' ? handleGoogleSignIn : null}
                  className="flex items-center justify-center space-x-2 bg-[#1A1F2C] text-white py-3 rounded-lg hover:bg-[#2A2F3C] transition-colors"
                >
                  <i className={`fab fa-${provider.toLowerCase()}`}></i>
                  <span>{provider}</span>
                </button>
              ))}
            </div>
          </form>
          {message && (
            <p className={`mt-4 text-center text-sm ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;