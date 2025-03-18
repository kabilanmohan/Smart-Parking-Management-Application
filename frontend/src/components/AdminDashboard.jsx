import StatsCard from "./StatsCard";
import { FaUsers, FaCar, FaClipboardList } from "react-icons/fa";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const AdminProfile = () => {
  const stats = [
    { title: "Total Active Bookings", value: 42, icon: FaClipboardList, color: "#3B82F6" },
    { title: "Daily Completed Bookings", value: 120, icon: FaCar, color: "#10B981" },
    { title: "Total Parking Spot Owners", value: 150, icon: FaUsers, color: "#C94B4B" },
    { title: "Total Active Customers", value: 350, icon: FaUsers, color: "#F59E0B" }, // Soft orange
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1F2937] p-10 font-['Proxima Nova','Roboto',sans-serif]">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Admin Profile Section */}
        <div className="bg-white p-8 h-56 rounded-xl shadow-md border border-[#E5E7EB] flex items-center justify-between">
          <div className="w-1/4 flex justify-center">
            <img
              src="/bruce-wayne.png"
              alt="Bruce Wayne"
              className="w-28 h-28 rounded-full border-4 border-[#C94B4B]"
            />
          </div>

          <div className="w-2/4 text-center">
            <h2 className="text-3xl font-bold text-[#1F2937]">Bruce Wayne</h2>
            <p className="text-lg text-[#4B5563]">Administrator</p>
          </div>

          <div className="w-1/4 text-center">
            <p className="text-lg font-semibold text-[#C94B4B]">Total Active Bookings</p>
            <h3 className="text-3xl font-bold">1,258</h3>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div
                  className="w-12 h-12 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: stat.color }}
                >
                  <stat.icon className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{stat.title}</h2>
                  <p className="text-3xl font-semibold">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Map & Busiest Areas Section */}
        <div className="flex items-start justify-between mt-8 space-x-6">
          <div className="w-2/3 h-full">
            <MapContainer
              center={[40.7128, -74.006]}
              zoom={6}
              className="w-full h-[500px] rounded-xl border border-[#E5E7EB]"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <CircleMarker center={[40.7128, -74.006]} radius={18} color="#3B82F6">
                <Popup>🔥 Gotham City - Highest Demand</Popup>
              </CircleMarker>
              <CircleMarker center={[39.2904, -76.6122]} radius={14} color="#10B981">
                <Popup>Blüdhaven</Popup>
              </CircleMarker>
              <CircleMarker center={[38.9072, -77.0369]} radius={12} color="#F59E0B">
                <Popup>Metropolis</Popup>
              </CircleMarker>
            </MapContainer>
          </div>

          {/* Busiest Areas */}
          <div className="w-1/3 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md border border-[#E5E7EB] text-center">
              <h2 className="text-3xl font-bold text-[#C94B4B] mb-6">Busiest Areas</h2>
              <div className="w-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#C94B4B] text-white text-lg">
                      <th className="py-2 px-4">Rank</th>
                      <th className="py-2 px-4">City</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-[#FCE7F3] hover:bg-[#C94B4B] hover:text-white transition duration-300 ease-in-out">
                      <td className="py-3 px-4 font-bold">1</td>
                      <td className="py-3 px-4">Gotham City</td>
                    </tr>
                    <tr className="bg-white hover:bg-[#C94B4B] hover:text-white transition duration-300 ease-in-out">
                      <td className="py-3 px-4 font-bold">2</td>
                      <td className="py-3 px-4">Blüdhaven</td>
                    </tr>
                    <tr className="bg-[#FCE7F3] hover:bg-[#C94B4B] hover:text-white transition duration-300 ease-in-out">
                      <td className="py-3 px-4 font-bold">3</td>
                      <td className="py-3 px-4">Metropolis</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Current Parking Load */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-[#E5E7EB] text-center">
              <h2 className="text-2xl font-semibold text-[#C94B4B]">Current Parking Load</h2>
              <h3 className="text-xl font-bold text-[#1F2937]">85% Capacity</h3>
              <p className="text-m text-[#4B5563]">Live updates every minute</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminProfile;
