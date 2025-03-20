import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, doc, getDoc, orderBy, updateDoc } from 'firebase/firestore';
import { FaFilter, FaSort, FaSearch, FaCalendarAlt, FaMapMarkerAlt, FaMoneyBillWave, 
         FaUser, FaRegCalendarCheck, FaEye, FaRegWindowClose } from 'react-icons/fa';
import Loader from './Loader';

const BookingsList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const bookingsPerPage = 10;
  
  // User caching to avoid repeated fetches
  const [userCache, setUserCache] = useState({});

  // Define fetchBookings using useCallback BEFORE using it in useEffect
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      
      // Query all bookings with sorting by checkin time
      let bookingsQuery;
      
      try {
        // Try with the index (orderBy requires an index)
        bookingsQuery = query(
          collection(db, "bookings"),
          orderBy("checkinTime", "desc")
        );
      } catch (indexError) {
        console.warn("Index not ready, fetching without ordering:", indexError);
        bookingsQuery = query(collection(db, "bookings"));
      }
      
      const querySnapshot = await getDocs(bookingsQuery);
      console.log("Booking query returned:", querySnapshot.size, "documents");
      
      // Process the bookings data
      const bookingsData = [];
      for (const doc of querySnapshot.docs) {
        const bookingData = doc.data();
        
        const booking = {
          id: doc.id,
          ...bookingData,
          checkinTime: bookingData.checkinTime?.toDate() || new Date(),
          checkoutTime: bookingData.checkoutTime?.toDate() || new Date(),
        };

        // Get parking space details
        if (booking.parkingSpaceId) {
          try {
            const parkingSpaceDoc = await getDoc(doc(db, "ParkingSpaces", booking.parkingSpaceId));
            if (parkingSpaceDoc.exists()) {
              booking.parkingSpaceDetails = parkingSpaceDoc.data();
            }
          } catch (error) {
            console.error("Error fetching parking space details:", error);
          }
        }

        // Get basic user info - avoid fetching full details for performance
        if (booking.userId && booking.userId !== 'anonymous') {
          if (userCache[booking.userId]) {
            booking.userDetails = userCache[booking.userId];
          } else {
            try {
              const userDoc = await getDoc(doc(db, "users", booking.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                booking.userDetails = {
                  name: userData.name || 'N/A',
                  email: userData.email || booking.userEmail || 'N/A',
                  phone: userData.phone || 'N/A'
                };
                // Update cache
                setUserCache(prev => ({
                  ...prev,
                  [booking.userId]: booking.userDetails
                }));
              }
            } catch (error) {
              console.error("Error fetching user details:", error);
            }
          }
        }

        bookingsData.push(booking);
      }

      console.log("Processed bookings data:", bookingsData.length, "bookings");
      setBookings(bookingsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [userCache]); // Include userCache as a dependency

  // Now use fetchBookings in useEffect
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]); // Include fetchBookings as a dependency

  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      setLoading(true);
      
      // Get the booking details
      const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
      if (!bookingDoc.exists()) {
        alert("Booking not found!");
        return;
      }
      
      const bookingData = bookingDoc.data();
      
      // Update the booking status
      await updateDoc(doc(db, "bookings", bookingId), {
        status: "canceled"
      });

      // Update the parking slot availability if it has slot details
      if (bookingData.parkingSpaceId && bookingData.slotDetails) {
        const { level, row, col } = bookingData.slotDetails;
        
        // Get the ParkingSlots document
        const parkingSlotsRef = doc(db, "ParkingSlots", bookingData.parkingSpaceId);
        const parkingSlotsDoc = await getDoc(parkingSlotsRef);
        
        if (parkingSlotsDoc.exists()) {
          const parkingSlotsData = parkingSlotsDoc.data();
          
          // Make sure the required paths exist in the data
          if (parkingSlotsData.levels && 
              parkingSlotsData.levels[level] && 
              parkingSlotsData.levels[level].availability) {
            
            // Find the row in availability data
            const availabilityRow = parkingSlotsData.levels[level].availability.find(
              r => r.rows === row
            );
            
            if (availabilityRow && availabilityRow.cols && availabilityRow.cols[col]) {
              // Create a deep copy of the data
              const updatedData = JSON.parse(JSON.stringify(parkingSlotsData));
              
              // Update the isOccupied status
              updatedData.levels[level].availability.find(r => r.rows === row).cols[col] = {
                ...availabilityRow.cols[col],
                isOccupied: false,
                bookingId: ""
              };
              
              // Update the document in Firestore
              await updateDoc(parkingSlotsRef, updatedData);
            }
          }
        }
        
        // Update the ParkingSpaces available slots count
        const parkingSpaceRef = doc(db, "ParkingSpaces", bookingData.parkingSpaceId);
        const parkingSpaceDoc = await getDoc(parkingSpaceRef);
        
        if (parkingSpaceDoc.exists()) {
          const spaceData = parkingSpaceDoc.data();
          await updateDoc(parkingSpaceRef, {
            AvailableSlots: (spaceData.AvailableSlots || 0) + 1
          });
        }
      }
      
      // Refresh bookings
      alert("Booking has been canceled successfully.");
      fetchBookings();
      
    } catch (error) {
      console.error("Error canceling booking:", error);
      alert("Failed to cancel booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Filter bookings based on selected filter and search query
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.parkingSpaceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.spotNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.userDetails?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.userDetails?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'active') return matchesSearch && booking.status === 'active';
    if (selectedFilter === 'completed') return matchesSearch && booking.status === 'completed';
    if (selectedFilter === 'canceled') return matchesSearch && booking.status === 'canceled';
    
    return matchesSearch;
  });

  // Sort bookings
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (sortOrder === "desc") {
      return b.checkinTime - a.checkinTime;
    } else {
      return a.checkinTime - b.checkinTime;
    }
  });

  // Pagination
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = sortedBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const pageCount = Math.ceil(sortedBookings.length / bookingsPerPage);

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if booking is active and can be canceled
  const canCancel = (booking) => {
    return booking.status === 'active' && new Date() < booking.checkoutTime;
  };

  if (loading) {
    return <Loader text="Loading bookings..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#1F2937]">All Bookings</h2>
        <div className="flex items-center">
          <button
            onClick={() => fetchBookings()}
            className="flex items-center bg-[#8373BF] text-white px-4 py-2 rounded-lg hover:bg-[#8373BF]/80 transition-colors"
          >
            <FaRegCalendarCheck className="mr-2" />
            Refresh Bookings
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-3 text-[#4B5563]" />
            <input
              type="text"
              placeholder="Search by user, location or booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8373BF] bg-[#F9FAFB] text-[#1F2937]"
            />
          </div>
          
          <div className="flex space-x-2">
            <div className="relative">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8373BF] text-[#1F2937]"
              >
                <option value="all">All Bookings</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </select>
              <FaFilter className="absolute left-3 top-3 text-[#4B5563]" />
            </div>
            
            <button 
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center bg-white px-4 py-2 rounded-lg hover:bg-[#F3F4F6] transition-colors shadow-sm border border-[#E5E7EB]"
            >
              <FaSort className="mr-2 text-[#8373BF]" />
              <span>{sortOrder === "asc" ? "Oldest First" : "Newest First"}</span>
            </button>
          </div>
        </div>

        <div className="bg-[#F3F4F6] p-3 rounded-lg text-[#4B5563] text-sm">
          <p>Total bookings: <span className="font-bold">{sortedBookings.length}</span> | 
             Active: <span className="font-bold text-green-600">{sortedBookings.filter(b => b.status === 'active').length}</span> | 
             Completed: <span className="font-bold text-blue-600">{sortedBookings.filter(b => b.status === 'completed').length}</span> | 
             Canceled: <span className="font-bold text-red-600">{sortedBookings.filter(b => b.status === 'canceled').length}</span>
          </p>
        </div>
      </div>

      {/* Bookings List */}
      {currentBookings.length > 0 ? (
        <div className="space-y-6">
          {currentBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden">
              {/* Booking Header */}
              <div className="p-6 border-b border-[#E5E7EB]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1F2937]">{booking.parkingSpaceName}</h3>
                    <p className="text-sm text-[#6B7280]">Booking ID: {booking.id}</p>
                  </div>
                  <div className="mt-2 md:mt-0 flex space-x-2 items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    <button 
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetailsModal(true);
                      }}
                      className="text-[#8373BF] hover:text-[#8373BF]/80 p-1"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Booking Details */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-start">
                    <div className="bg-[#F3F4F6] p-2 rounded-lg mr-3">
                      <FaUser className="text-[#8373BF]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">Customer</p>
                      <p className="font-medium text-[#1F2937]">
                        {booking.userDetails?.name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-[#6B7280] truncate max-w-[150px]">
                        {booking.userDetails?.email || booking.userEmail || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#F3F4F6] p-2 rounded-lg mr-3">
                      <FaCalendarAlt className="text-[#3B82F6]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">Date & Time</p>
                      <p className="font-medium text-[#1F2937]">{formatDate(booking.checkinTime)}</p>
                      <p className="text-sm text-[#6B7280]">
                        {formatTime(booking.checkinTime)} - {formatTime(booking.checkoutTime)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#F3F4F6] p-2 rounded-lg mr-3">
                      <FaMapMarkerAlt className="text-[#C94B4B]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">Location & Spot</p>
                      <p className="font-medium text-[#1F2937]">{booking.spotNumber}</p>
                      <p className="text-sm text-[#6B7280] truncate max-w-[150px]">
                        Level {booking.parkingLevel || 1}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#F3F4F6] p-2 rounded-lg mr-3">
                      <FaMoneyBillWave className="text-[#10B981]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">Payment</p>
                      <p className="font-medium text-[#1F2937]">${booking.amount?.toFixed(2)}</p>
                      <p className="text-sm text-[#6B7280]">
                        {booking.hours} hour(s)
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex justify-end space-x-2 mt-6">
                  {canCancel(booking) && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-[#E5E7EB]">
          <div className="inline-block p-4 bg-[#F9FAFB] rounded-full mb-4">
            <FaRegCalendarCheck className="text-4xl text-[#4B5563]" />
          </div>
          <h3 className="text-xl font-semibold text-[#1F2937] mb-2">No bookings found</h3>
          <p className="text-[#6B7280] mb-6">There are no bookings matching your current filters.</p>
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg ${
              currentPage === 1
                ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
                : 'bg-white text-[#8373BF] hover:bg-[#F1F0FF] border border-[#E5E7EB]'
            }`}
          >
            Previous
          </button>
          
          {[...Array(pageCount)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === i + 1
                  ? 'bg-[#8373BF] text-white'
                  : 'bg-white text-[#1F2937] hover:bg-[#F1F0FF] border border-[#E5E7EB]'
              }`}
            >
              {i + 1}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage === pageCount}
            className={`px-4 py-2 rounded-lg ${
              currentPage === pageCount
                ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed'
                : 'bg-white text-[#8373BF] hover:bg-[#F1F0FF] border border-[#E5E7EB]'
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-[#1F2937]">Booking Details</h3>
              <button 
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBooking(null);
                }}
                className="text-[#4B5563] hover:text-[#1F2937]"
              >
                <FaRegWindowClose size={20} />
              </button>
            </div>
            
            <div className="border-t border-[#E5E7EB] py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-[#1F2937] mb-4">Booking Information</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-[#6B7280]">Booking ID</p>
                      <p className="font-medium text-[#1F2937]">{selectedBooking.id}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#6B7280]">Status</p>
                      <p className={`font-medium ${selectedBooking.status === 'active' ? 'text-green-600' : 
                                             selectedBooking.status === 'completed' ? 'text-blue-600' : 'text-red-600'}`}>
                        {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#6B7280]">Created At</p>
                      <p className="font-medium text-[#1F2937]">
                        {selectedBooking.createdAt ? new Date(selectedBooking.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#6B7280]">Duration</p>
                      <p className="font-medium text-[#1F2937]">{selectedBooking.hours} hour(s)</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#6B7280]">Amount Paid</p>
                      <p className="font-medium text-[#1F2937]">${selectedBooking.amount?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-[#1F2937] mb-4">Customer Information</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-[#6B7280]">Name</p>
                      <p className="font-medium text-[#1F2937]">{selectedBooking.userDetails?.name || 'Anonymous'}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#6B7280]">Email</p>
                      <p className="font-medium text-[#1F2937]">{selectedBooking.userDetails?.email || selectedBooking.userEmail || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#6B7280]">User ID</p>
                      <p className="font-medium text-[#1F2937]">{selectedBooking.userId || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#6B7280]">Phone</p>
                      <p className="font-medium text-[#1F2937]">{selectedBooking.userDetails?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold text-[#1F2937] mb-4">Parking Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-[#6B7280]">Parking Space</p>
                      <p className="font-medium text-[#1F2937]">{selectedBooking.parkingSpaceName}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#6B7280]">Location</p>
                      <p className="font-medium text-[#1F2937]">{selectedBooking.parkingSpaceDetails?.Address || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#6B7280]">Spot Number</p>
                      <p className="font-medium text-[#1F2937]">{selectedBooking.spotNumber}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-[#6B7280]">Check-in Time</p>
                      <p className="font-medium text-[#1F2937]">
                        {formatDate(selectedBooking.checkinTime)} at {formatTime(selectedBooking.checkinTime)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#6B7280]">Check-out Time</p>
                      <p className="font-medium text-[#1F2937]">
                        {formatDate(selectedBooking.checkoutTime)} at {formatTime(selectedBooking.checkoutTime)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-[#6B7280]">Vehicle Type</p>
                      <p className="font-medium text-[#1F2937]">{selectedBooking.vehicleType || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-[#E5E7EB] pt-4 mt-6 flex justify-end">
              {canCancel(selectedBooking) && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleCancelBooking(selectedBooking.id);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsList;