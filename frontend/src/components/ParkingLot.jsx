import React, { useState, useEffect } from "react";
import {useLocation} from "react-router-dom";
import barricadeimage from "../assets/barricade.png";
import car from "../assets/car.png";

const ParkingLot = () => {
  const location = useLocation();
  const selectedSpot=location.state?.selectedSpot;
  const [isOpen, setIsOpen] = useState(false);
  const totalSlots = selectedSpot?.spots||50;
  const [selected,setSelected]=useState(null);
  const [occupiedSlots, setOccupiedSlots] = useState(new Set());
  const [hoveredSlot, setHoveredSlot] = useState(null);

  useEffect(() => {
    if (totalSlots>0)
    {
    const occupied = new Set();
    while (occupied.size < Math.floor(totalSlots*0.6)) {
      occupied.add(Math.floor(Math.random() * totalSlots));
    }
    setOccupiedSlots(occupied);
    }
  }, []);


  return (
    <div className="flex flex-col items-center mt-0 bg-[#1a1a1a]">
      <h2 className="text-white text-2xl font-bold mt-5">{selectedSpot?.name || "Parking Lot"}</h2>
      <p className="text-gray-400">{selectedSpot?.address}</p>
      <div key={selected} className="flex space-x-4 mt-5">
        <button onclick={() => setSelected("button1")} className={`px-4 py-2 rounded-md transition ${
          selected === "button1" ? "bg-gray-700 text-white ring-4 ring-black-300" : "bg-gray-800 text-white hover:bg-gray-700"
        }`}>
        Four-wheeler
        </button>
        <button onclick={() => setSelected("button2")} className={`px-4 py-2 rounded-md transition ${
          selected === "button2" ? "bg-gray-700 text-white ring-4 ring-black-300" : "bg-gray-800 text-white hover:bg-gray-700"
        }`}>
        Two-wheeler
        </button>
        <button onclick={()=>setSelected("button3")} className={`px-4 py-2 rounded-md transition ${
          selected === "button3" ? "bg-blue-700 text-white ring-4 ring-black-300" : "bg-blue-800 text-white hover:bg-blue-700"
        }`}>
        Confirm booking
        </button>
      </div>
      <div className="grid grid-cols-10 border-white border-4 p-4 mt-10 mb-10 ml-0 gap-5">
        {Array.from({ length: totalSlots }, (_, index) => (
          <div
            key={index}
            className={`w-20 h-32 flex items-center justify-center text-white font-bold rounded-md shadow-md  ${
              occupiedSlots.has(index) ? "bg-black-500" : "bg-green-500 hover:scale-105 hover:ring-4 hover:ring-black-300"
            }`}
           
          >
            {occupiedSlots.has(index) ? (
              <img src={car} alt="Occupied" className="w-20 h-32" />
            ) : (
              <div>{index + 1}</div>
            )}

            {!occupiedSlots.has(index) && hoveredSlot === index && (
              <div className="absolute text-black text-xs inset-0 flex flex-col items-center justify-center bg-black/50 rounded-md">
                
              </div>
            )}
          </div>
        ))}
      </div>
     
    </div>
  );
};

export default ParkingLot;
