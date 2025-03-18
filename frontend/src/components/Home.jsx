import { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { FaTachometerAlt, FaUser, FaTicketAlt, FaCreditCard, FaBell, FaQuestionCircle, FaChevronDown, FaSignOutAlt, FaSearch, FaSync, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import batmanlogo from "../assets/batman-logo.jpg";
import { useNavigate } from "react-router-dom";
import UserProfile from "./UserProfile";
import Loader from "./Loader"; // Import the Loader component
import ParkingSpaceDetails from './ParkingSpaceDetails'; // Import the new component

const containerStyle = {
  width: "100%",
  height: "600px",
};

// Updated map styles for light theme
const mapStyles = [
  {
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#1F2937"
      }
    ]
  },
  {
    "featureType": "all",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#F9FAFB"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "all",
    "stylers": [
      {
        "color": "#DBEAFE"
      }
    ]
  }
];

const Home = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenuItem, setActiveMenuItem] = useState("dashboard");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [position, setPosition] = useState({ lat: 37.7749, lng: -122.4194 });
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailSpace, setDetailSpace] = useState(null); // Add a new state to track which space is being viewed in detail

  // Add a key for the Google Map component to force proper re-rendering
  const [mapKey, setMapKey] = useState(Date.now());

  // Move handleLogout inside the component to access navigate
  const handleLogout = async () => {
    try {
      // No need to set loading state here as it might cause issues
      await signOut(auth);
      // The auth state listener in App.jsx will handle the redirect
    } catch (error) {
      console.error("Error during logout:", error);
      alert(`Error during logout: ${error.message}`);
    }
  };

  useEffect(() => {
    // Handle responsive sidebar on window resize
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Add auth state change listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // If no user is logged in, redirect to login page
        navigate("/");
        return;
      }
      
      // If user is logged in, continue with data fetching
      fetchUserDataAndParkingSpaces(user.uid);
    });

    // Cleanup function to unsubscribe from the listener when component unmounts
    return () => unsubscribe();
  }, [navigate]);

  // Combined function to fetch user data and parking spaces
  const fetchUserDataAndParkingSpaces = async (userId) => {
    try {
      // Get user location
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.warn("Geolocation permission denied")
      );

      // Fetch user data
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        console.log("No user data found");
      }

      // Fetch parking spaces
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
          distance: "0.3 miles",
          rating: data.averageRating,
          levels: data.levels,
          pricing: data.pricing,
        });
      });
      setParkingSpaces(spaces);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectionsClick = (space) => {
    const url = `httpss://www.google.com/maps/dir/?api=1&destination=${space.location.lat},${space.location.lng}`;
    window.open(url, "_blank");
  };

  const handleBookNowClick = (space) => {
    navigate("/parking-lot", { state: { selectedSpot: space } });
  };

  const handleProfileClick = () => {
    setActiveMenuItem("profile");
    setShowProfileDropdown(false);
  };

  // Add this effect to refresh the map when switching back to dashboard
  useEffect(() => {
    if (activeMenuItem === "dashboard") {
      setMapKey(Date.now());
    }
  }, [activeMenuItem]);

  // Add a function to handle map refresh
  const handleMapRefresh = () => {
    setMapKey(Date.now());
  };

  // Add search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    // Filter parking spaces based on search query
    const filteredSpaces = parkingSpaces.filter(space => 
      space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setSearchResults(filteredSpaces);
    setShowSearchResults(true);
  }, [searchQuery, parkingSpaces]);

  // Handle search result click
  const handleSearchResultClick = (space) => {
    setDetailSpace(space);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render content based on active menu item
  const renderContent = () => {
    switch (activeMenuItem) {
      case "profile":
        return <UserProfile userData={userData} setUserData={setUserData} inDashboard={true} />;
      case "dashboard":
      default:
        return (
          <>
            {/* Stats Cards Row - Add Map Legend */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 p-6">
              
              {/* Map Legend Card - Improved layout */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
                <h2 className="text-lg font-bold mb-3 text-[#1F2937]">Map Legend</h2>
                <div className="flex flex-col md:flex-row">
                  {/* Left side - Marker icons */}
                  <div className="space-y-3 md:w-1/2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 mr-2 flex items-center justify-center">
                        <img 
                          src="https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                          alt="Blue marker"
                          className="w-6 h-6"
                        />
                      </div>
                      <span className="text-sm text-[#4B5563]">Your Location</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 mr-2 flex items-center justify-center">
                        <img 
                          src="https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                          alt="Red marker"
                          className="w-6 h-6"
                        />
                      </div>
                      <span className="text-sm text-[#4B5563]">Parking Spots</span>
                    </div>
                  </div>
                  
                  {/* Right side - Instructions */}
                  <div className="mt-4 md:mt-0 md:ml-4 md:w-1/2 p-1 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] flex items-center">
                    <p className="text-sm text-[#4B5563]">
                      Click on <span className="font-medium text-[#C94B4B]">red markers</span> to view parking spot details and booking options.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Original Stats Cards */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
                <h2 className="text-lg font-bold mb-2 text-[#1F2937]">Total Spots Available</h2>
                <p className="text-3xl font-semibold text-[#3B82F6]">1,234</p>
                <p className="text-[#4B5563] text-sm">+6.9% from last month</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
                <h2 className="text-lg font-bold mb-2 text-[#1F2937]">Available Now</h2>
                <p className="text-3xl font-semibold text-[#10B981]">567</p>
                <p className="text-[#4B5563] text-sm">69% occupancy rate</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
                <h2 className="text-lg font-bold mb-2 text-[#1F2937]">Active Bookings</h2>
                <p className="text-3xl font-semibold text-[#C94B4B]">89</p>
                <p className="text-[#4B5563] text-sm">Last updated 5 mins ago</p>
              </div>
            </div>

            {/* Rest of the content remains the same */}
            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
              {/* Left Column - Parking Map */}
              <div className="lg:col-span-2">
                <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-[#E5E7EB] hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-[#1F2937]">PARKING MAP</h2>
                    <button
                      onClick={handleMapRefresh}
                      className="flex items-center space-x-1 bg-[#C94B4B] text-white px-3 py-2 rounded-lg hover:bg-[#C94B4B]/80 transition-colors"
                      title="Refresh map"
                    >
                      <FaSync className="mr-1" size={14} />
                      <span>Refresh Map</span>
                    </button>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-[#E5E7EB]">
                    <LoadScript 
                      key={mapKey}
                      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} 
                      loadingElement={<div className="h-[600px] flex items-center justify-center bg-gray-100">Loading map...</div>}
                    >
                      <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={position}
                        zoom={12}
                        options={{
                          disableDefaultUI: true,
                          zoomControl: true,
                          streetViewControl: true,
                          mapTypeControl: false,
                          fullscreenControl: true,
                          styles: mapStyles,
                        }}
                      >
                        {/* User Location Marker */}
                        <Marker 
                          position={position}
                          icon={{
                            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                          }}
                        />

                        {/* Parking Space Markers */}
                        {parkingSpaces.map((space) => (
                          <Marker
                            key={space.id}
                            position={space.location}
                            onClick={() => setSelectedSpace(space)}
                            icon={{
                              url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                            }}
                          />
                        ))}

                        {/* InfoWindow for Selected Parking Space */}
                        {selectedSpace && (
                          <InfoWindow
                            position={selectedSpace.location}
                            onCloseClick={() => setSelectedSpace(null)}
                          >
                            <div className="text-[#1F2937] p-1">
                              <h3 className="font-bold text-lg">{selectedSpace.name}</h3>
                              <p className="text-sm">{selectedSpace.address}</p>
                              <p className="text-sm">Rating: {selectedSpace.rating} ★</p>
                              <p className="text-sm">Total Spots: {selectedSpace.spots}</p>
                              <p className="text-sm">Levels: {selectedSpace.levels}</p>
                              <p className="text-sm mb-2">Pricing: Car - ${selectedSpace.pricing.car}/hr, Bike - ${selectedSpace.pricing.bike}/hr</p>
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDirectionsClick(selectedSpace);
                                  }}
                                  className="bg-[#3B82F6] text-white px-3 py-1 rounded text-sm hover:bg-[#2563EB] transition-colors"
                                >
                                  Directions
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBookNowClick(selectedSpace);
                                  }}
                                  className="bg-[#C94B4B] text-white px-3 py-1 rounded text-sm hover:bg-[#C94B4B]/80 transition-colors"
                                >
                                  Book Now
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailSpace(selectedSpace);
                                    setSelectedSpace(null); // Close the InfoWindow when showing details
                                  }}
                                  className="bg-[#10B981] text-white px-3 py-1 rounded text-sm hover:bg-[#059669] transition-colors"
                                >
                                  More Info
                                </button>
                              </div>
                            </div>
                          </InfoWindow>
                        )}
                      </GoogleMap>
                    </LoadScript>
                  </div>
                </div>
              </div>

              {/* Right Column - Detailed Parking Space or Lists */}
              <div className="lg:col-span-1">
                {detailSpace ? (
                  <ParkingSpaceDetails 
                    space={detailSpace}
                    onClose={() => setDetailSpace(null)}
                    onBookNow={handleBookNowClick}
                    onDirections={handleDirectionsClick}
                  />
                ) : (
                  <>
                    {/* Nearby Spots */}
                    <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-[#E5E7EB] hover:shadow-md transition-shadow">
                      <h2 className="text-lg font-bold mb-4 text-[#1F2937]">Nearby Spots</h2>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {parkingSpaces.slice(0, 3).map((spot) => (
                          <div
                            key={spot.id}
                            className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg hover:bg-[#DBEAFE]/50 transition-colors"
                          >
                            <div className="mb-3 md:mb-0">
                              <h3 className="font-semibold text-[#1F2937]">{spot.name}</h3>
                              <p className="text-sm text-[#4B5563]">{spot.address}</p>
                              <p className="text-sm text-[#4B5563]">{spot.price} • {spot.spots} spots • {spot.distance}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                              <button 
                                onClick={() => handleBookNowClick(spot)} 
                                className="bg-[#C94B4B] text-white px-3 py-1 rounded text-sm hover:bg-[#C94B4B]/80 transition-colors"
                              >
                                Book Now
                              </button>
                              <button 
                                onClick={() => setDetailSpace(spot)} 
                                className="bg-[#10B981] text-white px-3 py-1 rounded text-sm hover:bg-[#059669] transition-colors"
                              >
                                More Info
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Favorite Spots */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
                      <h2 className="text-lg font-bold mb-4 text-[#1F2937]">Favorite Spots</h2>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {parkingSpaces.slice(0, 3).map((spot) => (
                          <div
                            key={spot.id}
                            className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg hover:bg-[#DBEAFE]/50 transition-colors"
                          >
                            <div className="mb-3 md:mb-0">
                              <h3 className="font-semibold text-[#1F2937]">{spot.name}</h3>
                              <p className="text-sm text-[#4B5563]">{spot.address}</p>
                              <p className="text-sm text-[#4B5563]">{spot.price} • {spot.spots} spots • {spot.distance}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                              <button 
                                onClick={() => handleBookNowClick(spot)} 
                                className="bg-[#C94B4B] text-white px-3 py-1 rounded text-sm hover:bg-[#C94B4B]/80 transition-colors"
                              >
                                Book Now
                              </button>
                              <button 
                                onClick={() => setDetailSpace(spot)} 
                                className="bg-[#10B981] text-white px-3 py-1 rounded text-sm hover:bg-[#059669] transition-colors"
                              >
                                More Info
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        );
    }
  };

  if (loading) {
    return <Loader text="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1F2937] font-['Proxima_Nova','Roboto',sans-serif]">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 ease-in-out z-50 ${
          isSidebarOpen ? "w-64" : "w-0 opacity-0"
        }`}
      >
        {/* Only render content when sidebar is open */}
        {isSidebarOpen && (
          <div className="p-6 flex flex-col h-full">
            {/* Logo is moved to header, so we can use this space for padding */}
            <div className="mb-8"></div>

            {/* Navigation Menu */}
            <nav className="space-y-2 flex-1">
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
                  className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                    activeMenuItem === item.id
                      ? "bg-[#c94b4b] text-white font-semibold"
                      : "text-[#4B5563] hover:bg-[#fff1f1] hover:text-[#cc93a2]"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Logout Button with Icon */}
            <div className="mt-auto">
              <button
                onClick={handleLogout}
                className="w-full bg-[#C94B4B] text-white p-3 rounded-lg hover:bg-[#C94B4B]/80 transition-colors flex items-center justify-center"
              >
                <FaSignOutAlt className="mr-2 w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Sidebar Toggle Button - Half arrow shape on the edge with increased visibility */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-1/2 left-0 transform -translate-y-1/2 bg-[#C94B4B] h-24 w-8 rounded-r-lg shadow-md flex items-center justify-center z-50 border border-l-0 border-[#C94B4B] hover:bg-[#C94B4B]/80 transition-colors"
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? (
          <FaChevronLeft size={18} className="text-white" />
        ) : (
          <FaChevronRight size={18} className="text-white" />
        )}
      </button>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "md:ml-64" : "md:ml-10"
        }`}
      >
        {/* Top Navigation */}
        <header className="fixed top-0 left-0 right-0 flex flex-col md:flex-row items-center justify-between p-4 bg-white/95 backdrop-blur-sm shadow-sm z-40 border-b border-[#E5E7EB]">
          {/* App Title - Fixed on the left */}
          <div className={`flex items-center ${isSidebarOpen ? "ml-64" : "ml-8"} transition-all duration-300`}>
            <h1 className="text-xl md:text-2xl font-bold text-[#C94B4B] tracking-wider font-['Proxima_Nova','Roboto',sans-serif]">VINTAGE PARKING</h1>
          </div>

          {/* Search Bar with Dropdown */}
          <div className="flex-1 mx-4 max-w-lg hidden md:block search-container relative">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-[#4B5563]" />
              <input
                type="text"
                placeholder="Search for parking spots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-[#F9FAFB] text-[#1F2937] placeholder-[#4B5563]"
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute w-full mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto custom-scrollbar">
                  {searchResults.map((space) => (
                    <button
                      key={space.id}
                      onClick={() => handleSearchResultClick(space)}
                      className="w-full text-left px-4 py-3 hover:bg-[#DBEAFE] border-b border-[#E5E7EB] last:border-b-0 transition-colors flex items-start"
                    >
                      <div>
                        <div className="font-semibold text-[#1F2937]">{space.name}</div>
                        <div className="text-sm text-[#4B5563]">{space.address}</div>
                        <div className="flex items-center mt-1">
                          <span className="text-sm font-medium text-[#4B5563]">{space.rating} ★</span>
                          <span className="mx-2 text-[#E5E7EB]">•</span>
                          <span className="text-sm text-[#4B5563]">{space.spots} spots</span>
                          <span className="mx-2 text-[#E5E7EB]">•</span>
                          <span className="text-sm text-[#4B5563]">${space.pricing.car}/hr</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* No Results Message */}
              {showSearchResults && searchQuery.trim() !== '' && searchResults.length === 0 && (
                <div className="absolute w-full mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-10 p-4 text-center">
                  <p className="text-[#4B5563]">No parking spots found matching &quot;{searchQuery}&quot;</p>
                </div>
              )}
            </div>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-3 bg-[#F9FAFB] p-2 rounded-lg hover:bg-[#DBEAFE] transition-colors border border-[#E5E7EB]"
            >
              <img
                src={userData?.profileImageUrl || batmanlogo}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border-2 border-[#C94B4B]"
              />
              <span className="font-medium text-[#1F2937]">{userData?.name || "User"}</span>
              <FaChevronDown className="text-[#4B5563]" />
            </button>
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden z-10 border border-[#E5E7EB]">
                <button 
                  onClick={handleProfileClick} 
                  className="block w-full text-left px-4 py-2 hover:bg-[#DBEAFE] transition-colors text-[#1F2937]"
                >
                  View Profile
                </button>
                <button 
                  className="block w-full text-left px-4 py-2 hover:bg-[#DBEAFE] transition-colors text-[#1F2937]"
                >
                  Settings
                </button>
              </div>
            )}
          </div>
        </header>
        {/* Content area with padding for fixed header */}
        <div className="pt-20 md:pt-24">
          {/* Dynamic Content Area */}
          {renderContent()}
        </div>

        {/* Footer */}
        <footer className="p-6 text-center text-[#4B5563] border-t border-[#E5E7EB] mt-8">
          <p>© 2025 Vintage Parking Management — All rights reserved.</p>
        </footer>
      </div>

      {/* Add custom scrollbar styles using standard React style approach */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Apply custom scrollbar to specific elements with the class */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F9FAFB;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #C94B4B;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #A83A3A;
        }
        
        /* Apply custom scrollbar to all scrollable elements */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #F9FAFB;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #C94B4B;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #A83A3A;
        }
        
        /* Apply font family throughout the component */
        .min-h-screen {
          font-family: 'Proxima Nova', 'Roboto', sans-serif;
        }
      `}} />
    </div>
  );
};

export default Home;