import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { FaExclamationCircle, FaCheckCircle, FaClock, FaSpinner, FaEye } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const UserComplaints = ({ inDashboard = false }) => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(false);

  useEffect(() => {
    const fetchUserComplaints = async () => {
      if (!auth.currentUser) {
        setError("You must be logged in to view complaints.");
        setLoading(false);
        return;
      }

      try {
        const userId = auth.currentUser.uid;
        const apiUrl = `${import.meta.env.VITE_API_URL || ''}/api/user-complaints/${userId}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch complaints: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Sort complaints by date (newest first)
        const sortedData = data.sort((a, b) => {
          // Handle Firestore timestamps
          const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date();
          const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date();
          return dateB - dateA;
        });
        
        setComplaints(sortedData);
      } catch (err) {
        console.error("Error fetching complaints:", err);
        setError("Failed to load complaints. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserComplaints();
  }, []);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'resolved':
        return <FaCheckCircle className="text-green-500" />;
      case 'in-progress':
        return <FaClock className="text-orange-500" />;
      case 'pending':
      default:
        return <FaExclamationCircle className="text-yellow-500" />;
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'resolved':
        return <span className="text-green-500 font-medium">Resolved</span>;
      case 'in-progress':
        return <span className="text-orange-500 font-medium">In Progress</span>;
      case 'pending':
      default:
        return <span className="text-yellow-500 font-medium">Pending</span>;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    
    // Handle Firestore timestamp objects
    const date = timestamp.seconds 
      ? new Date(timestamp.seconds * 1000) 
      : new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setViewingDetails(true);
  };

  const ComplaintDetails = () => {
    if (!selectedComplaint) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Complaint Details</h2>
              <button 
                onClick={() => setViewingDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="https://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center space-x-2 border-b pb-4">
              <div className="p-2 rounded-full bg-gray-100">
                {getStatusIcon(selectedComplaint.status)}
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{getStatusText(selectedComplaint.status)}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg">{selectedComplaint.subject}</h3>
              <p className="text-sm text-gray-500 mb-2">
                Submitted on {formatDate(selectedComplaint.createdAt)}
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mt-2">
                <p className="whitespace-pre-wrap">{selectedComplaint.message}</p>
              </div>
              
              {selectedComplaint.imageUrl && (
                <div className="mt-4">
                  <p className="text-sm font-semibold mb-2">Attached Image:</p>
                  <img 
                    src={selectedComplaint.imageUrl} 
                    alt="Complaint attachment" 
                    className="rounded-lg max-h-64 w-auto"
                  />
                </div>
              )}
              
              {selectedComplaint.parkingSpotName && (
                <div className="mt-4 bg-blue-50 p-4 rounded-lg">
                  <p className="font-semibold">Related Parking Spot:</p>
                  <p>{selectedComplaint.parkingSpotName}</p>
                  {selectedComplaint.parkingSpotAddress && (
                    <p className="text-gray-600">{selectedComplaint.parkingSpotAddress}</p>
                  )}
                </div>
              )}
              
              {selectedComplaint.notes && selectedComplaint.notes.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Admin Notes:</p>
                  <div className="space-y-2">
                    {selectedComplaint.notes.map((note, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-500">{formatDate(note.timestamp)}</p>
                        <p>{note.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setViewingDetails(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const containerClass = inDashboard 
    ? "w-full" 
    : "min-h-screen bg-[#F9FAFB] p-4 font-['Proxima_Nova','Roboto',sans-serif]";

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin text-4xl text-[#C94B4B] mb-4" />
          <p className="text-gray-600">Loading your complaints...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-center">
        <FaExclamationCircle className="text-red-500 text-3xl mx-auto mb-2" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB]">
        <div className="text-center py-8">
          <img 
            src="/empty-state.svg" 
            alt="No complaints" 
            className="w-32 h-32 mx-auto mb-4 opacity-50"
            onError={(e) => e.target.style.display = 'none'}
          />
          <p className="text-gray-500 mb-2">You haven t submitted any complaints yet.</p>
          <p className="text-gray-400 text-sm">
            Any complaints you submit will appear here.
          </p>
          <button
            onClick={() => navigate("/help-support")}
            className="mt-4 bg-[#C94B4B] text-white px-4 py-2 rounded-md hover:bg-[#C94B4B]/90 transition-colors"
          >
            Submit a Complaint
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB]">
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <div 
              key={complaint.id} 
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(complaint.status)}
                  <span className="font-medium text-gray-700">{complaint.subject}</span>
                </div>
                <button
                  onClick={() => handleViewDetails(complaint)}
                  className="text-[#C94B4B] hover:text-[#C94B4B]/80 flex items-center space-x-1 text-sm"
                >
                  <FaEye />
                  <span className="hidden sm:inline">View Details</span>
                </button>
              </div>
              
              <div className="p-4">
                <div className="flex flex-wrap gap-y-2 text-sm text-gray-500 mb-2">
                  <span className="mr-4">
                    <strong>Category:</strong> {complaint.category}
                  </span>
                  <span className="mr-4">
                    <strong>Status:</strong> {getStatusText(complaint.status)}
                  </span>
                  <span>
                    <strong>Date:</strong> {formatDate(complaint.createdAt)}
                  </span>
                </div>
                
                <p className="text-gray-700 line-clamp-2">{complaint.message}</p>
                
                {complaint.imageUrl && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">Image attached</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {viewingDetails && <ComplaintDetails />}
    </div>
  );
};

UserComplaints.propTypes = {
  inDashboard: PropTypes.bool
};

UserComplaints.defaultProps = {
  inDashboard: false
};

export default UserComplaints;