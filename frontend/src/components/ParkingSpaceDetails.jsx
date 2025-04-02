import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaMapMarkerAlt, FaStar, FaCarAlt, FaParking, FaRegClock, FaArrowLeft, FaRoute, FaCalendarCheck, FaRegStar, FaComment, FaChevronDown, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaLanguage, FaGlobe, FaBell, FaChartLine } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where, orderBy, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

const ParkingSpaceDetails = ({ space, onClose, onBookNow, onDirections }) => {
  // Existing state variables
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackUpdated, setFeedbackUpdated] = useState(false);
  
  // Add states for feedback display
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [activeSentimentFilter, setActiveSentimentFilter] = useState('all');
  const [activeLanguageFilter, setActiveLanguageFilter] = useState('all'); // New state for language filter
  const [displayCount, setDisplayCount] = useState(3);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false); // State for dropdown visibility
  
  // New state for status notification
  const [statusNotification, setStatusNotification] = useState({
    show: false,
    type: 'success', // 'success', 'error', or 'warning'
    message: '',
  });

  const [isNotifying, setIsNotifying] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch feedbacks when component mounts or when space changes
  useEffect(() => {
    if (space?.id) {
      fetchFeedbacks();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space?.id, feedbackUpdated]);

  // Auto-hide status notification after 5 seconds
  useEffect(() => {
    if (statusNotification.show) {
      const timer = setTimeout(() => {
        setStatusNotification(prev => ({ ...prev, show: false }));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [statusNotification.show]);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLanguageDropdown && !event.target.closest('.language-dropdown')) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown]);

  // Check if user is already subscribed to notifications for this space
  useEffect(() => {
    const checkNotificationStatus = async () => {
      if (!auth.currentUser || !space?.id) return;
      
      try {
        const notificationsRef = collection(db, "notifications");
        const q = query(
          notificationsRef, 
          where("userId", "==", auth.currentUser.uid),
          where("parkingSpaceId", "==", space.id),
          where("active", "==", true)
        );
        
        const querySnapshot = await getDocs(q);
        setIsSubscribed(!querySnapshot.empty);
      } catch (error) {
        console.error("Error checking notification status:", error);
      }
    };
    
    checkNotificationStatus();
  }, [space?.id]);

  // Function to fetch feedbacks from Firestore
  const fetchFeedbacks = async () => {
    try {
      setLoadingFeedbacks(true);
      // Using try/catch with temporary solution until index is built
      try {
        const q = query(
          collection(db, 'feedbacks'),
          where('parkingSpaceId', '==', space.id),
          orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const feedbackData = [];
        
        querySnapshot.forEach((doc) => {
          feedbackData.push({ id: doc.id, ...doc.data() });
        });
        
        setFeedbacks(feedbackData);
      } catch (indexError) {
        console.warn("Index not ready, falling back to client-side sorting:", indexError);
        // Fallback solution while index is building
        const q = query(
          collection(db, 'feedbacks'),
          where('parkingSpaceId', '==', space.id)
        );
        
        const querySnapshot = await getDocs(q);
        const feedbackData = [];
        
        querySnapshot.forEach((doc) => {
          feedbackData.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort in JavaScript
        feedbackData.sort((a, b) => {
          if (a.timestamp && b.timestamp) {
            return b.timestamp.toDate() - a.timestamp.toDate();
          }
          return 0;
        });
        
        setFeedbacks(feedbackData);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      // Show error notification for fetch issues
      setStatusNotification({
        show: true,
        type: 'error',
        message: 'Failed to load feedbacks. Please try again later.'
      });
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!userRating) {
      setFeedbackMessage('Please provide a star rating');
      return;
    }

    if (!feedbackText.trim()) {
      setFeedbackMessage('Please provide feedback text');
      return;
    }

    if (!auth.currentUser) {
      setFeedbackMessage('You must be logged in to submit feedback');
      // Show warning notification
      setStatusNotification({
        show: true,
        type: 'warning',
        message: 'You must be logged in to submit feedback'
      });
      return;
    }

    try {
      setSubmitting(true);
      setFeedbackMessage('');

      // Send feedback to our API endpoint for sentiment analysis
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          feedback: feedbackText,
          userId: auth.currentUser.uid,
          parkingSpaceId: space.id,
          rating: userRating
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      // Parse response to get sentiment result
      const result = await response.json();

      setUserRating(0);
      setFeedbackText('');
      setShowFeedbackForm(false);
      setActiveSentimentFilter('all'); // Reset filter when new feedback is submitted
      setActiveLanguageFilter('all'); // Reset language filter
      setDisplayCount(3); // Reset display count
      
      // Show success notification with sentiment info
      setStatusNotification({
        show: true,
        type: 'success',
        message: `Feedback submitted successfully! Our analysis shows your feedback was ${result.sentiment}.`
      });
      
      // Trigger feedback display to refresh by toggling state
      setFeedbackUpdated(prev => !prev);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Show error notification
      setStatusNotification({
        show: true,
        type: 'error',
        message: 'Failed to submit feedback. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle the notification subscription
  const handleNotifyMe = async () => {
    if (!auth.currentUser) {
      setStatusNotification({
        show: true,
        type: 'warning',
        message: 'You must be logged in to receive notifications'
      });
      return;
    }

    try {
      setIsNotifying(true);
      
      if (isSubscribed) {
        // Cancel notification
        const notificationsRef = collection(db, "notifications");
        const q = query(
          notificationsRef, 
          where("userId", "==", auth.currentUser.uid),
          where("parkingSpaceId", "==", space.id),
          where("active", "==", true)
        );
        
        const querySnapshot = await getDocs(q);
        
        // Delete all active notifications for this space
        const deletePromises = [];
        querySnapshot.forEach((doc) => {
          deletePromises.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deletePromises);
        setIsSubscribed(false);
        
        setStatusNotification({
          show: true,
          type: 'success',
          message: 'Notification canceled successfully'
        });
      } else {
        // Create new notification request
        await addDoc(collection(db, "notifications"), {
          userId: auth.currentUser.uid,
          userEmail: auth.currentUser.email,
          userName: auth.currentUser.displayName || '',
          parkingSpaceId: space.id, 
          parkingSpaceName: space.name,
          createdAt: serverTimestamp(),
          active: true,
          notificationType: 'availability',
        });
        
        setIsSubscribed(true);
        
        setStatusNotification({
          show: true,
          type: 'success',
          message: 'You will be notified when spots become available'
        });
      }
    } catch (error) {
      console.error('Error managing notification subscription:', error);
      setStatusNotification({
        show: true,
        type: 'error',
        message: 'Failed to set up notification. Please try again.'
      });
    } finally {
      setIsNotifying(false);
    }
  };

  // Filter feedbacks based on selected sentiment and language
  const filteredFeedbacks = feedbacks.filter(item => {
    const matchesSentiment = activeSentimentFilter === 'all' || item.sentiment === activeSentimentFilter;
    const matchesLanguage = activeLanguageFilter === 'all' || item.language === activeLanguageFilter;
    return matchesSentiment && matchesLanguage;
  });

  // Calculate if we need to show "View More" button
  const hasMoreFeedbacks = filteredFeedbacks.length > displayCount;
  
  // Get only the feedbacks to display based on current limit
  const feedbacksToDisplay = filteredFeedbacks.slice(0, displayCount);

  // Get language counts for the dropdown
  const getLanguageCounts = () => {
    const counts = { en: 0, ta: 0, hi: 0 };
    feedbacks.forEach(item => {
      if (item.language && counts[item.language] !== undefined) {
        counts[item.language]++;
      } else if (item.language) {
        // Handle other languages not in our predefined list
        counts[item.language] = 1;
      }
    });
    return counts;
  };
  
  const languageCounts = getLanguageCounts();

  const getLanguageName = (code) => {
    switch(code) {
      case 'en': return 'English';
      case 'ta': return 'Tamil';
      case 'hi': return 'Hindi';
      default: return code.toUpperCase();
    }
  };

  if (!space) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow relative">
      {/* Status Notification */}
      {statusNotification.show && (
        <div 
          className={`absolute top-0 left-0 right-0 mx-6 mt-2 p-3 rounded-lg shadow-md flex items-center justify-between transition-all transform ${
            statusNotification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            statusNotification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-yellow-50 text-yellow-800 border border-yellow-200'
          }`}
        >
          <div className="flex items-center">
            {statusNotification.type === 'success' && <FaCheckCircle className="text-green-500 mr-2" />}
            {statusNotification.type === 'error' && <FaTimesCircle className="text-red-500 mr-2" />}
            {statusNotification.type === 'warning' && <FaExclamationTriangle className="text-yellow-500 mr-2" />}
            <p className="text-sm">{statusNotification.message}</p>
          </div>
          <button 
            onClick={() => setStatusNotification(prev => ({ ...prev, show: false }))}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimesCircle />
          </button>
        </div>
      )}

      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={onClose}
          className="flex items-center text-[#4B5563] hover:text-[#C94B4B] transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          <span>Back to List</span>
        </button>
        <span className="text-sm bg-[#DBEAFE] text-[#3B82F6] px-3 py-1 rounded-full">
          {space.spots} spots
        </span>
      </div>
      
      {/* Parking Space Name and Rating */}
      <h2 className="text-xl font-bold text-[#1F2937] mb-2">{space.name}</h2>
      <div className="flex items-center mb-4">
        <FaStar className="text-yellow-500 mr-1" />
        <span className="text-[#4B5563] mr-4">{space.rating} Rating</span>
        <FaMapMarkerAlt className="text-[#C94B4B] mr-1" />
        <span className="text-[#4B5563]">{space.distance} away</span>
      </div>
      
      {/* Address */}
      <div className="p-4 bg-[#F9FAFB] rounded-lg mb-4">
        <p className="text-[#1F2937] font-medium">{space.address}</p>
      </div>
      
      {/* Detailed Information */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center">
          <div className="bg-[#F3F4F6] p-2 rounded-lg mr-3">
            <FaCarAlt className="text-[#C94B4B]" />
          </div>
          <div>
            <p className="text-xs text-[#6B7280]">Car Rate</p>
            <p className="font-semibold text-[#1F2937]">${space.pricing?.car}/hr</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="bg-[#F3F4F6] p-2 rounded-lg mr-3">
            <FaParking className="text-[#3B82F6]" />
          </div>
          <div>
            <p className="text-xs text-[#6B7280]">Bike Rate</p>
            <p className="font-semibold text-[#1F2937]">${space.pricing?.bike}/hr</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="bg-[#F3F4F6] p-2 rounded-lg mr-3">
            <FaRegClock className="text-[#10B981]" />
          </div>
          <div>
            <p className="text-xs text-[#6B7280]">Operating Hours</p>
            <p className="font-semibold text-[#1F2937]">24/7</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="bg-[#F3F4F6] p-2 rounded-lg mr-3">
            <FaParking className="text-[#8B5CF6]" />
          </div>
          <div>
            <p className="text-xs text-[#6B7280]">Levels</p>
            <p className="font-semibold text-[#1F2937]">{space.levels || 1}</p>
          </div>
        </div>
      </div>
      {/* Features */}
      <div className="mb-6">
        <h3 className="font-semibold text-[#1F2937] mb-2">Features</h3>
        <div className="flex flex-wrap gap-2">
          {['Covered Parking', 'Security', 'CCTV', 'EV Charging', 'Accessible'].map((feature, index) => (
            <span 
              key={index} 
              className="text-xs bg-[#F9FAFB] text-[#4B5563] px-3 py-1 rounded-full border border-[#E5E7EB]"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <button
          onClick={() => onDirections(space)}
          className="flex items-center justify-center bg-[#3B82F6] text-white py-3 rounded-lg hover:bg-[#2563EB] transition-colors"
        >
          <FaRoute className="mr-2" />
          Get Directions
        </button>
        
        {Number(space.spots) > 0 ? (
          <button
            onClick={() => onBookNow(space)}
            className="flex items-center justify-center bg-[#C94B4B] text-white py-3 rounded-lg hover:bg-[#C94B4B]/80 transition-colors"
          >
            <FaCalendarCheck className="mr-2" />
            Book Now
          </button>
        ) : (
          <button
            onClick={handleNotifyMe}
            disabled={isNotifying}
            className={`flex items-center justify-center py-3 rounded-lg transition-colors ${
              isNotifying 
                ? "bg-gray-400 text-white cursor-not-allowed" 
                : isSubscribed
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-[#8373BF] hover:bg-[#8373BF]/80 text-white"
            }`}
          >
            <FaBell className="mr-2" />
            {isNotifying 
              ? "Processing..." 
              : isSubscribed 
                ? "Cancel Notification" 
                : "Notify When Available"}
          </button>
        )}
      </div>

      {/* Availability Predictions Link - Now centered */}
      <div className="mt-6 flex justify-center">
        <Link 
          to={`/predictions/${space.id}`}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
        >
          <FaChartLine className="mr-2" /> View Availability Predictions
        </Link>
      </div>

      {/* Feedback Section */}
      <div className="mt-6 border-t border-[#E5E7EB] pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-[#1F2937]">User Feedback</h3>
          <button 
            onClick={() => setShowFeedbackForm(!showFeedbackForm)}
            className="text-sm bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#4B5563] px-3 py-1 rounded-lg transition-colors flex items-center"
          >
            <FaComment className="mr-2" />
            {showFeedbackForm ? 'Cancel' : 'Leave Feedback'}
          </button>
        </div>

        {/* Sentiment and Language Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Sentiment filters */}
          <button
            onClick={() => setActiveSentimentFilter('all')}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              activeSentimentFilter === 'all'
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveSentimentFilter('positive')}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              activeSentimentFilter === 'positive'
                ? 'bg-green-500 text-white'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            Positive
          </button>
          <button
            onClick={() => setActiveSentimentFilter('neutral')}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              activeSentimentFilter === 'neutral'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            Neutral
          </button>
          <button
            onClick={() => setActiveSentimentFilter('negative')}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              activeSentimentFilter === 'negative'
                ? 'bg-red-500 text-white'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
          >
            Negative
          </button>
          
          {/* Language dropdown */}
          <div className="relative ml-2 language-dropdown">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className={`text-xs px-3 py-1 rounded-full transition-colors flex items-center ${
                activeLanguageFilter !== 'all'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
              }`}
            >
              <FaLanguage className="mr-1" />
              {activeLanguageFilter === 'all' ? 'All Languages' : getLanguageName(activeLanguageFilter)}
              <FaChevronDown className="ml-1" />
            </button>
            
            {/* Dropdown menu */}
            {showLanguageDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200">
                <button
                  onClick={() => {
                    setActiveLanguageFilter('all');
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex justify-between items-center ${
                    activeLanguageFilter === 'all' ? 'bg-gray-100' : ''
                  }`}
                >
                  <span className="flex items-center">
                    <FaGlobe className="mr-2 text-gray-500" />
                    All Languages
                  </span>
                  <span className="text-xs text-gray-500">{feedbacks.length}</span>
                </button>
                
                {Object.entries(languageCounts).map(([code, count]) => count > 0 && (
                  <button
                    key={code}
                    onClick={() => {
                      setActiveLanguageFilter(code);
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex justify-between items-center ${
                      activeLanguageFilter === code ? 'bg-gray-100' : ''
                    }`}
                  >
                    <span>{getLanguageName(code)}</span>
                    <span className="text-xs text-gray-500">{count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Feedback Form */}
        {showFeedbackForm && (
          <div className="bg-[#F9FAFB] p-4 rounded-lg mb-4">
            <div className="flex items-center mb-3">
              <div className="mr-2 text-sm text-[#4B5563]">Your Rating:</div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="text-xl focus:outline-none"
                  >
                    {star <= (hoveredRating || userRating) ? (
                      <FaStar className="text-yellow-500" />
                    ) : (
                      <FaRegStar className="text-gray-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Share your experience with this parking spot..."
              className="w-full p-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-[#1F2937] mb-3"
              rows="3"
            />
            {feedbackMessage && (
              <div className={`text-sm mb-3 ${feedbackMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {feedbackMessage}
              </div>
            )}
            <button
              onClick={handleSubmitFeedback}
              disabled={submitting}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:bg-gray-400"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        )}

        {/* Feedback Display (integrated directly) */}
        <div className="space-y-3">
          {loadingFeedbacks ? (
            <div className="p-4 text-center text-[#6B7280]">Loading feedbacks...</div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="p-4 text-center text-[#6B7280]">
              {feedbacks.length === 0 
                ? "No feedbacks yet" 
                : `No ${activeSentimentFilter !== 'all' ? activeSentimentFilter : ''} feedbacks ${activeLanguageFilter !== 'all' ? `in ${getLanguageName(activeLanguageFilter)}` : ''} available`}
            </div>
          ) : (
            <>
              {feedbacksToDisplay.map((item) => (
                <div 
                  key={item.id} 
                  className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i}>
                          {i < item.rating ? (
                            <FaStar className="text-yellow-500 text-sm" />
                          ) : (
                            <FaRegStar className="text-gray-400 text-sm" />
                          )}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.language && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                          {getLanguageName(item.language)}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                        item.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.sentiment || 'analyzing...'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-[#1F2937] mb-1">{item.feedback}</p>
                  <div className="text-xs text-[#6B7280]">
                    {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleString() : 'Just now'}
                  </div>
                </div>
              ))}
              
              {/* View More Button */}
              {hasMoreFeedbacks && (
                <button
                  onClick={() => setDisplayCount(prev => prev + 3)}
                  className="w-full py-2 px-4 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#4B5563] rounded-lg flex items-center justify-center text-sm transition-colors mt-2"
                >
                  <FaChevronDown className="mr-2" />
                  View More ({filteredFeedbacks.length - displayCount} remaining)
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

ParkingSpaceDetails.propTypes = {
  space: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    address: PropTypes.string,
    rating: PropTypes.number,
    spots: PropTypes.number,
    distance: PropTypes.string,
    price: PropTypes.string,
    levels: PropTypes.number,
    pricing: PropTypes.shape({
      car: PropTypes.number,
      bike: PropTypes.number
    })
  }),
  onClose: PropTypes.func.isRequired,
  onBookNow: PropTypes.func.isRequired,
  onDirections: PropTypes.func.isRequired
};

export default ParkingSpaceDetails;