import { useState, useEffect, useMemo } from 'react';
import { FaExclamationCircle, FaCheckCircle, FaClock, FaSpinner, FaEye, FaFilter, FaReply } from 'react-icons/fa';
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [viewingDetails, setViewingDetails] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Get unique categories from complaints for dynamic filter buttons
  const uniqueCategories = useMemo(() => {
    if (!complaints.length) return [];
    
    const categories = new Set();
    complaints.forEach(complaint => {
      if (complaint.category) {
        categories.add(complaint.category.toLowerCase());
      }
    });
    
    return Array.from(categories);
  }, [complaints]);

  useEffect(() => {
    const fetchAllComplaints = async () => {
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL || ''}/api/complaints`;
        
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

    fetchAllComplaints();
  }, []);

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setViewingDetails(true);
    setReplyText('');
  };

  // Updated handleSubmitReply function
  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    
    setSubmitting(true);
    try {
      const newNote = {
        text: replyText,
        timestamp: new Date(),
        adminName: "Admin" // Would come from auth context in real app
      };
      
      // Get current notes or initialize empty array
      const currentNotes = selectedComplaint.notes || [];
      
      // Update in Firestore
      const complaintRef = doc(db, "complaints", selectedComplaint.id);
      await updateDoc(complaintRef, {
        notes: [...currentNotes, newNote],
        status: selectedComplaint.status === 'pending' ? 'in-progress' : selectedComplaint.status,
        updatedAt: new Date()
      });
      
      // Update local state
      const updatedComplaints = complaints.map(complaint => {
        if (complaint.id === selectedComplaint.id) {
          return {
            ...complaint,
            status: complaint.status === 'pending' ? 'in-progress' : complaint.status,
            notes: [...(complaint.notes || []), newNote],
            updatedAt: new Date()
          };
        }
        return complaint;
      });
      
      setComplaints(updatedComplaints);
      
      // Update selected complaint to show new reply immediately
      setSelectedComplaint({
        ...selectedComplaint,
        status: selectedComplaint.status === 'pending' ? 'in-progress' : selectedComplaint.status,
        notes: [...(selectedComplaint.notes || []), newNote],
        updatedAt: new Date()
      });
      
      setReplyText('');
      
    } catch (error) {
      console.error("Error submitting reply to database:", error);
      alert("Failed to submit reply to database. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdatingStatus(true); // Show loading state

      // Update in Firestore database
      const complaintRef = doc(db, "complaints", selectedComplaint.id);
      await updateDoc(complaintRef, {
        status: newStatus,
        updatedAt: new Date() // Optional: track when this was updated
      });
      
      // After successful DB update, update local state to reflect changes immediately
      const updatedComplaints = complaints.map(complaint => {
        if (complaint.id === selectedComplaint.id) {
          return { ...complaint, status: newStatus, updatedAt: new Date() };
        }
        return complaint;
      });
      
      setComplaints(updatedComplaints);
      setSelectedComplaint({ ...selectedComplaint, status: newStatus, updatedAt: new Date() });
      
      // Optionally show success message
      // toast.success("Complaint status updated successfully");
      
    } catch (error) {
      console.error("Error updating status in database:", error);
      alert("Failed to update status in database. Please try again.");
    } finally {
      setUpdatingStatus(false); // Hide loading state
    }
  };

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

  // Update the filteredComplaints function
  const filteredComplaints = complaints.filter(complaint => {
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || complaint.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  // Add this utility function for category styling
  const getCategoryStyle = (category) => {
    const styles = {
      technical: {
        active: 'bg-blue-100 text-blue-800 border border-blue-200',
        inactive: 'bg-gray-100 text-gray-700 hover:bg-blue-50'
      },
      billing: {
        active: 'bg-purple-100 text-purple-800 border border-purple-200',
        inactive: 'bg-gray-100 text-gray-700 hover:bg-purple-50'
      },
      reservation: {
        active: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
        inactive: 'bg-gray-100 text-gray-700 hover:bg-indigo-50'
      },
      safety: {
        active: 'bg-red-100 text-red-800 border border-red-200',
        inactive: 'bg-gray-100 text-gray-700 hover:bg-red-50'
      },
      default: {
        active: 'bg-gray-300 text-gray-800 border border-gray-200',
        inactive: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }
    };
    
    return styles[category] || styles.default;
  };

  const ComplaintDetails = () => {
    if (!selectedComplaint) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-4">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left column - Complaint info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b pb-4">
                  <div className="p-2 rounded-full bg-gray-100">
                    {getStatusIcon(selectedComplaint.status)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">{getStatusText(selectedComplaint.status)}</p>
                  </div>
                  
                  <div className="ml-auto space-x-2">
                    <p className="text-xs text-gray-500 mb-1">Click to change status:</p>
                    
                    <button 
                      onClick={() => handleUpdateStatus('pending')}
                      disabled={updatingStatus}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        selectedComplaint.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 hover:bg-yellow-100'
                      } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Change status to Pending"
                    >
                      {updatingStatus ? (
                        <FaSpinner className="animate-spin inline mr-1" size={10} />
                      ) : null}
                      Pending
                    </button>
                    
                    <button 
                      onClick={() => handleUpdateStatus('in-progress')}
                      disabled={updatingStatus}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        selectedComplaint.status === 'in-progress' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-gray-100 hover:bg-orange-100'
                      } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Change status to In Progress"
                    >
                      {updatingStatus ? (
                        <FaSpinner className="animate-spin inline mr-1" size={10} />
                      ) : null}
                      In Progress
                    </button>
                    
                    <button 
                      onClick={() => handleUpdateStatus('resolved')}
                      disabled={updatingStatus}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        selectedComplaint.status === 'resolved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 hover:bg-green-100'
                      } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Change status to Resolved"
                    >
                      {updatingStatus ? (
                        <FaSpinner className="animate-spin inline mr-1" size={10} />
                      ) : null}
                      Resolved
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg">{selectedComplaint.subject}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Submitted on {formatDate(selectedComplaint.createdAt)}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">From</p>
                  <p className="font-medium">{selectedComplaint.userName || 'Unknown User'}</p>
                  <p className="text-gray-600">{selectedComplaint.userEmail}</p>
                  <p className="text-xs text-gray-500">User ID: {selectedComplaint.userId}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="capitalize">{selectedComplaint.category || 'General'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">Message</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedComplaint.message}</p>
                  </div>
                </div>
                
                {selectedComplaint.imageUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-2">Attached Image:</p>
                    <img 
                      src={selectedComplaint.imageUrl} 
                      alt="Complaint attachment" 
                      className="rounded-lg max-h-64 w-auto border border-gray-200"
                    />
                  </div>
                )}
                
                {selectedComplaint.parkingSpotName && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-semibold">Related Parking Spot:</p>
                    <p>{selectedComplaint.parkingSpotName}</p>
                    {selectedComplaint.parkingSpotAddress && (
                      <p className="text-gray-600">{selectedComplaint.parkingSpotAddress}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Spot ID: {selectedComplaint.parkingSpotId}</p>
                  </div>
                )}
              </div>
              
              {/* Right column - Admin response section */}
              <div className="space-y-4 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-4">
                <h3 className="font-semibold">Admin Response</h3>
                
                {selectedComplaint.notes && selectedComplaint.notes.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto p-2">
                    {selectedComplaint.notes.map((note, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <p className="font-medium text-sm">{note.adminName || 'Admin'}</p>
                          <p className="text-xs text-gray-500">{formatDate(note.timestamp)}</p>
                        </div>
                        <p className="text-gray-700">{note.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No responses yet</p>
                  </div>
                )}
                
                <div className="mt-4">
                  <label htmlFor="replyText" className="block text-sm font-medium text-gray-700 mb-2">
                    Add Reply
                  </label>
                  <textarea
                    id="replyText"
                    rows="4"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-[#8373BF] focus:border-[#8373BF] focus:outline-none transition-colors"
                    placeholder="Type your response here..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitReply}
                    disabled={!replyText.trim() || submitting}
                    className={`flex items-center px-4 py-2 rounded-lg ${
                      !replyText.trim() || submitting
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                        : 'bg-[#8373BF] text-white hover:bg-[#8373BF]/90'
                    } transition-colors`}
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaReply className="mr-2" />
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin text-4xl text-[#8373BF] mb-4" />
          <p className="text-gray-600">Loading complaints...</p>
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937]">Customer Complaints</h2>
          
          {/* Show active filters */}
          {(statusFilter !== 'all' || categoryFilter !== 'all') && (
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <span>Filtered by:</span>
              {statusFilter !== 'all' && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  statusFilter === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  statusFilter === 'in-progress' ? 'bg-orange-100 text-orange-800' : 
                  'bg-green-100 text-green-800'
                }`}>
                  {statusFilter === 'pending' ? 'Pending' : 
                   statusFilter === 'in-progress' ? 'In Progress' : 'Resolved'}
                </span>
              )}
              {categoryFilter !== 'all' && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs capitalize">
                  {categoryFilter}
                </span>
              )}
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FaFilter className="mr-2 text-[#8373BF]" />
          <span>{showFilters ? 'Hide Filters' : 'Filter'}</span>
        </button>
      </div>

      {/* Updated filters section */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
          <div className="space-y-3">
            {/* Status Filters */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Filter by Status:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    statusFilter === 'all' 
                      ? 'bg-[#8373BF] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Statuses
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    statusFilter === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-yellow-50'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('in-progress')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    statusFilter === 'in-progress' 
                      ? 'bg-orange-100 text-orange-800 border border-orange-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-orange-50'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => setStatusFilter('resolved')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    statusFilter === 'resolved' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-green-50'
                  }`}
                >
                  Resolved
                </button>
              </div>
            </div>
            
            {/* Category Filters */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Filter by Category:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    categoryFilter === 'all' 
                      ? 'bg-[#8373BF] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Categories
                </button>
                
                {uniqueCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-3 py-1 rounded-full text-sm capitalize ${
                      categoryFilter === category 
                        ? getCategoryStyle(category).active
                        : getCategoryStyle(category).inactive
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Reset Filters Button */}
            {(statusFilter !== 'all' || categoryFilter !== 'all') && (
              <div className="text-right">
                <button 
                  onClick={() => {
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                  className="text-sm text-[#8373BF] hover:underline"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {complaints.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center py-10">
          <FaExclamationCircle className="text-gray-400 text-4xl mx-auto mb-3" />
          <p className="text-gray-500">No complaints have been submitted yet</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center py-10">
          <p className="text-gray-500">No complaints found with the selected filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredComplaints.map((complaint) => (
            <div 
              key={complaint.id} 
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(complaint.status)}
                  <span className="font-medium text-gray-700">{complaint.subject}</span>
                </div>
                <button
                  onClick={() => handleViewDetails(complaint)}
                  className="text-[#8373BF] hover:text-[#8373BF]/80 flex items-center space-x-1 text-sm"
                >
                  <FaEye />
                  <span className="hidden sm:inline">View Details</span>
                </button>
              </div>
              
              {/* Update the individual complaint card in the listing */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm">
                      {complaint.userName ? complaint.userName.charAt(0) : 'U'}
                    </div>
                    <div>
                      <p className="font-medium">{complaint.userName || 'Unknown User'}</p>
                      <p className="text-sm text-gray-500">{complaint.userEmail}</p>
                    </div>
                  </div>
                  {/* Add category tag */}
                  {complaint.category && (
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs capitalize
                        ${complaint.category === 'technical' ? 'bg-blue-100 text-blue-800' : 
                         complaint.category === 'billing' ? 'bg-purple-100 text-purple-800' : 
                         complaint.category === 'reservation' ? 'bg-indigo-100 text-indigo-800' : 
                         complaint.category === 'safety' ? 'bg-red-100 text-red-800' : 
                         'bg-gray-200 text-gray-800'}`}
                      >
                        {complaint.category}
                      </span>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Message</p>
                  <p className="line-clamp-2 text-gray-700">{complaint.message}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Status:</span>
                    <span>{getStatusText(complaint.status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Date:</span>
                    <span className="text-sm">{formatDate(complaint.createdAt)}</span>
                  </div>
                  {complaint.notes && complaint.notes.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Replies:</span>
                      <span className="text-sm">{complaint.notes.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {viewingDetails && <ComplaintDetails />}
    </div>
  );
};

export default AdminComplaints;