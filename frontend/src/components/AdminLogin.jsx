import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { FaLock, FaEnvelope, FaEye, FaEyeSlash, FaArrowLeft, FaGoogle } from "react-icons/fa";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBackToLanding = () => {
    navigate('/');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      // Check if the user has admin role
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        setMessage("Admin login successful! Redirecting...");
        setTimeout(() => {
          navigate('/admin-dashboard');
        }, 1000);
      } else {
        // Sign out if not an admin
        await auth.signOut();
        setMessage("Access denied. This portal is for administrators only.");
      }
    } catch (error) {
      console.error("Error during admin login:", error);
      setMessage("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if the user has admin role
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        setMessage("Admin login successful! Redirecting...");
        setTimeout(() => {
          navigate('/admin-dashboard');
        }, 1000);
      } else {
        // Sign out if not an admin
        await auth.signOut();
        setMessage("Access denied. Your Google account is not registered as an administrator.");
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setMessage("Sign-in was cancelled.");
      } else {
        setMessage("Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back button to landing page */}
      <button 
        onClick={handleBackToLanding}
        className="absolute top-6 left-6 z-20 flex items-center text-[#1F2937] hover:text-[#8373BF] transition-colors bg-white/80 px-4 py-2 rounded-lg shadow-md hover:shadow-lg"
      >
        <FaArrowLeft className="mr-2" />
        <span>Back to Home</span>
      </button>

      {/* Background gradient */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#ffffff] to-[#8373BF] opacity-30 blur-2xl"></div>
      
      {/* Main Container */}
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-[#E5E7EB] relative z-10">
        <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg text-sm flex items-center justify-center mb-4">
          <FaLock className="mr-2" /> 
          Administrator Access Only
        </div>
      
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-[#1F2937] mb-2">Admin Portal</h2>
          <p className="text-[#4B5563]">Access restricted to authorized personnel only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#4B5563]" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-[#F9FAFB] text-[#1F2937] px-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8373BF] border border-[#E5E7EB]"
              placeholder="Admin Email"
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
              className="w-full bg-[#F9FAFB] text-[#1F2937] px-12 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8373BF] border border-[#E5E7EB]"
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#4B5563] hover:text-[#8373BF] transition-colors"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-[#8373BF] hover:bg-[#8373BF]/90 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Authenticating..." : "Sign In as Admin"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex justify-center items-center bg-white hover:bg-gray-50 text-[#1F2937] border border-[#E5E7EB] py-3 rounded-lg font-medium transition-colors"
            >
              <FaGoogle className="mr-2 text-[#EA4335]" />
              Sign in with Google
            </button>
          </div>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg ${
            message.includes('successful') ? 'bg-[#D1FAE5] text-[#10B981]' : 'bg-[#FEE2E2] text-[#EF4444]'
          }`}>
            <p className="text-center text-sm">{message}</p>
          </div>
        )}

        <div className="mt-6 text-center text-[#4B5563] text-sm">
          <p>Administrative access only. For general users, please use the <a href="/login" className="text-[#8373BF] hover:text-[#8373BF]/80">regular login</a>.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;