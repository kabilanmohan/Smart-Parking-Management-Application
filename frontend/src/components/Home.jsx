import { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { auth, db } from "../firebase"; // Ensure this path is correct
import { signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { FaTachometerAlt, FaUser, FaTicketAlt, FaCreditCard, FaBell, FaQuestionCircle, FaChevronDown, FaBars, FaSignOutAlt } from "react-icons/fa";
import batmanlogo from "../assets/batman-logo.jpg";

const containerStyle = {
  width: "100%",
  height: "600px", // Increased height for the parking map box
};

const handleLogout = async () => {
  try {
    await signOut(auth); // Sign out the user
    alert("Logged out successfully!");
    // Optionally, redirect the user to the login page
  } catch (error) {
    alert(`Error during logout: ${error.message}`);
  }
};

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenuItem, setActiveMenuItem] = useState("dashboard");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications] = useState([
    {
      id: 1,
      title: "Upcoming Booking Reminder",
      message: "Your parking at Wayne Tower starts in 2 hours",
      time: "2 hours ago",
    },
    {
      id: 2,
      title: "Payment Successful",
      message: "Payment for Batcave Parking completed",
      time: "5 hours ago",
    },
  ]);

  const [position, setPosition] = useState({ lat: 37.7749, lng: -122.4194 }); // Default to San Francisco
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);

  useEffect(() => {
    // Get user's current location
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("Geolocation permission denied")
    );

    // Fetch parking spaces from Firestore
    const fetchParkingSpaces = async () => {
      const querySnapshot = await getDocs(collection(db, "ParkingSpaces"));
      const spaces = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        spaces.push({
          id: doc.id,
          location: { lat: data.location.latitude, lng: data.location.longitude },
          name: data.Name,
          address: data.Address || "No address provided",
          price: `$${data.pricing.car}/hour`,
          spots: data.TotalSlots,
          distance: "0.3 miles", // You can calculate this dynamically if needed
          rating: data.rating,
          levels: data.levels,
          pricing: data.pricing,
        });
      });
      console.log("Fetched Parking Spaces:", spaces);
      setParkingSpaces(spaces);
    };

    fetchParkingSpaces();
  }, []);

  const handleDirectionsClick = (space) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${space.location.lat},${space.location.lng}`;
    window.open(url, "_blank");
  };

  const handleBookNowClick = (space) => {
    // Redirect to booking page with space details
    // Example: history.push(`/book/${space.id}`);
    alert(`Redirecting to booking page for ${space.name}`);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#0d0d0d] shadow-lg transition-transform duration-300 ease-in-out z-50 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8"></div>
        <div className="p-6 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-yellow-400 font-batman">GOTHAM PARKING </h1>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y- flex-1">
            {[
              { id: "dashboard", icon: <FaTachometerAlt />, label: "Dashboard" },
              { id: "profile", icon: <FaUser />, label: "Profile" },
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

          {/* Logout Button with Icon */}
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
      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* Menu Reopen Button (Always Visible) */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-4 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors z-50"
        >
          <FaBars className="text-yellow-400" />
        </button>

        {/* Top Navigation */}
        <header className="flex items-center justify-between mb-8 p-6">
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
              <img
                src={batmanlogo}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
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

        {/* Stats Cards - Total Spots, Available Now, Active Bookings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6">
          {/* Total Spots */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-bold mb-2">Total Caves Available</h2>
            <p className="text-3xl font-semibold">1234</p>
            <p className="text-green-400 text-sm">+6.9% from last month</p>
          </div>

          {/* Available Now */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-bold mb-2">Available Now</h2>
            <p className="text-3xl font-semibold">567</p>
            <p className="text-gray-400 text-sm">69% occupancy rate</p>
          </div>

          {/* Active Bookings */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-bold mb-2">Active Bookings</h2>
            <p className="text-3xl font-semibold">89</p>
            <p className="text-gray-400 text-sm">Last updated 5 mins ago</p>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Left Column - Parking Map */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 p-6 rounded-xl shadow-md mb-8">
              <h2 className="text-lg font-bold mb-4">BAT PARKING CAVE MAP</h2>
              <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={position}
                  zoom={12}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: false,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                    styles: [
                      {
                        featureType: "all",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#ffffff" }],
                      },
                      {
                        featureType: "all",
                        elementType: "labels.text.stroke",
                        stylers: [{ color: "#000000" }],
                      },
                    ],
                  }}
                >
                  {/* User Location Marker */}
                  <Marker position= {position}  />

                  {/* Parking Space Markers */}
                  {parkingSpaces.map((space) => (
                    <Marker
                      key={space.id}
                      position={space.location}
                      onClick={() => setSelectedSpace(space)}
                    />
                  ))}

                  {/* InfoWindow for Selected Parking Space */}
                  {selectedSpace && (
                    <InfoWindow
                      position={selectedSpace.location}
                      onCloseClick={() => setSelectedSpace(null)}
                    >
                      <div className="text-black">
                        <h3 className="font-bold">{selectedSpace.name}</h3>
                        <p>{selectedSpace.address}</p>
                        <p>Rating: {selectedSpace.rating}</p>
                        <p>Total Slots: {selectedSpace.spots}</p>
                        <p>Levels: {selectedSpace.levels}</p>
                        <p>Pricing: Car - ${selectedSpace.pricing.car}/hour, Bike - ${selectedSpace.pricing.bike}/hour</p>
                        <div className="mt-2">
                          <button
                            onClick={() => handleDirectionsClick(selectedSpace)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg mr-2 hover:bg-blue-600 transition-colors"
                          >
                            Directions
                          </button>
                          <button
                            onClick={() => handleBookNowClick(selectedSpace)}
                            className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            </div>
          </div>

          {/* Right Column - Nearby Spots and Notifications */}
          <div className="lg:col-span-1">
            {/* Nearby Spots */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-md mb-8">
              <h2 className="text-lg font-bold mb-4">Nearby Spots</h2>
              {parkingSpaces.map((spot) => (
                <div
                  key={spot.id}
                  className="flex justify-between items-center p-4 border-b border-gray-700 last:border-b-0 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div>
                    <h3 className="font-semibold">{spot.name}</h3>
                    <p className="text-sm text-gray-400">{spot.address}</p>
                    <p className="text-sm text-gray-400">{spot.price} • {spot.spots} spots • {spot.distance}</p>
                  </div>
                  <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors">
                    Book Now
                  </button>
                </div>
              ))}
            </div>

            {/* Recent Notifications */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-md">
              <h2 className="text-lg font-bold mb-4">Recent Notifications</h2>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 bg-gray-700 rounded-lg mb-2 last:mb-0 hover:bg-gray-600 transition-colors"
                >
                  <h3 className="font-semibold">{notification.title}</h3>
                  <p className="text-sm">{notification.message}</p>
                  <small className="text-gray-400 text-xs">{notification.time}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;