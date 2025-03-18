import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

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

  // Temporary storage logic
  const saveToTempStorage = () => {
    localStorage.setItem("parkingSetup", JSON.stringify(parkingSlots));
  };

  // Database logic placeholder
  const saveToDatabase = async () => {
    try {
      const response = await fetch("/api/save-parking-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, parkingSlots }),
      });

      if (response.ok) {
        alert("Parking setup saved successfully!");
        navigate("/admin"); // Redirect to admin dashboard
      } else {
        alert("Error saving to database.");
      }
    } catch (error) {
      console.error("Database save error:", error);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Parking Setup</h1>
        <div className="grid gap-2">
          {parkingSlots[currentLevel - 1].map((slot, index) => (
            <div
              key={index}
              className={`w-10 h-10 border-2 rounded ${
                slot === "car"
                  ? "bg-green-500"
                  : slot === "bike"
                  ? "bg-blue-500"
                  : "bg-gray-600"
              }`}
              onClick={() => toggleSlotType(index)}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            className="bg-yellow-400 px-4 py-2 rounded-lg"
            onClick={saveToTempStorage}
          >
            Save Temporarily
          </button>

          <button
            className="bg-green-500 px-4 py-2 rounded-lg"
            onClick={saveToDatabase}
          >
            Finalize Setup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParkingSetup;
