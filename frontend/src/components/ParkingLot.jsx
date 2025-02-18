import React, { useState, useEffect } from "react";
import barricadeimage from "../assets/barricade.png";

const ParkingLot = () => {
  const totalSlots = 80;
  const [occupiedSlots, setOccupiedSlots] = useState(new Set());

  useEffect(() => {
    // Randomly mark some slots as occupied for demo purposes
    const occupied = new Set();
    while (occupied.size < 30) { // 30 slots occupied
      occupied.add(Math.floor(Math.random() * totalSlots));
    }
    setOccupiedSlots(occupied);
  }, []);

  return (
    <div className="flex flex-col items-center mt-0 bg-black">
      <img 
       src={barricadeimage}
       alt="Entrance"
       className="w-24 h-24 mx-auto mb-6"
       />
       
      <div className="grid grid-cols-10 mt-10 gap-10">
        {Array.from({ length: totalSlots }, (_, index) => (
          <div
            key={index}
            className={`w-20 h-32 flex items-center justify-center text-white font-bold rounded-md shadow-md transition-colors duration-300 
              ${occupiedSlots.has(index) ? "bg-gray-500" : "hover:scale-105 hover:ring-4 hover:ring-black-300 bg-green-500"}`}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParkingLot;
