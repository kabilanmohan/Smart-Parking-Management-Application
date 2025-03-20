import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../../temp"; 
import { doc, getDoc } from "firebase/firestore";
import { FaArrowLeft } from "react-icons/fa";
import { Menu, X } from "lucide-react";
import gcar from "../assets/g_car.png";
import rcar from "../assets/r_car.png";
import gscooter from "../assets/g_scooter.png";
import rscooter from "../assets/r_scooter.png";
import ev from "../assets/EVcharging.png";

const ParkingLot = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false); // State for sidebar visibility
  const [evNeeded, setEvNeeded] = useState("no");
  const [vtype, setVtype] = useState(2);
  const [distanceFromEntrance, setDistanceFromEntrance] = useState(50);
  const [distanceFromExit, setDistanceFromExit] = useState(50);
  const [priceRange, setPriceRange] = useState("");
  const selectedSpot = location.state?.selectedSpot || {};
  const [selectedLevel, setSelectedLevel] = useState("1");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [parkingData, setParkingData] = useState(null);
  const [highlightedSlots, setHighlightedSlots] = useState([]); // Store slots to highlight

  // Fetch parking slot data from Firestore
  useEffect(() => {
    const fetchParkingData = async () => {
      try {
        const slotRef = doc(db, "ParkingSlots", "parkingSlot123");
        const slotSnap = await getDoc(slotRef);

        if (slotSnap.exists()) {
          setParkingData(slotSnap.data());
          console.log("Grid data loaded:", slotSnap.data().levels["1"].grid);
        } else {
          console.log("No such parking slot data found");
        }
      } catch (error) {
        console.error("Error fetching parking data:", error);
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

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Apply filter and highlight slots based on parameters
  const handleApplyFilter = () => {
    if (!parkingData || !parkingData.levels || !parkingData.levels[selectedLevel]) {
      console.log("Parking data not loaded yet.");
      return;
    }

    const grid = parkingData.levels[selectedLevel].grid;
    const totalRows = grid.length;
    const proximityEnt = Math.floor(distanceFromEntrance / 10);
    const proximityExit = Math.floor(distanceFromExit / 10);
    const priceLimit = parseFloat(priceRange) || Infinity;

    const slotsToHighlight = [];

    grid.forEach((row, rowIndex) => {
      row.cols.forEach((slot, colIndex) => {
        const isAvailable = parkingData.levels[selectedLevel].availability[rowIndex].cols[colIndex];
        const hasEV = parkingData.levels[selectedLevel].evcharging[rowIndex].cols[colIndex];
        const price = parkingData.levels[selectedLevel].prices[rowIndex].cols[colIndex];
        const isPathway = slot === 1;
        const isEntryOrExit = slot === 0 || slot === 4;

        if (isPathway || isEntryOrExit || !isAvailable) {
          return;
        }

        const matchesVehicleType = parseInt(vtype) === slot;
        const matchesEV = (evNeeded === "yes" && hasEV) || (evNeeded === "no" && !hasEV);
        const matchesPrice = price <= priceLimit;
        const matchesDistance = (distanceFromEntrance <= distanceFromExit)
          ? (rowIndex <= proximityEnt)
          : (totalRows - rowIndex) <= proximityExit;

        if (matchesVehicleType && matchesEV && matchesPrice && matchesDistance) {
          slotsToHighlight.push([rowIndex, colIndex]);
        }
      });
    });

    console.log("Slots to highlight:", slotsToHighlight);
    setHighlightedSlots(slotsToHighlight);
    
  };

  // Calculate max distance for sliders
  const totalRows = parkingData?.levels?.[selectedLevel]?.grid?.length || 9; // Default to 9 if data not loaded
  const maxDistance = totalRows * 10; // 10 meters per row

  return (
    <div className="flex h-screen bg-[#F5F5F5] ">
      {/* Sidebar */}
      <div
        className={`fixed top-60 right-0 h-full bg-white shadow-lg p-6 transition-transform transform z-50
          ${showSidebar ? "translate-x-0" : "translate-x-full"}
          w-70 md:w-70 lg:w-70`} // Responsive widths
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold">Parking Slot Finder</h2>
          <button onClick={() => setShowSidebar(false)} className="text-gray-600 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>
        {/* Vehicle Type */}
        <label className="block text-gray-700 font-medium mt-5">Vehicle Type:</label>
        <div className="flex space-x-4 mt-2 mb-2">
          <label className="flex items-center space-x-2 mt-2">
            <input
              type="radio"
              name="vtype"
              value={3}
              checked={vtype === 3}
              onChange={(e) => setVtype(parseInt(e.target.value))}
              className="form-radio text-blue-500"
            />
            <span>Bike</span>
          </label>
          <label className="flex items-center mt-2 space-x-2">
            <input
              type="radio"
              name="vtype"
              value={2}
              checked={vtype === 2}
              onChange={(e) => setVtype(parseInt(e.target.value))}
              className="form-radio text-blue-500"
            />
            <span>Car</span>
          </label>
        </div>
        {/* EV Needed */}
        <label className="block text-gray-700 font-medium mt-2">EV charging needed:</label>
        <div className="flex space-x-4 mt-2 mb-2">
          <label className="flex items-center mt-2 space-x-2">
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
          <label className="flex items-center mt-2 space-x-2">
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
        <label className="block text-gray-700 font-medium mb-1 mt-2">
          Distance from Entrance: {distanceFromEntrance}m
        </label>
        <input
          type="range"
          min="10"
          max={maxDistance}
          step="1"
          value={distanceFromEntrance}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setDistanceFromEntrance(value);
            setDistanceFromExit(100 - value);
          }}
          className="w-full cursor-pointer"
        />

        {/* Distance from Exit (Range Slider) */}
        <label className="block text-gray-700 font-medium mb-1 mt-2">
          Distance from Exit: {distanceFromExit}m
        </label>
        <input
          type="range"
          min="10"
          max={maxDistance}
          step="1"
          value={distanceFromExit}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setDistanceFromExit(value);
            setDistanceFromEntrance(100 - value);
          }}
          className="w-full cursor-pointer mt-2"
        />
        {/* Price Range */}
        <label className="block text-gray-700 font-medium mb-1 mt-2">Price Range per hour(≤):</label>
        <input
          type="number"
          min="4"
          max="10"
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg mb-3 mt-2"
        />

        {/* Apply Button */}
        <div className="flex justify-center">
          <button
            className="bg-green-500 text-white px-4 py-2 mt-2 rounded-lg shadow-md hover:bg-green-600 transition-all duration-200"
            onClick={handleApplyFilter}
          >
            Apply
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${showSidebar ? "mr-80 md:mr-70 lg:mr-70" : "mr-0"}`}>
        {/* Sticky Header */}
        <div className="fixed top-0 left-0 w-full bg-white p-6 flex flex-col items-center z-40 shadow-md">
          <div className="fixed top-6 left-4 z-50">
            <button 
              onClick={handleBackToDashboard}
              className="flex items-center px-4 py-2 bg-white text-[#4B5563] rounded-lg border border-[#E5E7EB] shadow-sm hover:bg-[#F9FAFB] transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              <span>Back to Dashboard</span>
            </button>
          </div>
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
            <div className="flex items-center space-x-2">
              <img src={ev} alt="EV" className="w-6 h-6" />
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
                  setHighlightedSlots([]);
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
              onClick={() => {
                setSelectedSlot(null);
                setHighlightedSlots([]);
              }}
              className="px-5 py-2 rounded-lg font-medium bg-gray-500 text-white hover:bg-gray-400 transition-all duration-200 shadow-md"
            >
              Reset Selection
            </button>
            {/* Filter Button */}
            <button
              onClick={() => setShowSidebar(true)}
              className="px-5 py-2 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 shadow-md"
            >
              <Menu size={20} className="inline mr-2" />
              Filter
            </button>
          </div>
        </div>

        {/* Parking Grid - Centered */}
        <div className="flex justify-center items-center min-h-screen pt-40 pb-10">
          {parkingData?.levels?.[selectedLevel] ? (
            <div
              className="grid p-0 mt-20 bg-gray-600 rounded-lg shadow-md relative "
              style={{
                gridTemplateColumns: `repeat(${parkingData.levels[selectedLevel].grid[0]?.cols.length || 1}, minmax(0, 1fr))`,
                gap: "0",
                border: "4px dashed #FFC107",
              }}
            >
              {(() => {
                let slotIndex = 0;

                return parkingData.levels[selectedLevel].grid.flatMap((row, rowIndex) =>
                  row.cols.map((slot, colIndex) => {
                    const isAvailable = parkingData.levels[selectedLevel].availability[rowIndex].cols[colIndex];
                    const isPathway = slot === 1;
                    const isEntryOrExit = slot === 0 || slot === 4;
                    const hasEV = parkingData.levels[selectedLevel].evcharging[rowIndex].cols[colIndex];
                    const isHighlighted = highlightedSlots.some(([r, c]) => r === rowIndex && c === colIndex);

                    let slotNumber = null;
                    if (!isPathway && !isEntryOrExit) {
                      slotIndex++;
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
                              ? "bg-gray-600 cursor-not-allowed border-4 shadow-md border-gray-300"
                              : selectedSlot?.row === rowIndex && selectedSlot?.col === colIndex
                              ? "bg-green-700 border-4 border-gray-300 shadow-lg"
                              : isHighlighted
                              ? "bg-gray-800 border-4 border-gray-300 shadow-lg"
                              : "bg-gray-600 border-4 border-gray-300 hover:bg-green-700 hover:shadow-md hover:border-4"
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
                                  {hasEV ? <img src={ev} alt="EV" className="w-7 h-7 absolute bottom-1 left-1" /> : null}
                                </>
                              ) : (
                                <>
                                  <img src={gcar} alt="Available" className="w-20 h-28" />
                                  {hasEV ? <img src={ev} alt="EV" className="w-7 h-7 absolute bottom-1 left-1" /> : null}
                                </>
                              )
                            ) : slot === 3 ? (
                              !isAvailable ? (
                                <>
                                  <img src={rscooter} alt="Occupied" className="w-20 h-30" />
                                  {hasEV ? <img src={ev} alt="EV" className="w-7 h-7 absolute bottom-1 left-1" /> : null}
                                </>
                              ) : (
                                <>
                                  <img src={gscooter} alt="Available" className="w-20 h-30" />
                                  {hasEV ? <img src={ev} alt="EV" className="w-7 h-7 absolute bottom-1 left-1" /> : null}
                                </>
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
            <p className="text-gray-600 text-lg">Loading parking slots...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParkingLot;