import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import { FaTachometerAlt, FaUser, FaTicketAlt, FaCreditCard, FaUsersCog, FaParking, 
         FaSignOutAlt, FaSearch, FaChevronDown, FaChevronLeft, FaChevronRight, FaExclamationCircle } from "react-icons/fa";
import Loader from "./Loader";
import AdminComplaints from "./AdminComplaints";
import AdminUsers from "./AdminUsers";
import AddParkingSpace from "./AddParkingSpace";
import ParkingGridSetup from "./ParkingGridSetup";
import ParkingSpacesList from "./ParkingSpacesList";
import BookingsList from "./BookingsList";
import AdminPaymentReports from "./AdminPaymentReports";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMenuItem, setActiveMenuItem] = useState("dashboard");
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [parkingSpaceId, setParkingSpaceId] = useState(null);
  const [totalLevels, setTotalLevels] = useState(1);

  // Log out function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/admin-login");
    } catch (error) {
      console.error("Error during logout:", error);
      alert(`Error during logout: ${error.message}`);
    }
  };

  // Fetch admin data and statistics
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        if (!auth.currentUser) {
          navigate("/admin-login");
          return;
        }

        // Get admin user data
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setUserData(userDoc.data());
        } else {
          // Not an admin, redirect
          await signOut(auth);
          navigate("/admin-login");
          return;
        }

        // Fetch parking spaces for stats
        const spacesSnapshot = await getDocs(collection(db, "ParkingSpaces"));
        const spaces = [];
        spacesSnapshot.forEach((doc) => {
          spaces.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setParkingSpaces(spaces);

        // Fetch users for stats
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = [];
        usersSnapshot.forEach((doc) => {
          usersList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setUsers(usersList);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check for URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const levels = params.get('levels');
    
    if (id) {
      console.log("Found ID in URL:", id); // Add this for debugging
      setParkingSpaceId(id);
      
      if (levels) {
        setTotalLevels(parseInt(levels));
      }
      
      // Set active menu item to setup-grid when id is in URL
      setActiveMenuItem("setup-grid");
    }
  }, [location.search]);

  useEffect(() => {
    if (parkingSpaceId && location.search.includes('id=')) {
      setActiveMenuItem("setup-grid");
    }
  }, [location, parkingSpaceId]);

  // If still loading, show loader
  if (loading) {
    return <Loader text="Loading admin dashboard..." />;
  }

  // Count statistics
  const totalUsers = users.length;
  const totalParkingSpaces = parkingSpaces.length;
  const totalSpots = parkingSpaces.reduce((sum, space) => sum + (space.TotalSlots || 0), 0);
  const availableSpots = totalSpots - Math.floor(Math.random() * (totalSpots * 0.7)); // Just for demo

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1F2937] font-['Proxima_Nova','Roboto',sans-serif]">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transition-all duration-300 ease-in-out z-50 ${
          isSidebarOpen ? "w-64" : "w-0 opacity-0"
        }`}
      >
        {/* Sidebar content - only render when sidebar is open */}
        {isSidebarOpen && (
          <div className="p-6 flex flex-col h-full">
            <div className="mb-8"></div>

            {/* Navigation Menu */}
            <nav className="space-y-2 flex-1">
              {[
                { id: "dashboard", icon: <FaTachometerAlt />, label: "Dashboard" },
                { id: "users", icon: <FaUser />, label: "User Management" },
                { id: "parking", icon: <FaParking />, label: "Parking Spaces" },
                { id: "bookings", icon: <FaTicketAlt />, label: "Bookings" },
                { id: "complaints", icon: <FaExclamationCircle />, label: "Complaints" },
                { id: "payments", icon: <FaCreditCard />, label: "Payments" },
                { id: "settings", icon: <FaUsersCog />, label: "Settings" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveMenuItem(item.id)}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                    activeMenuItem === item.id
                      ? "bg-[#8373BF] text-white font-semibold"
                      : "text-[#4B5563] hover:bg-[#F1F0FF] hover:text-[#8373BF]"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Logout Button */}
            <div className="mt-auto">
              <button
                onClick={handleLogout}
                className="w-full bg-[#8373BF] text-white p-3 rounded-lg hover:bg-[#8373BF]/80 transition-colors flex items-center justify-center"
              >
                <FaSignOutAlt className="mr-2 w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-1/2 left-0 transform -translate-y-1/2 bg-[#8373BF] h-24 w-8 rounded-r-lg shadow-md flex items-center justify-center z-50 border border-l-0 border-[#8373BF] hover:bg-[#8373BF]/80 transition-colors"
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
        <header className="bg-white border-b border-[#E5E7EB] p-4 fixed top-0 right-0 left-0 z-30 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[#1F2937] ml-2 md:ml-0">
                Admin <span className="text-[#8373BF]">Dashboard</span>
              </h1>
            </div>

            {/* Search Bar */}
            <div className="hidden md:block relative w-1/3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4B5563]" />
                <input
                  type="text"
                  placeholder="Search users, parking spaces..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(e.target.value.length > 0);
                  }}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8373BF] focus:border-transparent"
                />
                {showSearchResults && (
                  <div className="absolute w-full mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-10 p-4 text-center">
                    <p className="text-[#4B5563]">No results found matching &quot;{searchQuery}&quot;</p>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-3 bg-[#F9FAFB] p-2 rounded-lg hover:bg-[#F1F0FF] transition-colors border border-[#E5E7EB]"
              >
                <div className="w-8 h-8 rounded-full bg-[#8373BF] flex items-center justify-center text-white font-bold">
                  {userData?.name?.charAt(0) || "A"}
                </div>
                <span className="font-medium text-[#1F2937]">{userData?.name || "Admin"}</span>
                <FaChevronDown className="text-[#4B5563]" />
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden z-10 border border-[#E5E7EB]">
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-[#F1F0FF] transition-colors text-[#1F2937]"
                  >
                    Profile Settings
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-[#F1F0FF] transition-colors text-[#1F2937]"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main dashboard content with padding for fixed header */}
        <div className="pt-20 p-6">
          {activeMenuItem === "dashboard" && (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-[#1F2937] mb-4">Dashboard Overview</h2>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold mb-2 text-[#1F2937]">Total Users</h3>
                    <p className="text-3xl font-semibold text-[#8373BF]">{totalUsers}</p>
                    <p className="text-[#4B5563] text-sm">Registered accounts</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold mb-2 text-[#1F2937]">Parking Spaces</h3>
                    <p className="text-3xl font-semibold text-[#8373BF]">{totalParkingSpaces}</p>
                    <p className="text-[#4B5563] text-sm">Active locations</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold mb-2 text-[#1F2937]">Total Capacity</h3>
                    <p className="text-3xl font-semibold text-[#3B82F6]">{totalSpots}</p>
                    <p className="text-[#4B5563] text-sm">Parking spots</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold mb-2 text-[#1F2937]">Available Spots</h3>
                    <p className="text-3xl font-semibold text-[#10B981]">{availableSpots}</p>
                    <p className="text-[#4B5563] text-sm">{Math.round((availableSpots/totalSpots)*100)}% availability</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-[#1F2937] mb-4">Recent Activity</h2>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB]">
                  <p className="text-[#4B5563] text-center py-8">No recent activities to display</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-[#1F2937] mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <button 
                    onClick={() => setActiveMenuItem("users")}
                    className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow text-left"
                  >
                    <h3 className="text-lg font-bold mb-2 text-[#1F2937]">Manage Users</h3>
                    <p className="text-[#4B5563]">Add, edit or remove user accounts</p>
                  </button>
                  
                  <button 
                    onClick={() => setActiveMenuItem("add-parking")}
                    className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow text-left"
                  >
                    <h3 className="text-lg font-bold mb-2 text-[#1F2937]">Add Parking Space</h3>
                    <p className="text-[#4B5563]">Create a new parking location</p>
                  </button>
                  
                  <button 
                    onClick={() => setActiveMenuItem("complaints")}
                    className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow text-left"
                  >
                    <h3 className="text-lg font-bold mb-2 text-[#1F2937]">Manage Complaints</h3>
                    <p className="text-[#4B5563]">Respond to user complaints</p>
                  </button>
                  
                  <button className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow text-left">
                    <h3 className="text-lg font-bold mb-2 text-[#1F2937]">View Reports</h3>
                    <p className="text-[#4B5563]">Access system analytics and data</p>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeMenuItem === "complaints" && (
            <AdminComplaints />
          )}

          {activeMenuItem === "users" && (
            <AdminUsers />
          )}

            {activeMenuItem === "payments" && (
            <AdminPaymentReports />
            )}

          {activeMenuItem === "add-parking" && (
            <AddParkingSpace 
              onBack={() => setActiveMenuItem("dashboard")} 
              setActiveMenuItem={setActiveMenuItem} 
            />
          )}

          {activeMenuItem === "setup-grid" && (
            <ParkingGridSetup 
              onBack={() => setActiveMenuItem("dashboard")} 
              parkingSpaceId={parkingSpaceId}
              totalLevels={totalLevels}
            />
          )}

          {activeMenuItem === "parking" && (
            <ParkingSpacesList 
              parkingSpaces={parkingSpaces}
              onAddNew={() => setActiveMenuItem("add-parking")}
              onSetupGrid={(id, levels) => {
                setParkingSpaceId(id);
                setTotalLevels(levels);
                setActiveMenuItem("setup-grid");
              }}
            />
          )}

            {activeMenuItem === "bookings" && (
            <BookingsList />
            )}

          {/* Add other sections as needed */}
        </div>

        {/* Footer */}
        <footer className="p-6 text-center text-[#4B5563] border-t border-[#E5E7EB] mt-8">
          <p>© 2025 Crimson Parking Management — Admin Portal</p>
        </footer>
      </div>
    </div>
  );
};

export default AdminDashboard;