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
    <div className="flex flex-col items-center bg-[#1a1a1a] min-h-screen p-5">
      {/* Sticky Bar */}
      <div className="sticky top-0 left-0 w-full bg-[#1a1a1a] p-5 flex flex-col items-center z-50">
        <h2 className="text-white text-2xl font-bold">{selectedSpot.name || "Parking Lot"}</h2>
        <p className="text-gray-400">{selectedSpot.address || "Unknown Address"}</p>

        {/* Level Selection & Confirm Booking */}
        <div className="flex space-x-4 mt-6">
          {Object.keys(parkingData?.levels || {}).map((level) => (
            <button
              key={level}
              onClick={() => {
                setSelectedLevel(level);
                setSelectedSlot(null);
              }}
              className={`px-6 py-2 rounded-md transition ${
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
            onClick={() => navigate("/payment_module")}
            className={`px-6 py-2 rounded-md transition ${
              selectedSlot
                ? "bg-blue-700 text-white hover:bg-blue-800"
                : "bg-gray-500 text-gray-300 cursor-not-allowed"
            }`}
          >
            {selectedSlot
              ? `Confirm Booking ($${parkingData.levels[selectedLevel].prices[selectedSlot.row].cols[selectedSlot.col]})`
              : "Confirm Booking"}
          </button>
        </div>
      </div>


      {/* Parking Grid */}
      {parkingData && parkingData.levels[selectedLevel] ? (
        <div
    className="grid border-white border-4 p-4 mt-10 gap-10"
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
                  className={`w-20 h-32 flex flex-col items-center justify-center text-white font-bold rounded-md cursor-pointer transition 
                    ${slot === 0 || slot === 4
                      ? "bg-black border-white border-4 text-white cursor-not-allowed"  // Entrance
                      : slot === 1
                      ? "bg-[#1a1a1a] cursor-not-allowed"
                      : !isAvailable
                      ? "bg-[#1a1a1a] cursor-not-allowed border-white-500 border-2"  // Occupied
                      : selectedSlot?.row === rowIndex && selectedSlot?.col === colIndex
                        ? "bg-[#1a1a1a] border-green-500 border-2"  
                        : "bg-[#1a1a1a] border-white-500 border-2 hover:scale-105 hover:border-green-500 hover:border-3"
                    }`}
                >
                 
                  {slot === 0 ? "ENTRY"
                    : slot === 4 ? "EXIT"
                    : (
                    <>
                      {slot === 2 ? 
                        !isAvailable ? <img src={rcar} alt="Occupied" className="w-20 h-28" /> 
                                    : <img src={gcar} alt="Available" className="w-20 h-28" /> 
                        : slot === 3 ? 
                        !isAvailable ? <img src={rscooter} alt="Occupied" className="w-20 h-30" /> 
                                    : <img src={gscooter} alt="Available" className="w-20 h-30" /> 
                        : null
                      }
                      
          
                    </>
                  )}
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
