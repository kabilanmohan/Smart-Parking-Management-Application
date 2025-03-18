import { useState, useEffect } from "react";

const PendingRequests = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [declinedRequests, setDeclinedRequests] = useState([]);
  const [showDeclined, setShowDeclined] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState(null);

  useEffect(() => {
    setPendingRequests([
      { id: 1, user: "John Doe", date: "2025-03-15", time: "14:30", area: "7x3", slots: 2 },
      { id: 2, user: "Jane Smith", date: "2025-03-16", time: "10:00", area: "5x4", slots: 1 },
    ]);

    setDeclinedRequests([
      { id: 101, user: "Bruce Banner", date: "2025-03-10", time: "09:00", area: "6x2", slots: 3 },
      { id: 102, user: "Peter Parker", date: "2025-03-12", time: "11:45", area: "8x3", slots: 2 },
    ]);
  }, []);

  const handleAccept = (id) => {
    setPendingRequests(pendingRequests.filter(request => request.id !== id));
    alert(`Request #${id} accepted`);
  };

  const handleDecline = (id) => {
    const declinedEntry = pendingRequests.find(request => request.id === id);
    setDeclinedRequests([...declinedRequests, { ...declinedEntry }]);
    setPendingRequests(pendingRequests.filter(request => request.id !== id));
    alert(`Request #${id} declined`);
  };

  const toggleDetails = (id) => {
    setExpandedRequest(expandedRequest === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1F2937] p-10 font-['Proxima Nova','Roboto',sans-serif]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Heading */}
        <h1 className="text-4xl font-bold text-[#1F2937]">Pending Requests</h1>

        {/* Pending Requests - One Column Box Style */}
        <div className="space-y-4">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white p-6 rounded-xl shadow-md border border-[#E5E7EB] hover:bg-[#FDE2E2] transition-all flex items-center"
              >
                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-[#1F2937] text-[1.2rem]">
                    {request.user}
                  </h3>

                  {expandedRequest === request.id && (
                    <div className="mt-2 text-sm text-[#4B5563]">
                      <p><strong>Date:</strong> {request.date}</p>
                      <p><strong>Time:</strong> {request.time}</p>
                      <p><strong>Area:</strong> {request.area}</p>
                      <p><strong>Slots Required:</strong> {request.slots}</p>
                    </div>
                  )}

                  <button
                    onClick={() => toggleDetails(request.id)}
                    className="text-[#3B82F6] hover:underline mt-2"
                  >
                    {expandedRequest === request.id ? "Collapse Details" : "Show Details"}
                  </button>
                </div>

                <div className="flex space-x-2 ml-6">
                  <button
                    onClick={() => handleAccept(request.id)}
                    className="bg-[#10B981] text-white py-1 px-4 rounded-lg hover:bg-[#059669] transition"
                  >
                    Accept
                  </button>

                  <button
                    onClick={() => handleDecline(request.id)}
                    className="bg-[#EF4444] text-white py-1 px-4 rounded-lg hover:bg-[#DC2626] transition"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-[#9CA3AF] italic">No more pending requests.</p>
          )}
        </div>

        {/* Added Half-Page Gap for Visual Balance */}
        {!pendingRequests.length && <div className="h-32"></div>}

        {/* Toggle Button for Declined Requests */}
        <div className="text-center mt-6">
          <button
            onClick={() => setShowDeclined(!showDeclined)}
            className="bg-[#C94B4B] text-white py-2 px-4 rounded-lg hover:bg-[#A83A3A] transition"
          >
            {showDeclined ? "Hide Declined Requests" : "Show Declined Requests"}
          </button>
        </div>

        {/* Declined Requests - Same Column, Lighter Orange Highlight */}
        {showDeclined && (
          <div className="space-y-4 mt-4">
            {declinedRequests.map((request) => (
              <div
                key={request.id}
                className="bg-[#FCE7F3] p-6 rounded-xl shadow-md border border-[#C94B4B] flex items-center"
              >
                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-[#C94B4B] text-[1.2rem]">
                    {request.user}
                  </h3>

                  <div className="mt-2 text-sm text-[#4B5563]">
                    <p><strong>Date:</strong> {request.date}</p>
                    <p><strong>Time:</strong> {request.time}</p>
                    <p><strong>Area:</strong> {request.area}</p>
                    <p><strong>Slots Required:</strong> {request.slots}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingRequests;
