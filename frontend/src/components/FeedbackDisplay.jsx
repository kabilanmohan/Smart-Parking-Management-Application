import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

const FeedbackDisplay = ({ parkingSpaceId, maxItems = 3 }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'feedbacks'),
          where('parkingSpaceId', '==', parkingSpaceId),
          orderBy('timestamp', 'desc'),
          limit(maxItems)
        );
        
        const querySnapshot = await getDocs(q);
        const feedbackData = [];
        
        querySnapshot.forEach((doc) => {
          feedbackData.push({ id: doc.id, ...doc.data() });
        });
        
        setFeedbacks(feedbackData);
      } catch (error) {
        console.error('Error fetching feedbacks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (parkingSpaceId) {
      fetchFeedbacks();
    }
  }, [parkingSpaceId, maxItems]);

  if (loading) {
    return <div className="p-4 text-center text-[#6B7280]">Loading feedbacks...</div>;
  }

  if (feedbacks.length === 0) {
    return <div className="p-4 text-center text-[#6B7280]">No feedbacks yet</div>;
  }

  return (
    <div className="space-y-3">
      {feedbacks.map((item) => (
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
            <span className={`text-xs px-2 py-1 rounded-full ${
              item.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
              item.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {item.sentiment || 'analyzing...'}
            </span>
          </div>
          <p className="text-sm text-[#1F2937] mb-1">{item.feedback}</p>
          <div className="text-xs text-[#6B7280]">
            {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleString() : 'Just now'}
          </div>
        </div>
      ))}
    </div>
  );
};

FeedbackDisplay.propTypes = {
  parkingSpaceId: PropTypes.string.isRequired,
  maxItems: PropTypes.number
};

export default FeedbackDisplay;