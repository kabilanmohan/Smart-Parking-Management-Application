import StatsCard from "./StatsCard";
import { FaUsers, FaCar, FaClipboardList, FaMapMarkerAlt } from "react-icons/fa";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const AdminProfile = () => {
  // Sample stats - Replace with real data later
  const stats = [
    { title: "Total Active Bookings", value: 42, icon: FaClipboardList },
    { title: "Daily Completed Bookings", value: 120, icon: FaCar },
    { title: "Total Parking Spot Owners", value: 150, icon: FaUsers },
    { title: "Total Active Customers", value: 350, icon: FaUsers },
  ];
  

  return (
    <div className="min-h-screen bg-gray-950 text-white p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Admin Profile Section */}
        <div className="bg-gray-800 p-8 h-56 rounded-xl shadow-lg border-4 border-yellow-400 text-white flex items-center justify-between">
  {/* Profile Picture */}
  <div className="w-1/4 flex justify-center">
    <img
      src="/bruce-wayne.png"
      alt="Bruce Wayne"
      className="w-28 h-28 rounded-full border-4 border-yellow-400"
    />
  </div>

  {/* Admin Details */}
  <div className="w-2/4 text-center">
    <h2 className="text-3xl font-bold">Bruce Wayne</h2>
    <p className="text-lg text-gray-400">Administrator</p>
  </div>

  {/* Key Stat */}
  <div className="w-1/4 text-center">
    <p className="text-lg font-semibold text-yellow-400">Total Active Bookings</p>
    <h3 className="text-3xl font-bold">1,258</h3>
  </div>
</div>




        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
          {stats.map((stat, index) => (
            <StatsCard key={index} title={stat.title} value={stat.value} icon={stat.icon} />
          ))}
        </div>
       
        <div className="flex items-start justify-between mt-8 space-x-6">
  {/* Map - Ensure It Matches the Box Height */}
  <div className="w-2/3 h-full">
    <MapContainer
      center={[40.7128, -74.006]}
      zoom={6}
      className="w-full h-[500px] rounded-xl border-4 border-yellow-400"
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <CircleMarker center={[40.7128, -74.006]} radius={18} color="red">
        <Popup>🔥 Gotham City - Highest Demand</Popup>
      </CircleMarker>
      <CircleMarker center={[39.2904, -76.6122]} radius={14} color="orange">
        <Popup>Blüdhaven</Popup>
      </CircleMarker>
      <CircleMarker center={[38.9072, -77.0369]} radius={12} color="yellow">
        <Popup>Metropolis</Popup>
      </CircleMarker>
    </MapContainer>
  </div>

      {/* Right Side: Busiest Areas (Improved UI) */}
<div className="w-1/3">
  <div className="bg-gray-900 p-6 rounded-xl shadow-lg border-4 border-yellow-400 text-center transform transition-all hover:scale-105">
    <h2 className="text-3xl font-bold text-yellow-400 mb-6">Busiest Areas</h2>

    {/* Table Container */}
    <div className="w-full">
      <table className="w-full border-collapse">
        {/* Table Header */}
        <thead>
          <tr className="bg-yellow-500 text-gray-900 text-lg">
            <th className="py-2 px-4 text-center">Rank</th>
            <th className="py-2 px-4 text-center">City</th>
          </tr>
        </thead>
        
        {/* Table Body */}
        <tbody>
          <tr className="bg-gray-800 hover:bg-yellow-500 hover:text-gray-900 transition duration-300 ease-in-out">
            <td className="py-3 px-4 font-bold">1</td>
            <td className="py-3 px-4">Gotham City</td>
          </tr>
          <tr className="bg-gray-700 hover:bg-yellow-500 hover:text-gray-900 transition duration-300 ease-in-out">
            <td className="py-3 px-4 font-bold">2</td>
            <td className="py-3 px-4">Blüdhaven</td>
          </tr>
          <tr className="bg-gray-800 hover:bg-yellow-500 hover:text-gray-900 transition duration-300 ease-in-out">
            <td className="py-3 px-4 font-bold">3</td>
            <td className="py-3 px-4">Metropolis</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>


    {/* Improved Stat Below */}
    <div className="bg-gray-800 p-6 mt-4 rounded-xl shadow-lg border-4 border-yellow-400 text-center">
      <h2 className="text-2xl font-semibold text-yellow-400">Current Parking Load</h2>
      <h3 className="text-xl font-bold text-white">85% Capacity</h3>
      <p className="text-m text-gray-400">Live updates every minute</p>
    </div>
  </div>
</div>



      </div>
    </div>
  );
};

export default AdminProfile;
