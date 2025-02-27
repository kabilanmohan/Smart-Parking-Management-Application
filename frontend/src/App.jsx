import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./components/Auth";
import Home from "./components/Home";
import App2 from "./App2"; // Import App2
import LandingPage from "./components/LandingPage"; // Import LandingPage
import ParkingLot from "./components/ParkingLot";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import AdminProfile from "./components/AdminProfile";
import PendingRequests from "./components/PendingRequests";
import ParkingSetup from "./components/ParkingSetup";

function App() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} /> 
        <Route path="/dashboard" element={user ? <Home /> : <Auth />} /> 
        <Route path="/admin" element={<AdminProfile />} />
        <Route path="/requests" element={<PendingRequests />} />
        <Route path="/setup-parking" element={<ParkingSetup />} />
        <Route path="/parking-lot" element={<ParkingLot />} /> {/* Add ParkingLot route */}
        <Route path="/payment_module" element={<App2 />} />

      </Routes>
    </Router>
  );
}

export default App;
