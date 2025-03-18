import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./components/Auth";
import Home from "./components/Home";
import AdminDashboard from "./components/AdminDashboard"; // New integrated dashboard
import LandingPage from "./components/LandingPage";
import ParkingLot from "./components/ParkingLot";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import PendingRequests from "./components/PendingRequests";
import ParkingSetup from "./components/ParkingSetup";
import UserProfile from "./components/UserProfile";
import HelpAndSupport from "./components/HelpAndSupport";
import Loader from "./components/Loader"; 
import PaymentHistory from "./components/PaymentHistory"; 
import App2 from "./App2";
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <Loader />;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={user ? <Home /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
        <Route path="/profile" element={user ? <UserProfile /> : <Navigate to="/login" replace />} />
        <Route path="/parking-lot" element={<ParkingLot />} />
        <Route path="/payment_module" element={<App2 />} />
        <Route path="/payment-history" element={user ? <PaymentHistory /> : <Navigate to="/dashboard" replace />} />
        <Route path="/help-support" element={user ? <HelpAndSupport /> : <Navigate to="/login" replace />} />

        {/* Updated Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/requests" element={<PendingRequests />} />
        <Route path="/admin/setup-parking" element={<ParkingSetup />} />
      </Routes>
    </Router>
  );
}

export default App;
