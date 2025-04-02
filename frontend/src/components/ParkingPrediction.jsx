import  { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChartLine, FaClock, FaCalendarAlt, FaArrowUp, FaArrowDown, FaArrowLeft } from 'react-icons/fa';
import { useParkingPrediction } from '../hooks/useParkingPrediction';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Loader from './Loader';

const ParkingPrediction = () => {
  const { parkingSpaceId } = useParams();
  const navigate = useNavigate();
  
  // Get current date and time
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  
  // Prepare dates for date picker - format as YYYY-MM-DD
  const todayFormatted = now.toISOString().split('T')[0];
  const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
  
  // Default the selected date to today
  const [selectedDate, setSelectedDate] = useState(todayFormatted);
  
  // Default time to current hour + 1
  const nextHour = new Date();
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  const [selectedTime, setSelectedTime] = useState(
    nextHour.toTimeString().split(' ')[0].substring(0, 5)
  );
  
  // State for parking space details
  const [parkingSpace, setParkingSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Memoize the date object so it only changes when selectedDate or selectedTime change
  const targetDateTime = useMemo(() => 
    new Date(`${selectedDate}T${selectedTime}`), 
    [selectedDate, selectedTime]
  );
  
  // Get prediction using our custom hook
  const { prediction, loading: predictionLoading, error } = useParkingPrediction(
    parkingSpaceId, 
    targetDateTime
  );
  
  // Fetch parking space details
  useEffect(() => {
    const getParkingSpace = async () => {
      if (!parkingSpaceId) return;
      console.log("Current parkingSpaceId:", parkingSpaceId);
      try {
        const spaceRef = doc(db, "ParkingSpaces", parkingSpaceId);
        const spaceDoc = await getDoc(spaceRef);
        
        if (spaceDoc.exists()) {
          setParkingSpace({
            id: spaceDoc.id,
            ...spaceDoc.data()
          });
        }
      } catch (err) {
        console.error("Error fetching parking space:", err);
      } finally {
        setLoading(false);
      }
    };
    
    getParkingSpace();
  }, [parkingSpaceId]);
  
  // Helper function to get color based on availability
  const getAvailabilityColor = (prediction) => {
    if (!prediction || prediction.predictedAvailableSlots === null) return 'bg-gray-200';
    
    const ratio = prediction.predictedAvailableSlots / prediction.totalSlots;
    if (ratio > 0.5) return 'bg-green-500';
    if (ratio > 0.2) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Helper to get text description of availability
  const getAvailabilityText = (prediction) => {
    if (!prediction || prediction.predictedAvailableSlots === null) 
      return 'Unknown';
    
    const ratio = prediction.predictedAvailableSlots / prediction.totalSlots;
    if (ratio > 0.7) return 'High Availability';
    if (ratio > 0.3) return 'Moderate Availability';
    if (ratio > 0.1) return 'Low Availability';
    return 'Very Limited';
  };
  
  if (loading) {
    return <Loader text="Loading parking space details..." />;
  }
  
  return (
    <div className="min-h-screen bg-[#F9FAFB] p-4">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center text-[#4B5563] hover:text-[#3B82F6]"
        >
          <FaArrowLeft className="mr-2" /> Back
        </button>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-[#C94B4B] text-white p-4">
            <h1 className="text-xl font-bold">
              {parkingSpace?.Name || 'Parking Space'} - Availability Prediction
            </h1>
            <p className="text-sm opacity-90">
              Plan your parking with AI-powered availability predictions
            </p>
          </div>
          
          <div className="p-4">
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#4B5563] mb-1">
                  <FaCalendarAlt className="inline mr-1" /> Date
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8373BF]"
                >
                  <option value={todayFormatted}>Today</option>
                  <option value={tomorrowFormatted}>Tomorrow</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4B5563] mb-1">
                  <FaClock className="inline mr-1" /> Time
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full p-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8373BF]"
                />
              </div>
            </div>
            
            {predictionLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-[#8373BF] border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-[#6B7280]">Calculating prediction...</p>
              </div>
            ) : error ? (
              <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-200">
                <p className="text-yellow-700 mb-2">We are setting up the prediction system.</p>
                <p className="text-yellow-600 text-sm">Please try again in a few minutes while we analyze parking data.</p>
              </div>
            ) : prediction ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg text-[#4B5563]">Predicted Available Spots:</span>
                  <span className="text-2xl font-bold text-[#111827]">
                    {prediction.predictedAvailableSlots !== null ? 
                      `${prediction.predictedAvailableSlots} of ${prediction.totalSlots}` : 'Unknown'}
                  </span>
                </div>
                
                <div className="mb-5">
                  <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getAvailabilityColor(prediction)}`} 
                      style={{ 
                        width: prediction.predictedAvailableSlots !== null ? 
                          `${Math.max(5, Math.min(100, (prediction.predictedAvailableSlots / prediction.totalSlots) * 100))}%` : '0%' 
                      }}
                    ></div>
                  </div>
                  <div className="text-sm font-medium text-[#4B5563] mt-2 text-right">
                    {getAvailabilityText(prediction)}
                  </div>
                </div>
                
                <div className="flex justify-between items-center border-t border-gray-200 pt-4">
                  <div className="flex items-center">
                    <span className="text-sm text-[#4B5563] mr-2">Trend:</span>
                    {prediction.trendingUp ? (
                      <span className="flex items-center text-red-600 text-sm">
                        <FaArrowUp className="mr-1" /> Filling up
                      </span>
                    ) : (
                      <span className="flex items-center text-green-600 text-sm">
                        <FaArrowDown className="mr-1" /> Opening up
                      </span>
                    )}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    prediction.confidence === 'high' ? 'bg-green-100 text-green-800' :
                    prediction.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {prediction.confidence.charAt(0).toUpperCase() + prediction.confidence.slice(1)} confidence
                  </div>
                </div>
                
                {prediction.isWeekend && (
                  <div className="mt-4 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    Weekend rates applied to this prediction
                  </div>
                )}
                
                {prediction.predictedAvailableSlots === null && (
                  <div className="mt-2 text-sm text-amber-600">
                    {prediction.message || "Insufficient historical data for this time period"}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Based on {prediction.dataPoints} historical data points
                </p>
              </div>
            ) : (
              <div className="text-center text-[#6B7280] py-2">
                No prediction available
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="font-semibold text-lg mb-2 flex items-center">
            <FaChartLine className="mr-2 text-[#3B82F6]" /> How This Works
          </h2>
          <p className="text-[#4B5563] mb-3">
            Our AI prediction system analyzes historical parking data and patterns to estimate future availability.
          </p>
          <ul className="list-disc pl-5 text-sm text-[#4B5563]">
            <li className="mb-1">We collect data at regular intervals throughout each day</li>
            <li className="mb-1">Our system identifies patterns based on day of week and time</li>
            <li className="mb-1">Recent trends are weighted more heavily than older data</li>
            <li className="mb-1">The confidence level indicates how reliable our prediction is</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ParkingPrediction;