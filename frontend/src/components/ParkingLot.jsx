import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../../temp"; 
import { doc, getDoc } from "firebase/firestore";
import gcar from "../assets/g_car.png";
import rcar from "../assets/r_car.png";
import gscooter from "../assets/g_scooter.png";
import rscooter from "../assets/r_scooter.png";
import ev from "../assets/EVcharging.png"
import mg from "../assets/magnifying glass.gif"

const ParkingLot = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [numHours, setNumHours] = useState("");
  const [evNeeded, setEvNeeded] = useState("No");
  const [distanceFromEntrance, setDistanceFromEntrance] = useState(50);
  const [distanceFromExit, setDistanceFromExit] = useState(50);
  const [priceRange, setPriceRange] = useState("");
  const selectedSpot = location.state?.selectedSpot || {};
  const [selectedLevel, setSelectedLevel] = useState("1");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [parkingData, setParkingData] = useState(null);
  const [dateTime, setDateTime] = useState(new Date());

  // Fetch parking slot data from Firestore
  useEffect(() => {
    const fetchParkingData = async () => {
      const slotRef = doc(db, "ParkingSlots", "parkingSlot123");
      const slotSnap = await getDoc(slotRef);

      if (slotSnap.exists()) {
        setParkingData(slotSnap.data());
      } else {
        console.log("No such parking slot data found");
      }
    };

    fetchParkingData();
  }, []);

  // Update date and time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle slot selection
  const handleSlotSelection = (row, col, isAvailable) => {
    if (isAvailable) {
      setSelectedSlot({ row, col });
    }
  };

  return (
    <div className="flex flex-row items-start justify-start bg-[#F5F5F5] mt-50 min-h-screen p-6">
      {/* Sticky Bar */}
      {/* Sticky Header */}
        <div className="fixed top-0 left-0 w-full bg-white p-6 flex flex-col items-center z-50 shadow-md">
        <h2 className="text-[#C94B4B] text-3xl font-semibold">{selectedSpot.name || "Parking Lot"}</h2>
        <p className="text-gray-700 text-lg font-medium mt-2">{selectedSpot.address || "Unknown Address"}</p>

        {/* Date and Time Display */}
        <div className="absolute top-4 right-6 text-gray-800 text-lg font-medium">
          {dateTime.toLocaleString()}
        </div>

        <div className="flex space-x-8 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-green-600"></div>
            <span className="text-gray-800 font-medium">Vacant</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-red-600"></div>
            <span className="text-gray-800 font-medium">Occupied</span>
          </div>
          <div className="flex items-center space-x-2">
             <img src={ev} alt="EV" className="w-6 h-6"></img>
            <span className="text-gray-800 font-medium">EV charging</span>
          </div>
        </div>

        {/* Level Selection & Confirm Booking */}
        <div className="flex space-x-4 mt-6">
          {Object.keys(parkingData?.levels || {}).map((level) => (
            <button
              key={level}
              onClick={() => {
                setSelectedLevel(level);
                setSelectedSlot(null);
              }}
              className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedLevel === level
                  ? "bg-[#C94B4B] text-white shadow-lg"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Level {level}
            </button>
          ))}

          {/* Confirm Booking Button */}
          <button
            disabled={!selectedSlot}
            onClick={() => navigate("/payment_module", { state: { selectedSlot } })}
            className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedSlot
                ? "bg-[#1E90FF] text-white hover:bg-[#1C86EE] shadow-md"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Confirm Booking
          </button>
          <button
            onClick={() => setSelectedSlot(null)}
            className="px-5 py-2 rounded-lg font-medium bg-gray-400 text-white hover:bg-gray-500 transition-all duration-200 shadow-md"
          >
            Reset Selection
          </button>
        </div>
      </div>

      {/* Parking Grid */}
      {parkingData?.levels?.[selectedLevel] ? (
        <div className="grid p-0 mt-8 bg-gray-600 rounded-lg shadow-md relative overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${parkingData.levels[selectedLevel].grid[0]?.cols.length || 1}, minmax(0, 1fr))`,
            gap: "0",
            border: "4px dashed #FFC107",
          }}
        >
 {(() => {
            let slotIndex = 0; // Global counter for slot numbering

            return parkingData.levels[selectedLevel].grid.flatMap((row, rowIndex) =>
              row.cols.map((slot, colIndex) => {
                const isAvailable = parkingData.levels[selectedLevel].availability[rowIndex].cols[colIndex];
                const isPathway = slot === 1;
                const isEntryOrExit = slot === 0 || slot === 4;
                
                let slotNumber = null;
                if (!isPathway && !isEntryOrExit) {
                  slotIndex++; // Increment globally across the grid
                  slotNumber = `L${selectedLevel}${String(slotIndex).padStart(2, "0")}`;
                }

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleSlotSelection(rowIndex, colIndex, isAvailable)}
                    className={`w-34 h-40 flex flex-col items-center justify-center text-gray-800 text-xl font-semibold rounded-none cursor-pointer transition-all duration-50 relative
                      ${
                        isEntryOrExit
                          ? "bg-gray-800 text-white border-4 border-yellow-500 cursor-not-allowed"
                          : isPathway
                          ? "bg-gray-600 cursor-not-allowed"
                          : !isAvailable
                          ? "bg-gray-600 cursor-not-allowed border-2 shadow-md border-gray-300"
                          : selectedSlot?.row === rowIndex && selectedSlot?.col === colIndex
                          ? "bg-gray-600 border-5 border-green-500 shadow-lg"
                          : "bg-gray-600 border-2 border-gray-300 hover:border-green-500 hover:shadow-md hover:border-4"
                      }`}
                  >
                    {slotNumber && (
                      <span className="absolute top-0 left-0 bg-white text-gray-800 px-1 py-1 text-xs font-bold shadow-md">
                        {slotNumber}
                      </span>
                    )}

                    {slot === 0 ? (
                      <span className="text-white text-xl font-bold">ENTRY</span>
                    ) : slot === 4 ? (
                      <span className="text-white text-xl font-bold">EXIT</span>
                    ) : slot === 1 ? null : (
                      <>
                        {slot === 2 ? (
                          !isAvailable ? (
                            <>
                            <img src={rcar} alt="Occupied" className="w-20 h-28" />
                            <img src={ev} alt="EV" className="w-7 h-7"></img>
                            </>
                          ) : (
                            <img src={gcar} alt="Available" className="w-20 h-28" />
                          )
                        ) : slot === 3 ? (
                          !isAvailable ? (
                            <img src={rscooter} alt="Occupied" className="w-20 h-30" />
                          ) : (
                            <img src={gscooter} alt="Available" className="w-20 h-30" />
                          )
                        ) : null}
                      </>
                    )}
                  </button>
                );
              })
            );
          })()}

        </div>
      ) : (
        <p className="text-gray-600 mt-6 text-lg">Loading parking slots...</p>
      )}
      <div className="fixed bottom-0 left-0 w-full p-4 flex justify-end shadow-md">
        <div
          className="w-26 h-26 rounded-full bg-white shadow-lg flex items-center justify-center border-4 border-[#1E90FF] cursor-pointer hover:shadow-xl transition-all duration-200"
          onClick={() => setShowForm(!showForm)}
        >
          <img src={mg} className="w-16 h-16 object-contain" alt="Search" />
        </div>
      </div>

      {showForm && (
        <div className="fixed top-60 right-3 h-125 w-65 bg-white shadow-lg p-6 transition-transform transform translate-x-0">
          <h2 className="text-xl font-semibold mb-4">Find Parking Slot</h2>

          {/* Number of Hours */}
          <label className="block text-gray-700 font-medium mb-1">Number of Hours:</label>
          <input
            type="number"
            value={numHours}
            onChange={(e) => setNumHours(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg mb-3"
          />

          {/* EV Needed */}
          <label className="block text-gray-700 font-medium mt-2">EV Needed:</label>
          <div className="flex space-x-4 mt-2 mb-5">
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

          {/* Distance from Entrance (Range Slider) */}
          <label className="block text-gray-700 font-medium mb-1 mt-1">
            Distance from Entrance: {distanceFromEntrance}m
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={distanceFromEntrance}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setDistanceFromEntrance(value);
              setDistanceFromExit(100 - value); // Adjust exit distance dynamically
            }}
            className="w-full cursor-pointer"
          />

          {/* Distance from Exit (Range Slider) */}
          <label className="block text-gray-700 font-medium mb-1 mt-1">
            Distance from Exit: {distanceFromExit}m
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={distanceFromExit}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setDistanceFromExit(value);
              setDistanceFromEntrance(100 - value); // Adjust entrance distance dynamically
            }}
            className="w-full cursor-pointer"
          />
          {/* Price Range */}
          <label className="block text-gray-700 font-medium mb-1">Price Range:</label>
          <input
            type="text"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg mb-4"
          />

          {/* Apply & Close Buttons */}
          <div className="flex justify-between">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 transition-all duration-200"
              onClick={() => alert("Filtering slots...")}
            >
              Apply
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-500 transition-all duration-200"
              onClick={() => setShowForm(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
    
  );
};

export default ParkingLot;
