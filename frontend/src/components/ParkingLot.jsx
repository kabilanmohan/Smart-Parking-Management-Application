import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { db } from "../../temp"; 
import { doc, getDoc } from "firebase/firestore";
import gcar from "../assets/green_car.png";
import rcar from "../assets/red_car.png";
import scooter from "../assets/scooter.png";

const ParkingLot = () => {
  const location = useLocation();
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

  // Determine total slots based on Firestore data
  const totalSlots =
    parkingData?.levels[selectedLevel]?.grid.reduce(
      (sum, row) => sum + row.cols.length,
      0
    ) || 50;

  // Handle slot selection
  const handleSlotSelection = (row, col, isAvailable) => {
    if (isAvailable) {
      setSelectedSlot({ row, col });
    }
  };

  return (
    <div className="flex flex-col items-center bg-[#1a1a1a] min-h-screen p-5">
      <h2 className="text-white text-2xl font-bold">{selectedSpot.name || "Parking Lot"}</h2>
      <p className="text-gray-400">{selectedSpot.address || "Unknown Address"}</p>

      {/* Level Selection */}
      <div className="flex space-x-4 mt-5">
        {Object.keys(parkingData?.levels || {}).map((level) => (
          <button
            key={level}
            onClick={() => {
              setSelectedLevel(level);
              setSelectedSlot(null);
            }}
            className={`mt-5 px-6 py-2 rounded-md transition ${
              selectedLevel === level
                ? "bg-gray-700 text-white ring-4 ring-white"
                : "bg-gray-800 text-white hover:bg-gray-700"
            }`}
          >
            Level {level}
          </button>
        ))}
        {/* Confirm Booking Button */}
      <button
        disabled={!selectedSlot}
        className={`mt-5 px-6 py-2 rounded-md transition ${
          selectedSlot
            ? "bg-blue-700 text-white hover:bg-blue-800"
            : "bg-gray-500 text-gray-300 cursor-not-allowed"
        }`}
      >
        Confirm Booking
      </button>
      </div>

      {/* Parking Grid */}
      {parkingData && parkingData.levels[selectedLevel] ? (
        <div
    className="grid border-white border-4 p-4 mt-10 gap-1"
    style={{
      gridTemplateColumns: `repeat(${parkingData.levels[selectedLevel].grid[0]?.cols.length || 1}, minmax(50px, 1fr))`,
    }}
  >
          {parkingData.levels[selectedLevel].grid.map((row, rowIndex) =>
            row.cols.map((slot, colIndex) => {
              const isAvailable = parkingData.levels[selectedLevel].availability[rowIndex].cols[colIndex];
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleSlotSelection(rowIndex, colIndex, isAvailable)}
                  className={`w-20 h-32 flex items-center justify-center text-white font-bold rounded-md cursor-pointer transition ${
                    slot === 0
                      ? "bg-gray-500 cursor-not-allowed" // Entrance
                      : slot === 1
                      ? "bg-[#1a1a1a] cursor-not-allowed"
                      : !isAvailable
                      ? "bg-[#1a1a1a] cursor-not-allowed" // Occupied
                      : selectedSlot?.row === rowIndex && selectedSlot?.col === colIndex
                      ? "bg-[#1a1a1a] border-white-500 border-4"
                      : "bg-[#1a1a1a] hover:scale-105 hover:bg-[#1a1a1a]"
                  }`}
                >
                  {slot === 0 ? "Entrance" : slot === 2 ? !isAvailable ? <img src={rcar} alt="Occupied" className="w-16 h-28" /> : <img src={gcar} alt="Occupied" className="w-18 h-32" />: slot === 3 ? !isAvailable ? <img src={rcar} alt="Occupied" className="w-16 h-28" /> : <img src={gcar} alt="Occupied" className="w-18 h-32" />: ""}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <p className="text-white mt-5">Loading parking slots...</p>
      )}

      
    </div>
  );
};

export default ParkingLot;
