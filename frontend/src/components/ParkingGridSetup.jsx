import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { FaArrowLeft, FaParking, FaCarSide, FaMotorcycle, FaArrowRight, FaLongArrowAltUp, FaLongArrowAltDown, FaSave, FaTimes, FaInfoCircle } from 'react-icons/fa';
import PropTypes from 'prop-types';
import Loader from './Loader';

const CELL_TYPES = {
  ENTRY: 0,
  PATHWAY: 1,
  CAR: 2,
  BIKE: 3,
  EXIT: 4
};

const ParkingGridSetup = ({ onBack, parkingSpaceId: propId, totalLevels: propLevels }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use prop value OR URL parameter, this ensures we have a value from either source
  const searchParams = new URLSearchParams(location.search);
  const parkingSpaceId = propId || searchParams.get("id");
  const totalLevels = propLevels || parseInt(searchParams.get("levels")) || 1;
  
  // Debug: Log the ID when component mounts
  useEffect(() => {
    console.log("ParkingGridSetup - Parking Space ID:", parkingSpaceId);
    console.log("ParkingGridSetup - Total Levels:", totalLevels);
  }, [parkingSpaceId, totalLevels]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [parkingSpaceData, setParkingSpaceData] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [gridSize, setGridSize] = useState({ rows: 5, cols: 8 });
  const [selectedTool, setSelectedTool] = useState(CELL_TYPES.CAR);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // State for each level's grid
  const [gridData, setGridData] = useState({});
  const [availabilityData, setAvailabilityData] = useState({});
  const [priceData, setPriceData] = useState({});
  
  // Initialize data for all levels
  useEffect(() => {
    // Only display error if not loading AND no ID
    if (!parkingSpaceId) {
      setMessage({
        text: 'No parking space ID provided. Please create a parking space first.',
        type: 'error'
      });
      return;
    }
    
    // Only fetch if we have an ID and we're not already loading
    if (parkingSpaceId) {
      fetchParkingSpace();
    }
    
    async function fetchParkingSpace() {
      try {
        setIsLoading(true);
        console.log("Fetching parking space with ID:", parkingSpaceId);
        
        const docRef = doc(db, "ParkingSpaces", parkingSpaceId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          console.log("Parking space found:", docSnap.data());
          setParkingSpaceData(docSnap.data());
          
          // Initialize grid data for all levels
          const initialGrids = {};
          const initialAvailability = {};
          const initialPrices = {};
          
          for (let level = 1; level <= totalLevels; level++) {
            // Create empty grid with pathways
            initialGrids[level] = Array(gridSize.rows).fill().map(() => 
              Array(gridSize.cols).fill(CELL_TYPES.PATHWAY)
            );
            
            // Initialize with entry points at top row
            initialGrids[level][0][Math.floor(gridSize.cols/2)] = CELL_TYPES.ENTRY;
            
            // Initialize with exit points at bottom row
            initialGrids[level][gridSize.rows-1][Math.floor(gridSize.cols/2)] = CELL_TYPES.EXIT;
            
            // Initialize availability (all free initially)
            initialAvailability[level] = Array(gridSize.rows).fill().map((_, rowIndex) => ({
              rows: rowIndex,
              cols: Array(gridSize.cols).fill().map((_, colIndex) => ({
                isOccupied: false,
                slotId: `L${level}R${rowIndex}C${colIndex}`,
                bookingId: ""
              }))
            }));
            
            // Initialize prices (default values)
            initialPrices[level] = Array(gridSize.rows).fill().map((_, rowIndex) => ({
              row: rowIndex,
              cols: Array(gridSize.cols).fill().map((_, colIndex) => {
                // Default pricing based on cell type
                const cellType = initialGrids[level][rowIndex][colIndex];
                if (cellType === CELL_TYPES.CAR) {
                  return docSnap.data().pricing?.car || 10;
                } else if (cellType === CELL_TYPES.BIKE) {
                  return docSnap.data().pricing?.bike || 5;
                }
                return 0; // No price for pathways, entries, exits
              })
            }));
          }
          
          setGridData(initialGrids);
          setAvailabilityData(initialAvailability);
          setPriceData(initialPrices);
          
          // Clear any previous error messages
          setMessage({ text: '', type: '' });
        } else {
          console.error("Parking space not found with ID:", parkingSpaceId);
          setMessage({
            text: 'Parking space not found. Please create a parking space first.',
            type: 'error'
          });
        }
      } catch (error) {
        console.error("Error fetching parking space:", error);
        setMessage({
          text: `Error fetching parking space: ${error.message}`,
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    }
// Remove isLoading from the dependency array
}, [parkingSpaceId, totalLevels, gridSize.rows, gridSize.cols]);

  // Handle cell click to change type
  const handleCellClick = (rowIndex, colIndex) => {
    setGridData(prev => {
      const updatedGrid = { ...prev };
      
      // Update the grid with selected tool
      updatedGrid[currentLevel] = [...updatedGrid[currentLevel]];
      updatedGrid[currentLevel][rowIndex] = [...updatedGrid[currentLevel][rowIndex]];
      updatedGrid[currentLevel][rowIndex][colIndex] = selectedTool;
      
      // Also update the availability and price data accordingly
      updateAvailabilityAndPrice(rowIndex, colIndex, selectedTool);
      
      return updatedGrid;
    });
  };
  
  // Update availability and price when cell type changes
  const updateAvailabilityAndPrice = (rowIndex, colIndex, cellType) => {
    // Update availability - only car and bike spots are "slots"
    setAvailabilityData(prev => {
      const updated = { ...prev };
      updated[currentLevel] = [...updated[currentLevel]];
      
      if (cellType === CELL_TYPES.CAR || cellType === CELL_TYPES.BIKE) {
        // This is a parking spot, make it available
        updated[currentLevel][rowIndex].cols[colIndex] = {
          isOccupied: false,
          slotId: `L${currentLevel}R${rowIndex}C${colIndex}`,
          bookingId: ""
        };
      } else {
        // This is not a parking spot (pathway, entry, exit)
        updated[currentLevel][rowIndex].cols[colIndex] = {
          isOccupied: false,
          slotId: "",
          bookingId: ""
        };
      }
      
      return updated;
    });
    
    // Update pricing
    setPriceData(prev => {
      const updated = { ...prev };
      updated[currentLevel] = [...updated[currentLevel]];
      
      // Set price based on cell type
      if (cellType === CELL_TYPES.CAR) {
        updated[currentLevel][rowIndex].cols[colIndex] = parkingSpaceData?.pricing?.car || 10;
      } else if (cellType === CELL_TYPES.BIKE) {
        updated[currentLevel][rowIndex].cols[colIndex] = parkingSpaceData?.pricing?.bike || 5;
      } else {
        updated[currentLevel][rowIndex].cols[colIndex] = 0; // No price for non-spots
      }
      
      return updated;
    });
  };
  
  // Update the handleGridSizeChange function to use a callback to avoid race conditions
const handleGridSizeChange = (e) => {
  const { name, value } = e.target;
  const newValue = parseInt(value) || 3;
  
  // Use a callback to ensure we have the latest state values
  setGridSize(prev => {
    const newSize = { ...prev, [name]: newValue };
    
    // Initialize new grid data only once with the updated size
    initializeGridData(newSize, totalLevels);
    
    return newSize;
  });
};

// Create a separate function for grid initialization to avoid code duplication
const initializeGridData = (size, levels) => {
  const initialGrids = {};
  const initialAvailability = {};
  const initialPrices = {};
  
  for (let level = 1; level <= levels; level++) {
    // Grid initialization code (same as before)
    // ...
  }
  
  setGridData(initialGrids);
  setAvailabilityData(initialAvailability);
  setPriceData(initialPrices);
};
  
  // Save the parking grid layout to Firestore
  const handleSave = async () => {
    if (!parkingSpaceId) {
      setMessage({
        text: 'Cannot save: No parking space ID provided.',
        type: 'error'
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Count the number of car and bike spots for reporting
      let totalCarSpots = 0;
      let totalBikeSpots = 0;
      
      Object.values(gridData).forEach(grid => {
        grid.forEach(row => {
          row.forEach(cell => {
            if (cell === CELL_TYPES.CAR) totalCarSpots++;
            if (cell === CELL_TYPES.BIKE) totalBikeSpots++;
          });
        });
      });
      
      // Prepare data for ParkingSlots collection
      const parkingSlotData = {
        levels: {},
        ParkingSpaceID: parkingSpaceId, // Store just the ID string
        createdAt: serverTimestamp()
      };
      
      // Format data according to schema
      for (let level = 1; level <= totalLevels; level++) {
        parkingSlotData.levels[level] = {
          grid: gridData[level].map((row, rowIndex) => ({
            cols: row,
            row: rowIndex
          })),
          availability: availabilityData[level],
          prices: priceData[level]
        };
      }
      
      console.log("Saving ParkingSlots document with ID:", parkingSpaceId);
      console.log("ParkingSlot data:", parkingSlotData);
      
      // Save to Firestore - ParkingSlots collection
      await setDoc(doc(db, "ParkingSlots", parkingSpaceId), parkingSlotData);
      
      // Update ParkingSpaces document with reference to ParkingSlots and total count
      await setDoc(doc(db, "ParkingSpaces", parkingSpaceId), {
        ParkingSlotId: parkingSpaceId, // Store just the ID string, not a reference
        TotalSlots: totalCarSpots + totalBikeSpots,
        AvailableSlots: totalCarSpots + totalBikeSpots, // Initially all spots are available
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setMessage({
        text: `Parking grid saved successfully! Created ${totalCarSpots} car spots and ${totalBikeSpots} bike spots.`,
        type: 'success'
      });
      
      // Auto-redirect after a short delay
      setTimeout(() => {
        navigate('/admin-dashboard');
      }, 3000);
      
    } catch (error) {
      console.error("Error saving parking grid:", error);
      setMessage({
        text: `Error saving parking grid: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loader text="Loading parking grid setup..." />;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#1F2937] flex items-center">
          <FaParking className="mr-2 text-[#8373BF]" />
          Setup Parking Grid - {parkingSpaceData?.Name}
        </h2>
        <button 
          onClick={onBack}
          className="text-[#4B5563] hover:text-[#8373BF] transition-colors flex items-center"
        >
          <FaArrowLeft className="mr-1" />
          Back to Dashboard
        </button>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' 
          : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar - Tools and Controls */}
        <div className="lg:col-span-1">
          <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB] mb-4">
            <h3 className="font-semibold text-[#1F2937] mb-3">Tools</h3>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSelectedTool(CELL_TYPES.ENTRY)}
                className={`p-3 rounded-lg flex flex-col items-center ${
                  selectedTool === CELL_TYPES.ENTRY 
                    ? 'bg-[#8373BF] text-white' 
                    : 'bg-white border border-[#E5E7EB] hover:bg-[#F1F0FF]'
                }`}
              >
                <FaLongArrowAltDown className="text-xl mb-1" />
                <span className="text-xs">Entry</span>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedTool(CELL_TYPES.PATHWAY)}
                className={`p-3 rounded-lg flex flex-col items-center ${
                  selectedTool === CELL_TYPES.PATHWAY 
                    ? 'bg-[#8373BF] text-white' 
                    : 'bg-white border border-[#E5E7EB] hover:bg-[#F1F0FF]'
                }`}
              >
                <FaArrowRight className="text-xl mb-1" />
                <span className="text-xs">Pathway</span>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedTool(CELL_TYPES.CAR)}
                className={`p-3 rounded-lg flex flex-col items-center ${
                  selectedTool === CELL_TYPES.CAR 
                    ? 'bg-[#8373BF] text-white' 
                    : 'bg-white border border-[#E5E7EB] hover:bg-[#F1F0FF]'
                }`}
              >
                <FaCarSide className="text-xl mb-1" />
                <span className="text-xs">Car Spot</span>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedTool(CELL_TYPES.BIKE)}
                className={`p-3 rounded-lg flex flex-col items-center ${
                  selectedTool === CELL_TYPES.BIKE 
                    ? 'bg-[#8373BF] text-white' 
                    : 'bg-white border border-[#E5E7EB] hover:bg-[#F1F0FF]'
                }`}
              >
                <FaMotorcycle className="text-xl mb-1" />
                <span className="text-xs">Bike Spot</span>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedTool(CELL_TYPES.EXIT)}
                className={`p-3 rounded-lg flex flex-col items-center ${
                  selectedTool === CELL_TYPES.EXIT 
                    ? 'bg-[#8373BF] text-white' 
                    : 'bg-white border border-[#E5E7EB] hover:bg-[#F1F0FF]'
                }`}
              >
                <FaLongArrowAltUp className="text-xl mb-1" />
                <span className="text-xs">Exit</span>
              </button>
            </div>
            
            <h3 className="font-semibold text-[#1F2937] mb-3">Grid Size</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-[#4B5563] mb-1">Rows</label>
                <input
                  type="number"
                  name="rows"
                  value={gridSize.rows}
                  onChange={handleGridSizeChange}
                  min="3"
                  max="15"
                  className="w-full p-2 border border-[#E5E7EB] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-[#4B5563] mb-1">Columns</label>
                <input
                  type="number"
                  name="cols"
                  value={gridSize.cols}
                  onChange={handleGridSizeChange}
                  min="3"
                  max="15"
                  className="w-full p-2 border border-[#E5E7EB] rounded-lg"
                />
              </div>
            </div>
            
            <h3 className="font-semibold text-[#1F2937] mb-3">Levels</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {Array.from({ length: totalLevels }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentLevel(i + 1)}
                  className={`px-3 py-2 rounded-lg ${
                    currentLevel === i + 1
                      ? 'bg-[#8373BF] text-white'
                      : 'bg-white border border-[#E5E7EB] hover:bg-[#F1F0FF]'
                  }`}
                >
                  Level {i + 1}
                </button>
              ))}
            </div>
            
            <div className="mt-6">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3 bg-[#8373BF] text-white rounded-lg hover:bg-[#8373BF]/80 transition-colors flex items-center justify-center"
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Parking Grid
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={onBack}
                className="w-full mt-2 py-3 bg-[#F9FAFB] text-[#4B5563] rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors flex items-center justify-center"
              >
                <FaTimes className="mr-2" />
                Cancel
              </button>
            </div>
          </div>
          
          <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
            <div className="flex items-center mb-2 text-[#1F2937]">
              <FaInfoCircle className="mr-2 text-[#8373BF]" />
              <h3 className="font-semibold">Instructions</h3>
            </div>
            <ul className="text-sm text-[#4B5563] space-y-2">
              <li>• Select a tool from the toolbar</li>
              <li>• Click on the grid cells to place items</li>
              <li>• Each level must have at least one entry and exit</li>
              <li>• Add car and bike parking spots as needed</li>
              <li>• Use pathways to create driving lanes</li>
              <li>• Switch between levels using the level buttons</li>
            </ul>
          </div>
        </div>
        
        {/* Right area - Grid */}
        <div className="lg:col-span-3">
          <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
            <h3 className="font-semibold text-[#1F2937] mb-4">
              Level {currentLevel} Layout
            </h3>
            
            <div className="overflow-auto">
              <div className="inline-block bg-white p-3 rounded-lg border border-[#E5E7EB]">
                <div className="grid grid-cols-1 gap-1">
                  {gridData[currentLevel]?.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-1">
                      {row.map((cell, colIndex) => (
                        <div
                          key={colIndex}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                          className={`w-14 h-14 flex items-center justify-center cursor-pointer rounded transition-all ${
                            cell === CELL_TYPES.ENTRY ? 'bg-green-600 text-white' :
                            cell === CELL_TYPES.PATHWAY ? 'bg-gray-200' :
                            cell === CELL_TYPES.CAR ? 'bg-[#C94B4B] text-white' :
                            cell === CELL_TYPES.BIKE ? 'bg-blue-500 text-white' :
                            cell === CELL_TYPES.EXIT ? 'bg-yellow-500 text-white' :
                            'bg-gray-100'
                          }`}
                        >
                          {cell === CELL_TYPES.ENTRY && <FaLongArrowAltDown size={20} />}
                          {cell === CELL_TYPES.PATHWAY && <FaArrowRight size={16} />}
                          {cell === CELL_TYPES.CAR && <FaCarSide size={20} />}
                          {cell === CELL_TYPES.BIKE && <FaMotorcycle size={20} />}
                          {cell === CELL_TYPES.EXIT && <FaLongArrowAltUp size={20} />}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-[#4B5563]">
                <span className="font-medium">Current Tool:</span> {
                  selectedTool === CELL_TYPES.ENTRY ? 'Entry' :
                  selectedTool === CELL_TYPES.PATHWAY ? 'Pathway' :
                  selectedTool === CELL_TYPES.CAR ? 'Car Spot' :
                  selectedTool === CELL_TYPES.BIKE ? 'Bike Spot' :
                  selectedTool === CELL_TYPES.EXIT ? 'Exit' : ''
                }
              </div>
              
              <div className="text-sm text-[#4B5563]">
                <span className="font-medium">Grid Size:</span> {gridSize.rows} × {gridSize.cols}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ParkingGridSetup.propTypes = {
  onBack: PropTypes.func.isRequired,
  parkingSpaceId: PropTypes.string,
  totalLevels: PropTypes.number
};

export default ParkingGridSetup;