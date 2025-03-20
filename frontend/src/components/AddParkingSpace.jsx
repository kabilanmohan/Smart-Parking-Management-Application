import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { FaArrowLeft, FaMapMarkerAlt, FaParking, FaDollarSign, FaCar, FaMotorcycle, FaBuilding } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Loader from './Loader';

const AddParkingSpace = ({ onBack }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [formData, setFormData] = useState({
    Name: '',
    Address: '',
    TotalSlots: 0,
    AvailableSlots: 0,
    levels: 1,
    pricing: {
      car: 0,
      bike: 0
    },
    location: {
      latitude: 0,
      longitude: 0
    }
  });
  
  // Get user's current location for default map position
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'TotalSlots' || name === 'AvailableSlots' || name === 'levels' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  const handlePricingChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [name]: parseFloat(value) || 0
      }
    }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: parseFloat(value) || 0
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.Name || !formData.Address) {
      setMessage({ 
        text: 'Please provide a name and address for the parking space.', 
        type: 'error' 
      });
      return;
    }

    if (formData.TotalSlots <= 0) {
      setMessage({ 
        text: 'Total slots must be greater than zero.', 
        type: 'error' 
      });
      return;
    }

    if (formData.location.latitude === 0 && formData.location.longitude === 0) {
      setMessage({ 
        text: 'Please provide valid location coordinates.', 
        type: 'error' 
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare the data for Firestore
      const parkingSpaceData = {
        Name: formData.Name,
        Address: formData.Address,
        TotalSlots: formData.TotalSlots,
        AvailableSlots: formData.AvailableSlots || formData.TotalSlots, // Default to total if not specified
        levels: formData.levels,
        pricing: {
          car: formData.pricing.car,
          bike: formData.pricing.bike
        },
        location: new GeoPoint(formData.location.latitude, formData.location.longitude),
        ownerid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        averageRating: 0, // Initialize with zero rating
      };

      // Add document to Firestore
      const docRef = await addDoc(collection(db, "ParkingSpaces"), parkingSpaceData);
      
      setMessage({ 
        text: `Parking space "${formData.Name}" created successfully! ID: ${docRef.id}`, 
        type: 'success' 
      });
      
      // Clear form after successful submission
      setFormData({
        Name: '',
        Address: '',
        TotalSlots: 0,
        AvailableSlots: 0,
        levels: 1,
        pricing: {
          car: 0,
          bike: 0
        },
        location: {
          latitude: formData.location.latitude,
          longitude: formData.location.longitude
        }
      });

        // In the handleSubmit function, update the redirection logic:
        setTimeout(() => {
            // We need to communicate with the dashboard that we want to show the grid setup
            // with this specific parking space ID
            console.log("Redirecting to setup-grid with ID:", docRef.id);
            navigate(`/admin-dashboard?id=${docRef.id}&levels=${formData.levels}`);
        }, 2000);
      
    } catch (error) {
      console.error("Error adding parking space:", error);
      setMessage({ 
        text: `Failed to create parking space: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return <Loader text="Creating parking space..." />;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#1F2937] flex items-center">
          <FaParking className="mr-2 text-[#8373BF]" />
          Add New Parking Space
        </h2>
        <button 
          onClick={onBack}
          className="text-[#4B5563] hover:text-[#8373BF] transition-colors flex items-center"
        >
          <FaArrowLeft className="mr-1" />
          Back to Dashboard
        </button>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' 
          : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#1F2937] flex items-center">
              <FaBuilding className="mr-2 text-[#8373BF]" />
              Basic Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-[#4B5563] mb-1">
                Parking Space Name*
              </label>
              <input
                type="text"
                name="Name"
                value={formData.Name}
                onChange={handleInputChange}
                className="w-full p-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8373BF]"
                placeholder="e.g., Central City Parking"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#4B5563] mb-1">
                Address*
              </label>
              <input
                type="text"
                name="Address"
                value={formData.Address}
                onChange={handleInputChange}
                className="w-full p-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8373BF]"
                placeholder="e.g., 123 Main Street, Gotham City"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4B5563] mb-1">
                  Total Slots*
                </label>
                <input
                  type="number"
                  name="TotalSlots"
                  min="1"
                  value={formData.TotalSlots}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8373BF]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#4B5563] mb-1">
                  Available Slots
                </label>
                <input
                  type="number"
                  name="AvailableSlots"
                  min="0"
                  max={formData.TotalSlots}
                  value={formData.AvailableSlots}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8373BF]"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#4B5563] mb-1">
                Number of Levels
              </label>
              <input
                type="number"
                name="levels"
                min="1"
                max="10"
                value={formData.levels}
                onChange={handleInputChange}
                className="w-full p-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8373BF]"
              />
            </div>
          </div>
          
          {/* Pricing and Location Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#1F2937] flex items-center">
              <FaDollarSign className="mr-2 text-[#8373BF]" />
              Pricing & Location
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4B5563] mb-1 items-center">
                  <FaCar className="mr-1 text-[#C94B4B]" />
                  Car Rate ($/hr)
                </label>
                <input
                  type="number"
                  name="car"
                  min="0"
                  step="0.01"
                  value={formData.pricing.car}
                  onChange={handlePricingChange}
                  className="w-full p-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8373BF]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#4B5563] mb-1 items-center">
                  <FaMotorcycle className="mr-1 text-[#3B82F6]" />
                  Bike Rate ($/hr)
                </label>
                <input
                  type="number"
                  name="bike"
                  min="0"
                  step="0.01"
                  value={formData.pricing.bike}
                  onChange={handlePricingChange}
                  className="w-full p-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8373BF]"
                />
              </div>
            </div>
            
            <h3 className="font-semibold text-[#1F2937] flex items-center mt-4">
              <FaMapMarkerAlt className="mr-2 text-[#C94B4B]" />
              Location Coordinates
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#4B5563] mb-1">
                  Latitude*
                </label>
                <input
                  type="number"
                  name="latitude"
                  step="any"
                  value={formData.location.latitude}
                  onChange={handleLocationChange}
                  className="w-full p-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8373BF]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#4B5563] mb-1">
                  Longitude*
                </label>
                <input
                  type="number"
                  name="longitude"
                  step="any"
                  value={formData.location.longitude}
                  onChange={handleLocationChange}
                  className="w-full p-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8373BF]"
                  required
                />
              </div>
            </div>
            
            <div className="bg-[#F9FAFB] p-3 rounded-lg mt-2">
              <p className="text-sm text-[#4B5563]">
                <strong>Tip:</strong> You can find coordinates by right-clicking on a location in Google Maps and selecting What s here?
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 bg-[#F9FAFB] text-[#4B5563] rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-[#8373BF] text-white rounded-lg hover:bg-[#8373BF]/80 transition-colors"
            disabled={isSubmitting}
          >
            Create Parking Space
          </button>
        </div>
      </form>
    </div>
  );
};
AddParkingSpace.propTypes = {
  onBack: PropTypes.func.isRequired
};

export default AddParkingSpace;
