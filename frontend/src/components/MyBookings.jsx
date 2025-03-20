import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { FaFilter, FaSort, FaSearch, FaCalendarAlt, FaMapMarkerAlt, FaClock, FaCar, FaParking, FaMoneyBillWave, FaRegCalendarCheck, FaRegWindowClose, FaChevronLeft } from 'react-icons/fa';
import Loader from './Loader';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 5;
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isExtending, setIsExtending] = useState(false);
  const [additionalHours, setAdditionalHours] = useState(1);

  useEffect(() => {
    fetchBookings();
  }, []);

  // Add debugging to the fetchBookings function

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        console.error("No authenticated user");
        setLoading(false);
        return;
      }

      console.log("Fetching bookings for user:", user.uid);

      // Query bookings for the current user
      const q = query(
        collection(db, "bookings"),
        where("userId", "==", user.uid),
        orderBy("checkinTime", "desc")
      );

      const querySnapshot = await getDocs(q);
      console.log("Booking query returned:", querySnapshot.size, "documents");
      
      // Process the bookings data
      const bookingsData = [];
      for (const doc of querySnapshot.docs) {
        const bookingData = doc.data();
        console.log("Processing booking:", doc.id, bookingData);
        
        const booking = {
          id: doc.id,
          ...bookingData,
          checkinTime: bookingData.checkinTime?.toDate() || new Date(),
          checkoutTime: bookingData.checkoutTime?.toDate() || new Date(),
        };

        // Get parking space details if needed
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

        bookingsData.push(booking);
      }

      console.log("Final processed bookings data:", bookingsData.length, "bookings");
      setBookings(bookingsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

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
      fetchBookings();
      
    } catch (error) {
      console.error("Error canceling booking:", error);
      alert("Failed to cancel booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExtendBooking = async (bookingId) => {
    try {
      setLoading(true);
      
      // Get the booking details
      const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
      if (!bookingDoc.exists()) {
        alert("Booking not found!");
        return;
      }
      
      const bookingData = bookingDoc.data();
      
      // Calculate new checkout time
      const currentCheckoutTime = bookingData.checkoutTime.toDate();
      const newCheckoutTime = new Date(currentCheckoutTime);
      newCheckoutTime.setHours(newCheckoutTime.getHours() + additionalHours);
      
      // Calculate additional cost
      const hourlyRate = bookingData.amount / bookingData.hours;
      const additionalCost = hourlyRate * additionalHours;
      
      // Update the booking
      await updateDoc(doc(db, "bookings", bookingId), {
        checkoutTime: newCheckoutTime,
        hours: bookingData.hours + additionalHours,
        amount: bookingData.amount + additionalCost
      });
      
      // Update the slot's checkout time if relevant
      if (bookingData.parkingSpaceId && bookingData.slotDetails) {
        const { level, row, col } = bookingData.slotDetails;
        
        // Get the ParkingSlots document
        const parkingSlotsRef = doc(db, "ParkingSlots", bookingData.parkingSpaceId);
        const parkingSlotsDoc = await getDoc(parkingSlotsRef);
        
        if (parkingSlotsDoc.exists()) {
          const parkingSlotsData = parkingSlotsDoc.data();
          
          if (parkingSlotsData.levels && 
              parkingSlotsData.levels[level] && 
              parkingSlotsData.levels[level].availability) {
            
            const availabilityRow = parkingSlotsData.levels[level].availability.find(
              r => r.rows === row
            );
            
            if (availabilityRow && availabilityRow.cols && availabilityRow.cols[col]) {
              const updatedData = JSON.parse(JSON.stringify(parkingSlotsData));
              
              updatedData.levels[level].availability.find(r => r.rows === row).cols[col] = {
                ...availabilityRow.cols[col],
                checkoutTime: newCheckoutTime.toISOString()
              };
              
              await updateDoc(parkingSlotsRef, updatedData);
            }
          }
        }
      }
      
      alert(`Booking extended by ${additionalHours} hours for an additional $${additionalCost.toFixed(2)}`);
      
      // Reset state and refresh bookings
      setIsExtending(false);
      setAdditionalHours(1);
      setSelectedBooking(null);
      fetchBookings();
      
    } catch (error) {
      console.error("Error extending booking:", error);
      alert("Failed to extend booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings based on selected filter and search query
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.parkingSpaceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.spotNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id?.toLowerCase().includes(searchQuery.toLowerCase());
    
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

  // Check if booking is active and can be extended
  const canExtend = (booking) => {
    return booking.status === 'active' && new Date() < booking.checkoutTime;
  };

  if (loading) {
    return <Loader text="Loading your bookings..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Fixed position back button at the top left of the screen */}
      <button
        onClick={() => navigate('/dashboard')}
        className="fixed top-4 left-4 z-50 flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors shadow-md"
      >
        <FaChevronLeft className="mr-2" />
        Back to Dashboard
      </button>
      
      <div className="mb-8">
        {/* Title centered - removed the back button from here */}
        <div className="text-center mt-10">
          <h1 className="text-2xl font-bold text-[#1F2937]">My Bookings</h1>
          <p className="text-sm text-[#6B7280]">View and manage all your parking bookings</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-3 text-[#4B5563]" />
            <input
              type="text"
              placeholder="Search by location or spot number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] bg-[#F9FAFB] text-[#1F2937]"
            />
          </div>
          
          <div className="flex space-x-2">
            <div className="relative">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1F2937]"
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
              className="flex items-center bg-white px-4 py-2 rounded-lg hover:bg-[#DBEAFE] transition-colors shadow-sm border border-[#E5E7EB]"
            >
              <FaSort className="mr-2 text-[#3B82F6]" />
              <span>{sortOrder === "asc" ? "Oldest First" : "Newest First"}</span>
            </button>
          </div>
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
                  <div className="mt-2 md:mt-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Booking Details */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <p className="text-xs text-[#6B7280]">Parking Location</p>
                      <p className="font-medium text-[#1F2937]">{booking.parkingSpaceName}</p>
                      <p className="text-sm text-[#6B7280] truncate">
                        {booking.parkingSpaceDetails?.Address || ""}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#F3F4F6] p-2 rounded-lg mr-3">
                      <FaClock className="text-[#8B5CF6]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">Duration</p>
                      <p className="font-medium text-[#1F2937]">{booking.hours} hour(s)</p>
                      <p className="text-sm text-[#6B7280]">
                        {new Date() > booking.checkoutTime ? 'Completed' : `Expires ${formatDate(booking.checkoutTime)}`}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-start">
                    <div className="bg-[#F3F4F6] p-2 rounded-lg mr-3">
                      <FaCar className="text-[#10B981]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">Vehicle Type</p>
                      <p className="font-medium text-[#1F2937]">{booking.vehicleType}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#F3F4F6] p-2 rounded-lg mr-3">
                      <FaParking className="text-[#F59E0B]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">Spot Number</p>
                      <p className="font-medium text-[#1F2937]">{booking.spotNumber}</p>
                      <p className="text-sm text-[#6B7280]">
                        Level {booking.parkingLevel || 1}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-[#F3F4F6] p-2 rounded-lg mr-3">
                      <FaMoneyBillWave className="text-[#10B981]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">Amount Paid</p>
                      <p className="font-medium text-[#1F2937]">${booking.amount?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex flex-wrap justify-end space-x-2 mt-6">
                  {canCancel(booking) && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Cancel Booking
                    </button>
                  )}
                  
                  {canExtend(booking) && (
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsExtending(true);
                      }}
                      className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors"
                    >
                      Extend Time
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate(`/parking-lot?id=${booking.parkingSpaceId}`)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    View Parking Lot
                  </button>
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
          <p className="text-[#6B7280] mb-6">You haven t made any bookings yet or none match your current filters.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-[#C94B4B] text-white rounded-lg hover:bg-[#C94B4B]/80 transition-colors"
          >
            Find Parking Spots
          </button>
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
                : 'bg-white text-[#3B82F6] hover:bg-[#DBEAFE] border border-[#E5E7EB]'
            }`}
          >
            Previous
          </button>
          
          {/* Page numbers */}
          {[...Array(pageCount)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === i + 1
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-white text-[#1F2937] hover:bg-[#DBEAFE] border border-[#E5E7EB]'
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
                : 'bg-white text-[#3B82F6] hover:bg-[#DBEAFE] border border-[#E5E7EB]'
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Extend Booking Modal */}
      {isExtending && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-[#1F2937]">Extend Booking</h3>
              <button 
                onClick={() => {
                  setIsExtending(false);
                  setSelectedBooking(null);
                  setAdditionalHours(1);
                }}
                className="text-[#4B5563] hover:text-[#1F2937]"
              >
                <FaRegWindowClose size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-[#4B5563] mb-4">
                Current checkout time: <span className="font-semibold">{formatDate(selectedBooking.checkoutTime)} at {formatTime(selectedBooking.checkoutTime)}</span>
              </p>
              
              <label className="block text-sm font-medium text-[#4B5563] mb-2">
                Additional Hours
              </label>
              <div className="flex items-center mb-4">
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={additionalHours}
                  onChange={(e) => setAdditionalHours(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 p-2 border border-[#E5E7EB] rounded-lg mr-3 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
                <span className="text-[#4B5563]">hours</span>
              </div>
              
              <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB] mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#4B5563]">Current Duration:</span>
                  <span className="font-medium text-[#1F2937]">{selectedBooking.hours} hours</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#4B5563]">Additional Duration:</span>
                  <span className="font-medium text-[#1F2937]">{additionalHours} hours</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#4B5563]">New Checkout Time:</span>
                  <span className="font-medium text-[#1F2937]">
                    {formatTime(new Date(selectedBooking.checkoutTime.getTime() + (additionalHours * 60 * 60 * 1000)))}
                  </span>
                </div>
                <div className="border-t border-[#E5E7EB] my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-[#4B5563]">Additional Cost:</span>
                  <span className="font-medium text-[#1F2937]">
                    ${((selectedBooking.amount / selectedBooking.hours) * additionalHours).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsExtending(false);
                  setSelectedBooking(null);
                  setAdditionalHours(1);
                }}
                className="px-4 py-2 text-[#4B5563] hover:bg-[#F3F4F6] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExtendBooking(selectedBooking.id)}
                className="px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] transition-colors"
              >
                Confirm Extension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;