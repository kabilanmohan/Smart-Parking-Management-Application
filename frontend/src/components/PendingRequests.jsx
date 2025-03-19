import { useState } from "react";
import { useNavigate } from "react-router-dom";

const requestsData = [
  {
    id: 1,
    owner: "Wayne Parking Inc.",
    date: "Feb 27, 2025",
    time: "14:30",
    space: "7x3",
    levels: 1,
    slots: 4,
    expanded: false,
  },
  {
    id: 2,
    owner: "Gotham Towers",
    date: "Feb 26, 2025",
    time: "10:15",
    space: "6x4",
    levels: 2,
    slots: 6,
    expanded: false,
  },
];

const PendingRequests = () => {
  const [requests, setRequests] = useState(requestsData);
  const navigate = useNavigate();

  const toggleExpand = (id) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, expanded: !req.expanded } : req
      )
    );
  };

  const handleAccept = (request) => {
    setRequests((prev) => prev.filter((req) => req.id !== request.id)); // Remove request from list
    navigate(`/setup-parking?space=${request.space}&levels=${request.levels}`);
  };

  const handleDecline = (id) => {
    setRequests((prev) => prev.filter((req) => req.id !== id));
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h2 className="text-3xl font-bold text-yellow-500 mb-6">
        Pending Parking Requests
      </h2>

      <div className="space-y-6">
        {requests.map((req) => (
          <div
            key={req.id}
            className="bg-gray-900 p-5 rounded-lg border border-yellow-500 shadow-lg"
          >
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleExpand(req.id)}
            >
              <h3 className="text-lg font-semibold text-yellow-400">
                {req.owner} - {req.date} @ {req.time}
              </h3>
              <span className="text-sm text-gray-400">
                {req.expanded ? "▲" : "▼"}
              </span>
            </div>

            {req.expanded && (
              <div className="mt-3 text-gray-300 text-sm">
                <p>
                  <span className="font-semibold text-yellow-300">
                    Space Available:
                  </span>{" "}
                  {req.space}
                </p>
                <p>
                  <span className="font-semibold text-yellow-300">
                    No. of Levels:
                  </span>{" "}
                  {req.levels}
                </p>
                <p>
                  <span className="font-semibold text-yellow-300">
                    Requested Slots:
                  </span>{" "}
                  {req.slots}
                </p>
              </div>
            )}

            <div className="flex gap-4 mt-4">
              <button
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
                onClick={() => handleAccept(req)}
              >
                Accept
              </button>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
                onClick={() => handleDecline(req.id)}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingRequests;
