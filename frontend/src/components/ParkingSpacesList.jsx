import { useState } from "react";
import { FaSearch, FaEdit, FaTrash, FaMapMarkerAlt, FaParking, FaStar } from "react-icons/fa";
import PropTypes from "prop-types";

const ParkingSpacesList = ({ parkingSpaces, onAddNew, onSetupGrid }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Filter and sort parking spaces
  const filteredSpaces = parkingSpaces
    .filter(space => 
      space.Name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      space.Address?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" 
          ? (a.Name || "").localeCompare(b.Name || "") 
          : (b.Name || "").localeCompare(a.Name || "");
      } else if (sortBy === "spots") {
        return sortOrder === "asc" 
          ? (a.TotalSlots || 0) - (b.TotalSlots || 0) 
          : (b.TotalSlots || 0) - (a.TotalSlots || 0);
      } else if (sortBy === "available") {
        return sortOrder === "asc" 
          ? (a.AvailableSlots || 0) - (b.AvailableSlots || 0) 
          : (b.AvailableSlots || 0) - (a.AvailableSlots || 0);
      }
      return 0;
    });

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#1F2937]">Parking Spaces</h2>
        <button
          onClick={onAddNew}
          className="bg-[#8373BF] text-white px-4 py-2 rounded-lg hover:bg-[#8373BF]/80 transition-colors flex items-center"
        >
          <FaParking className="mr-2" />
          Add New Parking Space
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        {/* Search and filter */}
        <div className="p-4 border-b border-[#E5E7EB] flex justify-between items-center">
          <div className="relative w-64">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4B5563]" />
            <input
              type="text"
              placeholder="Search parking spaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8373BF] focus:border-transparent"
            />
          </div>
          <div className="text-sm text-[#4B5563]">
            {filteredSpaces.length} parking spaces found
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E5E7EB]">
            <thead className="bg-[#F9FAFB]">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort("name")}
                >
                  <div className="flex items-center">
                    Name
                    {sortBy === "name" && (
                      <span className="ml-1">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                  Address
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort("spots")}
                >
                  <div className="flex items-center">
                    Total Spots
                    {sortBy === "spots" && (
                      <span className="ml-1">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort("available")}
                >
                  <div className="flex items-center">
                    Available
                    {sortBy === "available" && (
                      <span className="ml-1">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                  Rating
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[#4B5563] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E5E7EB]">
              {filteredSpaces.length > 0 ? (
                filteredSpaces.map((space) => (
                  <tr key={space.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-[#1F2937]">{space.Name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#4B5563] max-w-xs truncate">{space.Address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#1F2937]">{space.TotalSlots || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-[#1F2937] mr-2">{space.AvailableSlots || 0}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${Math.round(((space.AvailableSlots || 0) / (space.TotalSlots || 1)) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaStar className="text-yellow-500 mr-1" />
                        <span className="text-sm text-[#1F2937]">{space.averageRating?.toFixed(1) || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onSetupGrid(space.id, space.levels || 1)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Setup Grid"
                        >
                          <FaParking />
                        </button>
                        <button className="text-[#8373BF] hover:text-[#8373BF]/80" title="Edit">
                          <FaEdit />
                        </button>
                        <button className="text-red-600 hover:text-red-900" title="Delete">
                          <FaTrash />
                        </button>
                        <button className="text-green-600 hover:text-green-900" title="View on Map">
                          <FaMapMarkerAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-[#4B5563]">
                    {searchTerm ? "No parking spaces found matching your search" : "No parking spaces available"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

ParkingSpacesList.propTypes = {
  parkingSpaces: PropTypes.array.isRequired,
  onAddNew: PropTypes.func.isRequired,
  onSetupGrid: PropTypes.func.isRequired
};

export default ParkingSpacesList;