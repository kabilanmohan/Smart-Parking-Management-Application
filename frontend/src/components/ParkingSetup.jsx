import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ParkingSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestId, removeRequest } = location.state || {};
  const searchParams = new URLSearchParams(location.search);

  const space = searchParams.get("space") || "5x3";
  const levels = parseInt(searchParams.get("levels")) || 1;

  const [currentLevel, setCurrentLevel] = useState(1);
  const [parkingSlots, setParkingSlots] = useState(
    Array.from({ length: levels }, () =>
      Array.from({ length: space.split("x")[0] * space.split("x")[1] }, () => "")
    )
  );

  const rows = parseInt(space.split("x")[0]);
  const cols = parseInt(space.split("x")[1]);

  const toggleSlotType = (slotIndex) => {
    setParkingSlots((prev) =>
      prev.map((level, index) =>
        index === currentLevel - 1
          ? level.map((slot, i) =>
              i === slotIndex
                ? slot === ""
                  ? "car"
                  : slot === "car"
                  ? "bike"
                  : ""
                : slot
            )
          : level
      )
    );
  };

  const handleSave = () => {
    console.log("Saved Parking Data:", parkingSlots);
    if (removeRequest) removeRequest(requestId);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-8">
      <h2 className="text-3xl font-bold mb-6 text-yellow-500">
        Setup Parking Lot - Level {currentLevel}
      </h2>

      <div className="flex gap-4 mb-6">
        {Array.from({ length: levels }, (_, i) => (
          <button
            key={i}
            className={`px-6 py-2 rounded border ${
              currentLevel === i + 1
                ? "bg-yellow-500 border-yellow-600"
                : "bg-gray-800 border-gray-500 hover:bg-gray-700"
            }`}
            onClick={() => setCurrentLevel(i + 1)}
          >
            Level {i + 1}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 items-center">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-8">
            {Array.from({ length: cols }).map((_, colIndex) => {
              const slotIndex = rowIndex * cols + colIndex;
              const slotType = parkingSlots[currentLevel - 1][slotIndex];

              return (
                <div
                  key={slotIndex}
                  className={`w-24 h-36 flex items-center justify-center text-lg font-bold cursor-pointer border-2 rounded-md transition-all 
                    ${slotType === "" ? "bg-gray-900 border-gray-700"
                      : slotType === "car" ? "bg-yellow-500 border-yellow-600 text-black"
                      : "bg-blue-500 border-blue-600 text-white"
                    }`}
                  onClick={() => toggleSlotType(slotIndex)}
                >
                  {slotType ? slotType.toUpperCase() : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex gap-6 mt-8">
        <button
          className="px-6 py-3 w-40 bg-green-600 hover:bg-green-700 rounded text-white"
          onClick={handleSave}
        >
          Save
        </button>
        <button
          className="px-6 py-3 w-40 bg-red-600 hover:bg-red-700 rounded text-white"
          onClick={() => navigate("/dashboard")}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ParkingSetup;
