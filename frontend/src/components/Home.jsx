import { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { auth } from "../firebase"; // Ensure this path is correct
import { signOut } from "firebase/auth";
import { FaTachometerAlt, FaUser, FaTicketAlt, FaCreditCard, FaBell, FaQuestionCircle, FaChevronDown, FaBars, FaSignOutAlt } from "react-icons/fa";
import batmanlogo from "../assets/batman-logo.jpg";
import AdminProfile from "../components/AdminProfile";

const containerStyle = {
  width: "100%",
  height: "600px",
};

const handleLogout = async () => {
  try {
    await signOut(auth);
    alert("Logged out successfully!");
  } catch (error) {
    alert(`Error during logout: ${error.message}`);
  }
};

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenuItem, setActiveMenuItem] = useState("dashboard");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [position, setPosition] = useState({ lat: 37.7749, lng: -122.4194 });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("Geolocation permission denied")
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#0d0d0d] shadow-lg transition-transform duration-300 ease-in-out z-50 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-6 flex flex-col h-full">
          <h1 className="text-2xl font-bold text-yellow-400 font-batman">GOTHAM PARKING</h1>
          
          {/* Navigation Menu */}
          <nav className="space-y-2 flex-1 mt-6">
            {[
              { id: "dashboard", icon: <FaTachometerAlt />, label: "Dashboard" },
              { id: "adminProfile", icon: <FaUser />, label: "Admin Profile" },
              { id: "bookings", icon: <FaTicketAlt />, label: "My Bookings" },
              { id: "payments", icon: <FaCreditCard />, label: "Payment History" },
              { id: "alerts", icon: <FaBell />, label: "Parking Alerts" },
              { id: "support", icon: <FaQuestionCircle />, label: "Help & Support" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenuItem(item.id)}
                className={`flex items-center w-full p-3 rounded-lg transition-colors whitespace-nowrap ${
                  activeMenuItem === item.id
                    ? "bg-yellow-400 text-black font-semibold"
                    : "text-gray-400 hover:bg-gray-800"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {isSidebarOpen && item.label}
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="mt-auto">
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <FaSignOutAlt className="w-6 h-6 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`p-6 transition-all ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-4 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors z-50"
        >
          <FaBars className="text-yellow-400" />
        </button>

        {/* Render Different Components Based on Active Menu Item */}
        {activeMenuItem === "adminProfile" ? (
          <AdminProfile />
        ) : (
          <>
            {/* Top Navigation */}
            <header className="flex items-center justify-between mb-8">
              {/* Search Bar */}
              <div className="flex-1 mx-4">
                <input
                  type="text"
                  placeholder="Search for parking spots in Gotham..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg focus:outline-none focus:border-yellow-400 bg-gray-800 text-gray-200"
                />
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-3 bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <img src={batmanlogo} alt="Profile" className="w-8 h-8 rounded-full" />
                  <span className="font-medium">Bruce Wayne</span>
                  <FaChevronDown />
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                    <button className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors">
                      View Profile
                    </button>
                    <button className="block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors">
                      Settings
                    </button>
                  </div>
                )}
              </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-lg font-bold mb-2">Total Caves Available</h2>
                <p className="text-3xl font-semibold">1234</p>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-lg font-bold mb-2">Available Now</h2>
                <p className="text-3xl font-semibold">567</p>
              </div>

              <div className="bg-gray-800 p-6 rounded-xl shadow-md">
                <h2 className="text-lg font-bold mb-2">Active Bookings</h2>
                <p className="text-3xl font-semibold">89</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
