import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../../temp"; 
import { doc, getDoc } from "firebase/firestore";
import gcar from "../assets/g_car.png";
import rcar from "../assets/r_car.png";
import gscooter from "../assets/g_scooter.png";
import rscooter from "../assets/r_scooter.png";

const ParkingLot = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedSpot = location.state?.selectedSpot || {};
  const [selectedLevel, setSelectedLevel] = useState("1"); // Default to Level-1
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [parkingData, setParkingData] = useState(null);

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

  // Handle slot selection
  const handleSlotSelection = (row, col, isAvailable) => {
    if (isAvailable) {
      setSelectedSlot({ row, col });
    }
  };

  return (
    <div className="flex flex-col items-center bg-[#F5F5F5] min-h-screen p-6">
      {/* Sticky Bar */}
      <div className="sticky top-0 left-0 w-full bg-white p-6 flex flex-col items-center z-50 shadow-md rounded-b-lg">
        <h2 className="text-[#C94B4B] text-3xl font-semibold">{selectedSpot.name || "Parking Lot"}</h2>
        <p className="text-gray-700 text-lg font-medium mt-2">{selectedSpot.address || "Unknown Address"}</p>
        <div className="flex space-x-8 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-green-600"></div>
            <span className="text-gray-800 font-medium">Vacant</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-red-600"></div>
            <span className="text-gray-800 font-medium">Occupied</span>
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
            onClick={() => navigate("/payment_module")}
            className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedSlot
                ? "bg-[#1E90FF] text-white hover:bg-[#1C86EE] shadow-md"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {selectedSlot
              ? `Confirm Booking ($${parkingData.levels[selectedLevel]?.prices[selectedSlot.row]?.cols?.[selectedSlot.col] || 0})`
              : "Confirm Booking"}
          </button>
        </div>
      </div>

      {/* Parking Grid */}
      {parkingData?.levels?.[selectedLevel] ? (
        <div
          className="grid border-4 border-gray-200 p-6 mt-8 bg-gray-600 rounded-lg shadow-md relative"
          style={{
            gridTemplateColumns: `repeat(${parkingData.levels[selectedLevel].grid[0]?.cols.length || 1}, minmax(60px, 1fr))`,
            gap: "0", // Remove gap between grid items
          }}
        >
          {/* Yellow dashed lines on the edges of the pathway */}
          <div
            className="absolute top-0 left-0 w-full h-2 bg-yellow-400"
            style={{
              background: "repeating-linear-gradient(90deg, #FFC107 0, #FFC107 10px, transparent 10px, transparent 20px)",
            }}
          ></div>
          <div
            className="absolute bottom-0 left-0 w-full h-2 bg-yellow-400"
            style={{
              background: "repeating-linear-gradient(90deg, #FFC107 0, #FFC107 10px, transparent 10px, transparent 20px)",
            }}
          ></div>
          <div
            className="absolute top-0 left-0 h-full w-2 bg-yellow-400"
            style={{
              background: "repeating-linear-gradient(0deg, #FFC107 0, #FFC107 10px, transparent 10px, transparent 20px)",
            }}
          ></div>
          <div
            className="absolute top-0 right-0 h-full w-2 bg-yellow-400"
            style={{
              background: "repeating-linear-gradient(0deg, #FFC107 0, #FFC107 10px, transparent 10px, transparent 20px)",
            }}
          ></div>

          

{(() => {
  let slotCounter = 1; // Start slot numbering from 1
  return parkingData.levels[selectedLevel].grid.map((row, rowIndex) =>
    row.cols.map((slot, colIndex) => {
      const isAvailable = parkingData.levels[selectedLevel].availability[rowIndex].cols[colIndex];
      const isPathway = slot === 1;
      const isEntryOrExit = slot === 0 || slot === 4;

      let slotNumber = null;
      if (!isPathway && !isEntryOrExit) {
        slotNumber = slotCounter++; // Assign sequential number
      }

      return (
        <button
          key={`${rowIndex}-${colIndex}`}
          onClick={() => handleSlotSelection(rowIndex, colIndex, isAvailable)}
          className={`w-30 h-38 flex flex-col items-center justify-center text-gray-800 font-semibold rounded-none cursor-pointer transition-all duration-200 relative
            ${
              isEntryOrExit
                ? "bg-gray-600 text-white border-bg-gray-600 cursor-not-allowed"
                : isPathway
                ? "bg-gray-600 cursor-not-allowed"
                : !isAvailable
                ? "bg-gray-600 cursor-not-allowed border-2 border-gray-300"
                : selectedSlot?.row === rowIndex && selectedSlot?.col === colIndex
                ? "bg-gray-600 border-4 border-green-500 shadow-lg"
                : "bg-gray-600 border-2 border-gray-300 hover:border-green-500 hover:shadow-md"
            }`}
        >
          {slot === 0 ? (
            "ENTRY"
          ) : slot === 4 ? (
            "EXIT"
          ) : slot === 1 ? null : (
            <>
            {slotNumber && (
                <span
                  className={`absolute top-0 left-0 text-white text-xs px-1 py-1 ${
                    isAvailable ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {`L${selectedLevel}${slotNumber}`}
                </span>
              )}
              {slot === 2 ? (
                !isAvailable ? (
                  <img src={rcar} alt="Occupied" className="w-20 h-28" />
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
        <p className="text-gray-700 mt-6 text-lg">Loading parking slots...</p>
      )}
    </div>
  );
};

export default ParkingLot;