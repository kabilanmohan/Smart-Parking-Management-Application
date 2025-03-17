import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaUser, FaPhone, FaCar, FaCogs, FaEnvelope, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import Loader from "./Loader"; // Import the Loader component

const UserProfile = ({ userData: propUserData, setUserData: setParentUserData, inDashboard = false }) => {
  const navigate = useNavigate();
  const [userData, setLocalUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    vehicleNumber: "",
    vehicleType: "car",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (propUserData) {
      console.log("Received prop user data:", propUserData);
      setLocalUserData(propUserData);
      setFormData({
        name: propUserData.name || "",
        phoneNumber: propUserData.phoneNumber || "",
        vehicleNumber: propUserData.vehicleNumber || "",
        vehicleType: propUserData.vehicleType || "car",
      });
      setLoading(false);
    } else {
      fetchUserData();
    }
  }, [propUserData]);

  const fetchUserData = async () => {
    if (!auth.currentUser) {
      navigate("/");
      return;
    }

    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("Fetched user data:", data);
        setLocalUserData(data);
        setFormData({
          name: data.name || "",
          phoneNumber: data.phoneNumber || "",
          vehicleNumber: data.vehicleNumber || "",
          vehicleType: data.vehicleType || "car",
        });
      } else {
        setMessage("User profile not found. Please complete your registration.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setMessage("Failed to load user data.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!auth.currentUser) {
        setMessage("You must be logged in to update your profile.");
        return;
      }

      const userDocRef = doc(db, "users", auth.currentUser.uid);
      
      // Get existing user data first to ensure we don't overwrite other fields
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        setMessage("User profile not found.");
        return;
      }

      // Merge with existing data to preserve other fields
      const existingData = userDoc.data();
      
      const updatedData = {
        ...existingData, // Preserve all existing fields
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        vehicleNumber: formData.vehicleNumber,
        vehicleType: formData.vehicleType,
        updatedAt: new Date(),
      };
      
      console.log("Updating profile with data:", updatedData);
      await updateDoc(userDocRef, updatedData);
      
      // Update local state
      setLocalUserData(updatedData);
      
      // Update parent state if function is provided
      if (setParentUserData) {
        setParentUserData(updatedData);
      }
      
      setIsEditing(false);
      setMessage("Profile updated successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Failed to update profile. Please try again.");
    }
  };

  if (loading) {
    return inDashboard ? (
      <div className="w-full flex justify-center items-center py-10">
        <div className="flex flex-col items-center">
          <div className="loader mb-6"></div>
          <p className="text-black text-xl font-['Proxima_Nova','Roboto',sans-serif]">Loading user profile...</p>
          
          <style jsx>{`
            .loader {
              position: relative;
              width: 48px;
              height: 48px;
              background: #c94b4b;
              transform: rotateX(65deg) rotate(45deg);
              color: #fff;
              animation: layers1 1s linear infinite alternate;
            }
            
            .loader:after {
              content: '';
              position: absolute;
              inset: 0;
              background: rgba(255, 255, 255, 0.7);
              animation: layerTr 1s linear infinite alternate;
            }

            @keyframes layers1 {
              0% { box-shadow: 0px 0px 0 0px  }
              90%, 100% { box-shadow: 20px 20px 0 -4px  }
            }
            
            @keyframes layerTr {
              0% { transform: translate(0, 0) scale(1) }
              100% { transform: translate(-25px, -25px) scale(1) }
            }
          `}</style>
        </div>
      </div>
    ) : (
      <Loader text="Loading user profile..." />
    );
  }

  // Safe access to user data properties
  const userEmail = userData?.email || "";
  const userName = userData?.name || "Not provided";
  const userPhone = userData?.phoneNumber || "Not provided";
  const userVehicleNumber = userData?.vehicleNumber || "Not provided";
  const userVehicleType = userData?.vehicleType || "car";

  const containerClass = inDashboard 
    ? "w-full font-['Proxima_Nova','Roboto',sans-serif] flex justify-center px-6" 
    : "min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 font-['Proxima_Nova','Roboto',sans-serif]";

  return (
    <div className={containerClass}>
      <div className={inDashboard ? "bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] max-w-3xl w-full" : "w-full max-w-md bg-white rounded-xl shadow-lg p-6 border border-[#E5E7EB]"}>
        <h1 className="text-2xl font-bold text-[#1F2937] mb-6">User Profile</h1>
        
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.includes("success") ? "bg-[#D1FAE5] text-[#10B981]" : "bg-[#FEE2E2] text-[#EF4444]"
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#4B5563] mb-1 text-sm font-medium">Full Name</label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4B5563]" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-[#F9FAFB] text-[#1F2937] px-10 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C94B4B] border border-[#E5E7EB]"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[#4B5563] mb-1 text-sm font-medium">Phone Number</label>
              <div className="relative">
                <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4B5563]" />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full bg-[#F9FAFB] text-[#1F2937] px-10 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C94B4B] border border-[#E5E7EB]"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[#4B5563] mb-1 text-sm font-medium">Vehicle Number</label>
              <div className="relative">
                <FaCar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4B5563]" />
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleInputChange}
                  className="w-full bg-[#F9FAFB] text-[#1F2937] px-10 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C94B4B] border border-[#E5E7EB]"
                  placeholder="e.g. ABC-123"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[#4B5563] mb-1 text-sm font-medium">Vehicle Type</label>
              <div className="relative">
                <FaCogs className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4B5563]" />
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleInputChange}
                  className="w-full bg-[#F9FAFB] text-[#1F2937] px-10 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C94B4B] border border-[#E5E7EB] appearance-none"
                >
                  <option value="car">Car</option>
                  <option value="bike">Motorcycle/Scooter</option>
                  <option value="van">Van/SUV</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-4 pt-2">
              <button
                type="submit"
                className="flex-1 bg-[#C94B4B] text-white py-3 rounded-lg font-semibold hover:bg-[#C94B4B]/90 transition-colors flex items-center justify-center"
              >
                <FaSave className="mr-2" />
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-[#F3F4F6] text-[#4B5563] py-3 rounded-lg font-semibold hover:bg-[#E5E7EB] transition-colors flex items-center justify-center"
              >
                <FaTimes className="mr-2" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <div className="flex">
                <FaEnvelope className="text-[#4B5563] mr-3 mt-1" />
                <div>
                  <p className="text-[#4B5563] text-sm">Email</p>
                  <p className="text-[#1F2937] font-medium">{userEmail}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <div className="flex">
                <FaUser className="text-[#4B5563] mr-3 mt-1" />
                <div>
                  <p className="text-[#4B5563] text-sm">Full Name</p>
                  <p className="text-[#1F2937] font-medium">{userName}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <div className="flex">
                <FaPhone className="text-[#4B5563] mr-3 mt-1" />
                <div>
                  <p className="text-[#4B5563] text-sm">Phone Number</p>
                  <p className="text-[#1F2937] font-medium">{userPhone}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <div className="flex">
                <FaCar className="text-[#4B5563] mr-3 mt-1" />
                <div>
                  <p className="text-[#4B5563] text-sm">Vehicle Number</p>
                  <p className="text-[#1F2937] font-medium">{userVehicleNumber}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <div className="flex">
                <FaCogs className="text-[#4B5563] mr-3 mt-1" />
                <div>
                  <p className="text-[#4B5563] text-sm">Vehicle Type</p>
                  <p className="text-[#1F2937] font-medium">{userVehicleType.charAt(0).toUpperCase() + userVehicleType.slice(1)}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-[#C94B4B] text-white py-3 rounded-lg font-semibold hover:bg-[#C94B4B]/90 transition-colors flex items-center justify-center"
            >
              <FaEdit className="mr-2" />
              Edit Profile
            </button>
          </div>
        )}
      </div>
      
      {/* Add custom style for consistent font application */}
      <style jsx>{`
        * {
          font-family: 'Proxima Nova', 'Roboto', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default UserProfile;