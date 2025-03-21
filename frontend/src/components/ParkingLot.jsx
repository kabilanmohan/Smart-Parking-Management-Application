import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase"; 
import { doc, getDoc } from "firebase/firestore";
import { FaArrowRight, FaLongArrowAltUp, FaLongArrowAltDown, FaCarSide, FaMotorcycle, FaFilter, FaTimes } from 'react-icons/fa';
import Loader from "./Loader";

// Define cell types the same way as in ParkingGridSetup
const CELL_TYPES = {
  ENTRY: 0,
  PATHWAY: 1,
  CAR: 2,
  BIKE: 3,
  EXIT: 4
};

const ParkingLot = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(true);
  const [numHours, setNumHours] = useState(1);
  const [evNeeded, setEvNeeded] = useState("no");
  const [vtype, setVtype] = useState(CELL_TYPES.CAR);
  const [distanceFromEntrance, setDistanceFromEntrance] = useState(50);
  const [distanceFromExit, setDistanceFromExit] = useState(50);
  const [priceRange, setPriceRange] = useState("20");
  const [customHours, setCustomHours] = useState("");
  
  // Get parking space ID from URL or location state
  const searchParams = new URLSearchParams(location.search);
  const parkingSpaceId = searchParams.get("id") || 
                      location.state?.parkingSpaceId || 
                      location.state?.selectedSpot?.id;
  
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [parkingSpaceData, setParkingSpaceData] = useState(null);
  const [parkingSlotsData, setParkingSlotsData] = useState(null);
  const [dateTime, setDateTime] = useState(new Date());
  const [highlightedSlots, setHighlightedSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // If no ID provided, redirect or show error
  useEffect(() => {
    if (!parkingSpaceId) {
      setError("No parking space selected. Please choose a parking space.");
      setIsLoading(false); // Important: Make sure to set loading to false even if there's an error
    }
  }, [parkingSpaceId]);

  // Fetch parking data from Firestore based on ID
  useEffect(() => {
    let isMounted = true; // To prevent state updates after unmounting
    
    const fetchParkingData = async () => {
      if (!parkingSpaceId) {
        if (isMounted) setIsLoading(false);
        return;
      }
      
      try {
        console.log("Fetching parking space with ID:", parkingSpaceId);
        
        // Get ParkingSpace document
        const spaceRef = doc(db, "ParkingSpaces", parkingSpaceId);
        const spaceSnap = await getDoc(spaceRef);
        
        if (!isMounted) return; // Check if component is still mounted
        
        if (!spaceSnap.exists()) {
          console.error("Parking space not found with ID:", parkingSpaceId);
          setError("Parking space not found.");
          setIsLoading(false);
          return;
        }
        
        const spaceData = spaceSnap.data();
        console.log("Parking space data:", spaceData);
        setParkingSpaceData(spaceData);
        
        // Get matching ParkingSlots document (uses same ID)
        const slotsRef = doc(db, "ParkingSlots", parkingSpaceId);
        const slotsSnap = await getDoc(slotsRef);
        
        if (!isMounted) return; // Check again if component is still mounted
        
        if (!slotsSnap.exists()) {
          console.error("Parking slots not found with ID:", parkingSpaceId);
          setError("Parking slots configuration not found.");
          setIsLoading(false);
          return;
        }
        
        const slotsData = slotsSnap.data();
        console.log("Parking slots data:", slotsData);
        
        // Check if slots data has the expected structure
        if (!slotsData.levels) {
          console.error("Invalid parking slots data structure:", slotsData);
          setError("Invalid parking configuration. Please contact support.");
          setIsLoading(false);
          return;
        }
        
        setParkingSlotsData(slotsData);
        
        // Set the default level to the first available level
        const availableLevels = Object.keys(slotsData.levels);
        if (availableLevels.length > 0) {
          setSelectedLevel(parseInt(availableLevels[0]));
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching parking data:", error);
        if (isMounted) {
          setError(`Error loading parking data: ${error.message}`);
          setIsLoading(false);
        }
      }
    };
    
    fetchParkingData();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [parkingSpaceId]);

  // Update date and time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Check if a slot is available (not occupied) - with additional error checking
  const isSlotAvailable = (rowIndex, colIndex) => {
    try {
      if (!parkingSlotsData?.levels?.[selectedLevel]?.availability) return false;
      
      const availabilityRow = parkingSlotsData.levels[selectedLevel].availability.find(
        row => row.rows === rowIndex
      );
      
      if (!availabilityRow || !availabilityRow.cols || !availabilityRow.cols[colIndex]) return false;
      
      return !availabilityRow.cols[colIndex].isOccupied;
    } catch (error) {
      console.error("Error checking slot availability:", error);
      return false;
    }
  };
  
  // Get price for a specific slot - with additional error checking
  const getSlotPrice = (rowIndex, colIndex) => {
    try {
      if (!parkingSlotsData?.levels?.[selectedLevel]?.prices) return 0;
      
      const priceRow = parkingSlotsData.levels[selectedLevel].prices.find(
        row => row.row === rowIndex
      );
      
      if (!priceRow || !priceRow.cols || colIndex >= priceRow.cols.length) return 0;
      
      return priceRow.cols[colIndex] || 0;
    } catch (error) {
      console.error("Error getting slot price:", error);
      return 0;
    }
  };
  
  // Handle slot selection
  const handleSlotSelection = (rowIndex, colIndex, cellType) => {
    // Check if slot is valid for selection (car or bike spot and available)
    if ((cellType === CELL_TYPES.CAR || cellType === CELL_TYPES.BIKE) && isSlotAvailable(rowIndex, colIndex)) {
      setSelectedSlot({
        level: selectedLevel,
        row: rowIndex,
        col: colIndex,
        type: cellType,
        price: getSlotPrice(rowIndex, colIndex),
        slotId: `L${selectedLevel}R${rowIndex}C${colIndex}`
      });
    }
  };

  // Apply filters to highlight suitable parking spots
  const handleApplyFilter = () => {
    if (!parkingSlotsData?.levels?.[selectedLevel]?.grid) {
      console.log("Parking data not loaded yet.");
      return;
    }

    const grid = parkingSlotsData.levels[selectedLevel].grid;
    const totalRows = grid.length;
    const proximityEnt = Math.floor(distanceFromEntrance / 10);
    const proximityExit = Math.floor(distanceFromExit / 10);
    const priceLimit = parseFloat(priceRange) || Infinity;

    const slotsToHighlight = [];

    // Iterate through the grid to find slots that match the criteria
    grid.forEach((rowData, rowIndex) => {
      rowData.cols.forEach((cellType, colIndex) => {
        // Skip if not available or not matching vehicle type
        if (!isSlotAvailable(rowIndex, colIndex) || cellType !== parseInt(vtype)) {
          return;
        }
        
        // Get price for this slot
        const price = getSlotPrice(rowIndex, colIndex);
        const matchesPrice = price <= priceLimit;
        
        // Check if the slot is in the correct half of the grid for distance preferences
        const matchesDistance = (distanceFromEntrance <= distanceFromExit) 
          ? (rowIndex <= proximityEnt) 
          : ((totalRows - rowIndex) <= proximityExit);

        // If all criteria match, add the slot to the list to highlight
        if (matchesPrice && matchesDistance) {
          slotsToHighlight.push([rowIndex, colIndex]);
        }
      });
    });

    console.log("Slots to highlight:", slotsToHighlight);
    setHighlightedSlots(slotsToHighlight);
  };

  // Toggle filter sidebar
  const toggleFilterSidebar = () => {
    setShowForm(prev => !prev);
  };

  // If still loading, show loader
  if (isLoading) {
    return <Loader text="Loading parking lot..." />;
  }

  // If error occurred, show error message
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F5] p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg max-w-md text-center">
          <p>{error}</p>
          <button 
            className="mt-4 bg-[#C94B4B] text-white px-4 py-2 rounded-lg hover:bg-[#A53E3E] transition-colors"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start bg-[#F5F5F5] min-h-screen pb-20">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 w-full bg-white p-4 md:p-6 flex flex-col items-center z-50 shadow-md">
        <div className="absolute top-4 left-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-700 hover:text-[#C94B4B] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span className="hidden md:inline">Dashboard</span>
          </button>
        </div>
        
        <h2 className="text-[#C94B4B] text-xl md:text-3xl font-semibold">{parkingSpaceData?.Name || "Parking Lot"}</h2>
        <p className="text-gray-700 text-sm md:text-lg font-medium mt-1">{parkingSpaceData?.Address || "Unknown Address"}</p>

        <div className="absolute top-4 right-4 text-gray-800 text-sm font-medium hidden md:block">
          {dateTime.toLocaleString()}
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-green-600"></div>
            <span className="text-gray-800 text-sm font-medium">Vacant</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-red-600"></div>
            <span className="text-gray-800 text-sm font-medium">Occupied</span>
          </div>
          {selectedSlot && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-blue-700"></div>
              <span className="text-gray-800 text-sm font-medium">Selected</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {/* Level Selection */}
          <div className="flex flex-wrap space-x-2">
            {parkingSlotsData && Object.keys(parkingSlotsData.levels || {}).map((level) => (
              <button
                key={level}
                onClick={() => {
                  setSelectedLevel(parseInt(level));
                  setSelectedSlot(null);
                  setHighlightedSlots([]);
                }}
                className={`px-3 py-1 text-sm rounded-lg font-medium transition-all duration-200 ${
                  selectedLevel === parseInt(level)
                    ? "bg-[#C94B4B] text-white shadow-lg"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                Level {level}
              </button>
            ))}
          </div>
          
          {/* Filter toggle button (visible on mobile) */}
          <button
            onClick={toggleFilterSidebar}
            className="px-3 py-1 rounded-lg bg-gray-200 text-gray-800 flex items-center md:hidden"
          >
            <FaFilter className="mr-1" />
            Filter
          </button>

          {/* Action Buttons */}
          <div className="flex space-x-2 md:space-x-4">
            <button
              disabled={!selectedSlot}
              onClick={() => navigate("/payment", { 
                state: { 
                  selectedSlot,
                  parkingSpaceId,
                  parkingSpaceName: parkingSpaceData?.Name,
                  hours: numHours,
                  totalPrice: selectedSlot ? (selectedSlot.price * numHours) : 0,
                  vehicleType: selectedSlot ? (selectedSlot.type === CELL_TYPES.CAR ? 'Car' : 'Bike') : '',
                  spotNumber: selectedSlot ? selectedSlot.slotId : '',
                  date: new Date().toISOString()
                }
              })}
              className={`px-3 py-1 text-sm rounded-lg font-medium transition-all duration-200 ${
                selectedSlot
                  ? "bg-[#1E90FF] text-white hover:bg-[#1C86EE]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Book {selectedSlot ? `($${selectedSlot.price * numHours})` : ""}
            </button>
            <button
              onClick={() => {
                setSelectedSlot(null);
                setHighlightedSlots([]);
              }}
              className="px-3 py-1 text-sm rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-400 transition-all duration-200"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main content area with grid */}
      <div className="container max-w-6xl mx-auto pt-48 md:pt-52 px-4 flex flex-col items-center">
        {/* Hours Selection - Now centered */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 w-full max-w-3xl">
          <label className="block text-gray-700 font-medium mb-2 text-center">Booking Duration (hours):</label>
          <div className="flex flex-wrap justify-center gap-2">
            {[1, 2, 3, 4, 6, 8].map(hour => (
              <button
                key={hour}
                onClick={() => {
                  setNumHours(hour);
                  setCustomHours("");
                }}
                className={`px-4 py-2 rounded-lg ${
                  numHours === hour && customHours === ""
                    ? "bg-[#C94B4B] text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {hour}h
              </button>
            ))}
            
            {/* Custom hours input */}
            <div className="flex items-center mt-2 w-full sm:w-auto sm:mt-0">
              <input
                type="number"
                min="1"
                max="24"
                value={customHours}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomHours(value);
                  if (value && !isNaN(parseInt(value))) {
                    setNumHours(parseInt(value));
                  }
                }}
                placeholder="Custom hours"
                className="w-24 px-3 py-2 border rounded-lg mr-2"
              />
              <button 
                onClick={() => {
                  if (customHours && !isNaN(parseInt(customHours))) {
                    setNumHours(parseInt(customHours));
                  }
                }}
                className="px-3 py-2 bg-[#C94B4B] text-white rounded-lg hover:bg-[#A53E3E]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
        
        {/* Legend - Make this more prominent */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 w-full max-w-3xl">
          <h3 className="text-lg font-semibold mb-2 text-center">Parking Spot Legend</h3>
          <div className="flex flex-wrap justify-center gap-6 mt-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-500 rounded border-2 border-green-600"></div>
              <span className="text-gray-800 text-sm font-medium">Vacant Spot</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-red-500 rounded border-2 border-red-600"></div>
              <span className="text-gray-800 text-sm font-medium">Occupied Spot</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-600 rounded border-2 border-green-700"></div>
              <span className="text-gray-800 text-sm font-medium">Entry</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-yellow-500 rounded border-2 border-yellow-600"></div>
              <span className="text-gray-800 text-sm font-medium">Exit</span>
            </div>
            {selectedSlot && (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-600 rounded border-2 border-blue-700 ring-2 ring-blue-400"></div>
                <span className="text-gray-800 text-sm font-medium">Selected Spot</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Back to Dashboard button - Mobile only (desktop has it in header) */}
        <div className="mb-6 w-full max-w-3xl md:hidden">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-200 text-gray-800 px-4 py-3 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
        </div>
        
        {/* Parking Grid - Now with better styling */}
        {parkingSlotsData?.levels?.[selectedLevel]?.grid ? (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6 overflow-auto w-full max-w-4xl">
            <h3 className="text-lg font-semibold mb-4 text-center">Level {selectedLevel} Layout</h3>
            
            <div className="flex justify-center">
              <div className="inline-block overflow-hidden">
                <div className="grid grid-cols-1 gap-1">
                  {parkingSlotsData.levels[selectedLevel].grid.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1 justify-center">
                      {row.cols.map((cellType, colIndex) => {
                        const available = isSlotAvailable(rowIndex, colIndex);
                        const isSelected = selectedSlot && 
                                          selectedSlot.level === selectedLevel &&
                                          selectedSlot.row === rowIndex && 
                                          selectedSlot.col === colIndex;
                        const isHighlighted = highlightedSlots.some(([r, c]) => r === rowIndex && c === colIndex);
                        const slotNumber = (cellType === CELL_TYPES.CAR || cellType === CELL_TYPES.BIKE) 
                                          ? `L${selectedLevel}R${rowIndex}C${colIndex}` 
                                          : null;
                        const price = getSlotPrice(rowIndex, colIndex);
                        
                        // Enhanced styling with more prominent borders
                        return (
                          <div
                            key={colIndex}
                            onClick={() => handleSlotSelection(rowIndex, colIndex, cellType)}
                            className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex flex-col items-center justify-center 
                            cursor-pointer rounded-lg transition-all relative border-2 ${
                              isSelected ? 'bg-blue-600 text-white ring-4 ring-blue-400 border-blue-700' :
                              isHighlighted ? 'bg-yellow-500 text-white border-yellow-600' :
                              cellType === CELL_TYPES.ENTRY ? 'bg-green-600 text-white border-green-700' :
                              cellType === CELL_TYPES.PATHWAY ? 'bg-gray-200 border-gray-300' :
                              // New simplified color scheme based on availability
                              (cellType === CELL_TYPES.CAR || cellType === CELL_TYPES.BIKE) ? 
                                (available ? 'bg-green-500 text-white border-green-600' : 
                                            'bg-red-500 text-white border-red-600') :
                              cellType === CELL_TYPES.EXIT ? 'bg-yellow-500 text-white border-yellow-600' :
                              'bg-gray-100 border-gray-200'
                            }`}
                          >
                            {slotNumber && (
                              <span className="absolute top-0 left-0 bg-white text-gray-800 px-1 text-xs font-bold rounded-br">
                                {slotNumber.split('R')[1]}
                              </span>
                            )}
                            
                            {price > 0 && (cellType === CELL_TYPES.CAR || cellType === CELL_TYPES.BIKE) && (
                              <span className="absolute top-0 right-0 bg-white text-gray-800 px-1 text-xs font-bold rounded-bl">
                                ${price}
                              </span>
                            )}
                            
                            {cellType === CELL_TYPES.ENTRY && <FaLongArrowAltDown size={22} />}
                            {cellType === CELL_TYPES.PATHWAY && <FaArrowRight size={16} />}
                            {cellType === CELL_TYPES.CAR && <FaCarSide size={22} />}
                            {cellType === CELL_TYPES.BIKE && <FaMotorcycle size={22} />}
                            {cellType === CELL_TYPES.EXIT && <FaLongArrowAltUp size={22} />}
                            
                            {/* Add availability indicator */}
                            {(cellType === CELL_TYPES.CAR || cellType === CELL_TYPES.BIKE) && (
                              <span className="absolute bottom-0 w-full text-center text-xs font-bold text-white bg-black/20 py-1">
                                {available ? 'VACANT' : 'OCCUPIED'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md text-center w-full max-w-3xl">
            <p className="text-gray-600">No parking layout available for this level.</p>
          </div>
        )}
        
        {/* Booking Button - Made larger and centered */}
        {selectedSlot && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 w-full max-w-3xl text-center">
            <h3 className="text-xl font-semibold mb-4">Book Selected Spot</h3>
            <p className="mb-3">
              <span className="font-bold">Spot:</span> {selectedSlot.slotId} | 
              <span className="font-bold"> Type:</span> {selectedSlot.type === CELL_TYPES.CAR ? 'Car' : 'Bike'} | 
              <span className="font-bold"> Price:</span> ${selectedSlot.price} per hour
            </p>
            <p className="text-lg font-bold mb-4">
              Total: ${selectedSlot.price * numHours} for {numHours} hour{numHours !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => navigate("/payment", { 
                state: { 
                  selectedSlot,
                  parkingSpaceId,
                  parkingSpaceName: parkingSpaceData?.Name,
                  hours: numHours,
                  totalPrice: selectedSlot.price * numHours,
                  vehicleType: selectedSlot.type === CELL_TYPES.CAR ? 'Car' : 'Bike',
                  spotNumber: selectedSlot.slotId,
                  date: new Date().toISOString()
                }
              })}
              className="px-8 py-4 bg-[#1E90FF] text-white text-lg font-bold rounded-lg hover:bg-[#1C86EE] transition-all duration-200 hover:scale-105"
            >
              Proceed to Payment
            </button>
          </div>
        )}
      </div>

      {/* Filter Sidebar */}
      <div className={`fixed top-0 ${showForm ? 'right-0' : '-right-80'} h-full w-80 bg-white shadow-lg p-6 pt-48 md:pt-56 transition-all duration-300 ease-in-out z-40 overflow-y-auto`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Find Parking Spot</h2>
          <button onClick={toggleFilterSidebar} className="text-gray-500 hover:text-gray-700">
            <FaTimes size={18} />
          </button>
        </div>
        
        {/* Vehicle Type */}
        <label className="block text-gray-700 font-medium mt-4">Vehicle Type:</label>
        <div className="flex space-x-4 mt-2">
          <label className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${vtype === CELL_TYPES.CAR ? 'bg-green-500/20' : 'bg-gray-100'}`}>
            <input
              type="radio"
              name="vtype"
              value={CELL_TYPES.CAR}
              checked={vtype === CELL_TYPES.CAR}
              onChange={(e) => setVtype(parseInt(e.target.value))}
              className="form-radio text-green-500"
            />
            <span className="flex items-center"><FaCarSide className="mr-1" /> Car</span>
          </label>
          <label className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${vtype === CELL_TYPES.BIKE ? 'bg-green-500/20' : 'bg-gray-100'}`}>
            <input
              type="radio"
              name="vtype"
              value={CELL_TYPES.BIKE}
              checked={vtype === CELL_TYPES.BIKE}
              onChange={(e) => setVtype(parseInt(e.target.value))}
              className="form-radio text-green-500"
            />
            <span className="flex items-center"><FaMotorcycle className="mr-1" /> Bike</span>
          </label>
        </div>
        
        {/* EV Needed */}
        <label className="block text-gray-700 font-medium mt-4">EV charging needed:</label>
        <div className="flex space-x-4 mt-2">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="evNeeded"
              value="yes"
              checked={evNeeded === "yes"}
              onChange={(e) => setEvNeeded(e.target.value)}
              className="form-radio text-blue-500"
            />
            <span>Yes</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="evNeeded"
              value="no"
              checked={evNeeded === "no"}
              onChange={(e) => setEvNeeded(e.target.value)}
              className="form-radio text-blue-500"
            />
            <span>No</span>
          </label>
        </div>
        
        {/* Distance from Entrance */}
        <label className="block text-gray-700 font-medium mt-4">
          Prefer close to entrance: {distanceFromEntrance}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="10"
          value={distanceFromEntrance}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setDistanceFromEntrance(value);
            setDistanceFromExit(100 - value);
          }}
          className="w-full mt-2"
        />
        
        {/* Distance from Exit */}
        <label className="block text-gray-700 font-medium mt-4">
          Prefer close to exit: {distanceFromExit}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="10"
          value={distanceFromExit}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setDistanceFromExit(value);
            setDistanceFromEntrance(100 - value);
          }}
          className="w-full mt-2"
        />
        
        {/* Price Range */}
        <label className="block text-gray-700 font-medium mt-4">Maximum price per hour:</label>
        <div className="mt-2 relative">
          <span className="absolute left-3 top-2 text-gray-500">$</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border rounded-lg"
          />
        </div>
        
        {/* Apply Button */}
        <button
          className="w-full mt-6 bg-[#C94B4B] text-white px-4 py-3 rounded-lg hover:bg-[#A53E3E] transition-colors"
          onClick={() => {
            handleApplyFilter();
            if (window.innerWidth < 768) {
              toggleFilterSidebar();
            }
          }}
        >
          Find Matching Spots
        </button>
      </div>
      
      {/* Toggle Filter Button (desktop) */}
      <button
        onClick={toggleFilterSidebar}
        className="fixed top-1/2 right-0 transform -translate-y-1/2 bg-[#C94B4B] h-16 w-10 rounded-l-lg shadow-md items-center justify-center z-30 border border-r-0 border-[#C94B4B] hover:bg-[#A53E3E] transition-colors hidden md:flex"
        aria-label="Toggle filters"
      >
        {showForm ? (
          <FaTimes size={16} className="text-white" />
        ) : (
          <FaFilter size={16} className="text-white" />
        )}
      </button>
    </div>
  );
};

export default ParkingLot;