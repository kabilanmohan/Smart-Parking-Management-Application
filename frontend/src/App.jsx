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
        <Route 
          path="/profile" 
          element={user ? <UserProfile /> : <Navigate to="/login" replace />} 
        />
        <Route path="/requests" element={<PendingRequests />} />
        <Route path="/setup-parking" element={<ParkingSetup />} />
        <Route path="/parking-lot" element={<ParkingLot />} />
        <Route path="/payment_module" element={<App2 />} />
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
      </Routes>
    </Router>
  );
}

export default App;