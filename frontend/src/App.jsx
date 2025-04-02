import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./components/Auth";
import Home from "./components/Home";
import App2 from "./App2";
import LandingPage from "./components/LandingPage";
import ParkingLot from "./components/ParkingLot";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import AdminProfile from "./components/AdminProfile";
import PendingRequests from "./components/PendingRequests";
import ParkingSetup from "./components/ParkingSetup";
import UserProfile from "./components/UserProfile";
import HelpAndSupport from "./components/HelpAndSupport";
import Loader from "./components/Loader";
import PaymentHistory from "./components/PaymentHistory";
import AdminLogin from "./components/AdminLogin"; // Import the new components
import AdminDashboard from "./components/AdminDashboard";
import PaymentForm from "./components/PaymentForm"; // Import PaymentForm
import MyBookings from './components/MyBookings';
import BookingsList from './components/BookingsList';
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import NotificationHistory from "./components/NotificationHistory";
import ParkingPrediction from './components/ParkingPrediction';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Check if the logged-in user is an admin
      if (currentUser) {
        try {
          const { getDoc, doc } = await import('firebase/firestore');
          const { db } = await import('./firebase');
          
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          setIsAdmin(userDoc.exists() && userDoc.data().role === 'admin');
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Show loading indicator while checking auth
  if (loading) {
    return <Loader text="Checking authentication..." />;
  }

  return (
    <PayPalScriptProvider 
      options={{ 
        "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,  
        currency: "USD",
        intent: "capture"
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} /> 
          <Route 
            path="/dashboard" 
            element={user ? <Home /> : <Navigate to="/login" replace />} 
          /> 
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <Auth />}
          />
          <Route path="/admin" element={<AdminProfile />} />
          <Route path = "/alerts" element = {<NotificationHistory/>}/>
          <Route 
            path="/profile" 
            element={user ? <UserProfile /> : <Navigate to="/login" replace />} 
          />
          <Route path="/requests" element={<PendingRequests />} />
          <Route path="/setup-parking" element={<ParkingSetup />} />
          <Route path="/parking-lot" element={<ParkingLot />} />
          <Route path="/payment_module" element={<App2 />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/admin/bookings" element={<BookingsList />} />
          <Route path="/payment-history" element={user ? <PaymentHistory /> : <Navigate to="/dashboard" replace />} />
          <Route 
            path="/help-support" 
            element={user ? <HelpAndSupport /> : <Navigate to="/login" replace />} 
          />
          
          {/* Admin Routes */}
          <Route path="/admin-login" element={user && isAdmin ? <Navigate to="/admin-dashboard" replace /> : <AdminLogin />} />
          <Route 
            path="/admin-dashboard" 
            element={user && isAdmin ? <AdminDashboard /> : <Navigate to="/admin-login" replace />} 
          />
          
          {/* Payment Route */}
          <Route
            path="/payment"
            element={
              <PaymentForm
                onPaymentSuccess={() => {
                  // Use Navigate component for redirection instead of navigate function
                  return <Navigate to="/payment-history" replace={true} />;
                }}
              />
            }
          />
          <Route 
            path="/predictions/:parkingSpaceId" 
            element={user ? <ParkingPrediction /> : <Navigate to="/login" replace />} 
          />
        </Routes>
      </Router>
    </PayPalScriptProvider>
  );
}

export default App;