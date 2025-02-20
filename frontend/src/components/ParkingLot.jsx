import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import car from "../assets/car.png";
import scooter from "../assets/scooter.png";

const ParkingLot = () => {
  const location = useLocation();
  const selectedSpot = location.state?.selectedSpot;
  const totalSlots = selectedSpot?.spots || 50;

  // State management
  const [selectedVehicle, setSelectedVehicle] = useState("Four-wheeler"); // Vehicle type selection
  const [selectedSlot, setSelectedSlot] = useState(null); // Parking slot selection
  const [occupiedSlots, setOccupiedSlots] = useState(new Set());

  useEffect(() => {
    if (totalSlots > 0) {
      const occupied = new Set();
      while (occupied.size < Math.floor(totalSlots * 0.6)) {
        occupied.add(Math.floor(Math.random() * totalSlots));
      }
      setOccupiedSlots(occupied);
    }
  }, [totalSlots]);
  
  const handleVehicleSelection = (vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedSlot(null); // Reset slot selection when switching vehicles
  };

  return (
    <div className="flex flex-col items-center mt-0 bg-[#1a1a1a]">
      <h2 className="text-white text-2xl font-bold mt-5">{selectedSpot?.name || "Parking Lot"}</h2>
      <p className="text-gray-400">{selectedSpot?.address}</p>

      {/* Vehicle Selection */}
      <div className="flex space-x-4 mt-5">
        <button
          onClick={() => handleVehicleSelection("Four-wheeler")}
          className={`px-4 py-2 rounded-md transition ${
            selectedVehicle === "Four-wheeler" ? "bg-gray-700 text-white ring-4 ring-white" : "bg-gray-800 text-white hover:bg-gray-700"
          }`}
        >
          Four-wheeler
        </button>
        <button
          onClick={() => handleVehicleSelection("Two-wheeler")}
          className={`px-4 py-2 rounded-md transition ${
            selectedVehicle === "Two-wheeler" ? "bg-gray-700 text-white ring-4 ring-white" : "bg-gray-800 text-white hover:bg-gray-700"
          }`}
        >
          Two-wheeler
        </button>
        {/* Confirm Booking Button */}
      <button
        disabled={!selectedVehicle || !selectedSlot} // Enable only if both are selected
        className={`px-4 py-2 rounded-md transition ${
          selectedVehicle && selectedSlot
            ? "bg-blue-700 text-white hover:bg-blue-800 "
            : "bg-gray-500 text-gray-300 cursor-not-allowed"
        }`}
      >
        Confirm Booking
      </button>
      </div>

      {/* Parking Grid: Render based on vehicle selection */}
      {selectedVehicle === "Four-wheeler" && (
        <div className="grid grid-cols-10 border-white border-4 p-4 mt-10 mb-10 ml-0 gap-5">
          {Array.from({ length: totalSlots }, (_, index) => (
            <div
              key={index}
              onClick={() => !occupiedSlots.has(index) && setSelectedSlot(index + 1)}
              className={`w-20 h-32 flex items-center justify-center text-white font-bold rounded-md shadow-md cursor-pointer transition ${
                occupiedSlots.has(index)
                  ? "bg-[#1a1a1a] cursor-not-allowed"
                  : selectedSlot === index + 1
                  ? "bg-green-800"
                  : "bg-green-500 hover:scale-105 hover:bg-green-800"
              }`}
            >
              {occupiedSlots.has(index) ? <img src={car} alt="Occupied" className="w-20 h-32" /> : <div>{index + 1}</div>}
            </div>
          ))}
        </div>
      )}

      {selectedVehicle === "Two-wheeler" && (
        <div className="grid grid-cols-12 border-white border-4 p-4 mt-10 mb-10 ml-0 gap-3">
          {Array.from({ length: totalSlots }, (_, index) => (
            <div
              key={index}
              onClick={() => !occupiedSlots.has(index) && setSelectedSlot(index + 1)}
              className={`w-20 h-32 flex items-center justify-center text-white font-bold rounded-md shadow-md cursor-pointer transition ${
                occupiedSlots.has(index)
                  ? "bg-[#1a1a1a] cursor-not-allowed"
                  : selectedSlot === index + 1
                  ? "bg-green-800"
                  : "bg-green-500 hover:scale-105 hover:bg-green-800"
              }`}
            >
              {occupiedSlots.has(index) ? <img src={scooter} alt="Occupied" className="w-20 h-32" /> : <div>{index + 1}</div>}
            </div>
          ))}
        </div>
      )}

      
    </div>
  );
};

export default ParkingLot;
