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
import Loader from "./components/Loader"; // Import the new Loader component

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Mark as done loading regardless of result
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
        <Route 
          path="/help-support" 
          element={user ? <HelpAndSupport /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
