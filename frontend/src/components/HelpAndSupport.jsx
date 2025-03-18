import { useState, useEffect } from 'react';
import { FaSearch, FaQuestionCircle, FaEnvelope, FaPhone, FaMapMarkerAlt, FaExclamationCircle, FaArrowLeft } from "react-icons/fa";
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from "../firebase";
import Loader from './Loader';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const HelpAndSupport = () => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    parkingSpotId: '',
    category: 'general' // general, parking-spot, payment, account, other
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [loading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Add a function to handle back navigation
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Fetch parking spaces for search functionality
  useEffect(() => {
    const fetchParkingSpaces = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "ParkingSpaces"));
        const spaces = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          spaces.push({
            id: doc.id,
            name: data.Name,
            address: data.Address || "No address provided",
          });
        });
        setParkingSpaces(spaces);
      } catch (error) {
        console.error("Error fetching parking spaces:", error);
      }
    };

    fetchParkingSpaces();
  }, []);

  // Filter parking spaces based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    const filteredSpaces = parkingSpaces.filter(space => 
      space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setSearchResults(filteredSpaces);
    setShowSearchResults(true);
  }, [searchQuery, parkingSpaces]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      category: value,
      parkingSpotId: value !== 'parking-spot' ? '' : prev.parkingSpotId,
    }));
    setSelectedSpace(null);
  };

  const handleSpaceSelect = (space) => {
    setSelectedSpace(space);
    setFormData(prev => ({
      ...prev,
      parkingSpotId: space.id
    }));
    setSearchQuery(space.name);
    setShowSearchResults(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      setMessage({ text: 'You must be logged in to submit a complaint', type: 'error' });
      return;
    }

    if (!formData.subject.trim() || !formData.message.trim()) {
      setMessage({ text: 'Please fill in all required fields', type: 'error' });
      return;
    }

    if (formData.category === 'parking-spot' && !formData.parkingSpotId) {
      setMessage({ text: 'Please select a parking spot', type: 'error' });
      return;
    }

    setSubmitting(true);

    try {
      // Create FormData object for multipart form data
      const formDataToSend = new FormData();
      formDataToSend.append('userId', auth.currentUser.uid);
      formDataToSend.append('userEmail', auth.currentUser.email);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('message', formData.message);
      formDataToSend.append('category', formData.category);
      
      if (formData.parkingSpotId) {
        formDataToSend.append('parkingSpotId', formData.parkingSpotId);
      }
      
      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/submit-complaint`, {
        method: 'POST',
        body: formDataToSend, // Don't set Content-Type header here, it will be set automatically
      });

      if (!response.ok) {
        throw new Error('Failed to submit complaint');
      }

      // Reset form
      setFormData({
        subject: '',
        message: '',
        parkingSpotId: '',
        category: 'general'
      });
      setSelectedSpace(null);
      setSearchQuery('');
      setSelectedFile(null);
      setImagePreview(null);
      
      setMessage({ text: 'Your complaint has been submitted successfully', type: 'success' });
    } catch (error) {
      console.error('Error submitting complaint:', error);
      setMessage({ text: 'Failed to submit complaint. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
      // Clear message after 5 seconds
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    }
  };

  if (loading) {
    return <Loader text="Loading help & support..." />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1F2937] font-['Proxima_Nova','Roboto',sans-serif]">
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50">
        <button 
          onClick={handleBackToDashboard}
          className="flex items-center px-4 py-2 bg-white text-[#4B5563] rounded-lg border border-[#E5E7EB] shadow-sm hover:bg-[#F9FAFB] transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6 pt-16">
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6 mb-8">
          <div className="flex items-center mb-6">
            <FaQuestionCircle className="text-[#C94B4B] text-3xl mr-4" />
            <h2 className="text-2xl font-bold text-[#1F2937]">Help & Support</h2>
          </div>

          <p className="text-[#4B5563] mb-6">
            Having issues with our parking service? Submit a complaint or request assistance below.
            Our support team will get back to you within 24 hours.
          </p>

          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
              'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <p className="flex items-center">
                <FaExclamationCircle className="mr-2" />
                {message.text}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[#4B5563] mb-2 font-medium" htmlFor="category">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
                className="w-full bg-[#F9FAFB] text-[#1F2937] px-4 py-3 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#C94B4B]"
                required
              >
                <option value="general">General Complaint</option>
                <option value="parking-spot">Specific Parking Spot</option>
                <option value="payment">Payment Issue</option>
                <option value="account">Account Problem</option>
                <option value="other">Other</option>
              </select>
            </div>

            {formData.category === 'parking-spot' && (
              <div>
                <label className="block text-[#4B5563] mb-2 font-medium" htmlFor="parkingSpotSearch">
                  Search Parking Spot *
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3.5 text-[#4B5563]" />
                  <input
                    type="text"
                    id="parkingSpotSearch"
                    placeholder="Search for a parking spot..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C94B4B] bg-[#F9FAFB] text-[#1F2937]"
                  />
                  
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute w-full mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto custom-scrollbar">
                      {searchResults.map((space) => (
                        <button
                          key={space.id}
                          type="button"
                          onClick={() => handleSpaceSelect(space)}
                          className="w-full text-left px-4 py-3 hover:bg-[#DBEAFE] border-b border-[#E5E7EB] last:border-b-0 transition-colors"
                        >
                          <div className="font-semibold text-[#1F2937]">{space.name}</div>
                          <div className="text-sm text-[#4B5563]">{space.address}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {showSearchResults && searchQuery.trim() !== '' && searchResults.length === 0 && (
                    <div className="absolute w-full mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-10 p-4 text-center">
                      <p className="text-[#4B5563]">No parking spots found matching &quot;{searchQuery}&quot;</p>
                    </div>
                  )}
                </div>

                {selectedSpace && (
                  <div className="mt-2 p-3 bg-[#F3F4F6] rounded-lg border border-[#E5E7EB] flex items-start">
                    <FaMapMarkerAlt className="text-[#C94B4B] mt-1 mr-2" />
                    <div>
                      <p className="font-medium text-[#1F2937]">{selectedSpace.name}</p>
                      <p className="text-sm text-[#4B5563]">{selectedSpace.address}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-[#4B5563] mb-2 font-medium" htmlFor="subject">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Brief description of your issue"
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C94B4B] bg-[#F9FAFB] text-[#1F2937]"
                required
              />
            </div>

            <div>
              <label className="block text-[#4B5563] mb-2 font-medium" htmlFor="message">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Describe your issue in detail..."
                rows="5"
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C94B4B] bg-[#F9FAFB] text-[#1F2937]"
                required
              ></textarea>
            </div>

            {/* Image Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#4B5563] mb-2">
                Upload Image (Optional)
              </label>
              <div className="mt-1 flex items-center flex-col sm:flex-row gap-4">
                <div className="w-full">
                  <label className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-[#C94B4B] focus:outline-none">
                    <span className="flex items-center space-x-2 text-sm text-[#6B7280]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>
                        {selectedFile ? selectedFile.name : 'Click to upload an image'}
                      </span>
                    </span>
                    <input 
                      type="file" 
                      name="image" 
                      accept="image/*"
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                {imagePreview && (
                  <div className="relative w-full sm:w-32 h-32 border rounded-md overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-[#6B7280]">
                Supported formats: JPG, PNG, GIF (max 5MB)
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full bg-[#C94B4B] text-white py-3 rounded-lg font-semibold hover:bg-[#C94B4B]/90 transition-colors flex items-center justify-center ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6">
          <h3 className="text-xl font-bold text-[#1F2937] mb-4">Contact Us</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <div className="flex items-center">
                <div className="bg-[#F3F4F6] p-2 rounded-lg mr-3">
                  <FaEnvelope className="text-[#C94B4B]" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Email Support</p>
                  <p className="font-medium text-[#1F2937]">applicationsmartparking@gmail.com</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <div className="flex items-center">
                <div className="bg-[#F3F4F6] p-2 rounded-lg mr-3">
                  <FaPhone className="text-[#3B82F6]" />
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Customer Service</p>
                  <p className="font-medium text-[#1F2937]">+91 1234567890</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpAndSupport;