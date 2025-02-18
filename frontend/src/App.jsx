import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./components/Auth";
import Home from "./components/Home";
import LandingPage from "./components/LandingPage"; // Import LandingPage
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import AdminProfile from "./components/AdminProfile";

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
      </Routes>
    </Router>
  );
}

export default App;
