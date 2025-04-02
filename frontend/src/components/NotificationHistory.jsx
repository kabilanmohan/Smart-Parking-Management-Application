import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { FaBell, FaCheck, FaCalendarCheck, FaRegClock, FaHistory, FaParking, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';

const NotificationHistory = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'sent'

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        
        // Query all notifications for the current user
        const notificationsRef = collection(db, "notifications");
        const q = query(
          notificationsRef,
          where("userId", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const notificationData = [];
        
        querySnapshot.forEach((doc) => {
          notificationData.push({ 
            id: doc.id, 
            ...doc.data(), 
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            notifiedAt: doc.data().notifiedAt?.toDate() || null
          });
        });
        
        setNotifications(notificationData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setError("Failed to load notification history. Please try again.");
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(note => 
          note.id === notificationId 
            ? {...note, read: true} 
            : note
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(note => {
    if (filter === 'all') return true;
    if (filter === 'active') return note.active;
    if (filter === 'sent') return !note.active && note.notifiedAt;
    return true;
  });

  if (loading) return <Loader text="Loading notification history..." />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 relative">
      {/* Back to Dashboard Button */}
      <button 
        onClick={() => navigate('/dashboard')}
        className="mb-6 flex items-center px-4 py-2 bg-white text-[#4B5563] rounded-lg border border-[#E5E7EB] shadow-sm hover:text-[#C94B4B] transition-colors hover:shadow-md"
      >
        <FaArrowLeft className="mr-2" />
        <span className="hidden sm:inline">Back to Dashboard</span>
        <span className="sm:hidden">Back</span>
      </button>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#1F2937] flex items-center">
            <FaHistory className="mr-2 text-[#8373BF]" />
            Notification History
          </h2>
          
          {/* Filter buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`text-sm px-3 py-1 rounded-full transition-colors ${
                filter === 'all'
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`text-sm px-3 py-1 rounded-full transition-colors ${
                filter === 'active'
                  ? 'bg-[#8373BF] text-white'
                  : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('sent')}
              className={`text-sm px-3 py-1 rounded-full transition-colors ${
                filter === 'sent'
                  ? 'bg-green-500 text-white'
                  : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
              }`}
            >
              Sent
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {filteredNotifications.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <FaBell className="mx-auto text-gray-300 text-4xl mb-2" />
            <p>No notification history found.</p>
            <p className="text-sm mt-2">
              When you request notifications for parking spaces, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-4 rounded-lg border transition-all ${
                  !notification.read 
                    ? 'bg-blue-50 border-blue-200' 
                    : notification.active
                    ? 'bg-[#F9FAFB] border-[#E5E7EB]'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className={`p-2 rounded-full mr-3 ${
                      notification.active 
                        ? 'bg-[#8373BF]/20 text-[#8373BF]'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {notification.active ? <FaBell /> : <FaCheck />}
                    </div>
                    <div>
                      <h3 className="font-medium text-[#1F2937]">
                        {notification.active 
                          ? `Waiting for spots at ${notification.parkingSpaceName}`
                          : `Spots available at ${notification.parkingSpaceName}`
                        }
                      </h3>
                      <div className="mt-1 text-sm text-[#6B7280] flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center">
                          <FaRegClock className="mr-1" />
                          {notification.createdAt.toLocaleString()}
                        </span>
                        {notification.notifiedAt && (
                          <span className="flex items-center">
                            <FaCheck className="mr-1 text-green-500" />
                            Notified: {notification.notifiedAt.toLocaleString()}
                          </span>
                        )}
                        {notification.availableSpotsAtNotification > 0 && (
                          <span className="flex items-center">
                            <FaParking className="mr-1 text-[#3B82F6]" />
                            {notification.availableSpotsAtNotification} spots
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center">
                    {notification.active ? (
                      <span className="text-xs bg-[#8373BF] text-white px-2 py-1 rounded-full">
                        Active
                      </span>
                    ) : !notification.read ? (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full hover:bg-blue-600"
                      >
                        Mark as read
                      </button>
                    ) : (
                      <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                        Read
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Book now button for sent notifications */}
                {!notification.active && notification.notifiedAt && (
                  <div className="mt-3 flex">
                    <a 
                      href={`/parking-lot?id=${notification.parkingSpaceId}`}
                      className="ml-auto text-sm bg-[#C94B4B] text-white px-3 py-1 rounded-lg hover:bg-[#C94B4B]/80 transition-colors flex items-center"
                    >
                      <FaCalendarCheck className="mr-1" />
                      Book Now
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationHistory;