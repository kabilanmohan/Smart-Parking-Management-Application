import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaDownload, FaPrint, FaEye, FaSort, FaFilter, FaSearch } from "react-icons/fa";
import { db } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 5;

  // Fetch transactions from Firebase
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const q = query(collection(db, "transactions"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);

        const data = querySnapshot.docs.map((doc) => {
          const transaction = doc.data();
          return {
            id: doc.id,
            ...transaction,
            date: transaction.date?.toDate() || new Date(),
          };
        });

        setTransactions(data || []);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        
        // Fallback to mock data for development if Firebase fetch fails
        const mockTransactions = [
          {
            id: "TX789012",
            date: new Date(2025, 2, 15, 14, 30),
            name: "Wayne Tower Parking",
            cardNumber: "**** **** **** 4567",
            cardType: "VISA",
            amount: 25.00,
            duration: "4 hours",
            status: "completed",
            vehicleType: "Car",
            spotNumber: "A-123",
            location: "Downtown Gotham, 1007 Mountain Drive"
          },
          {
            id: "TX789013",
            date: new Date(2025, 2, 14, 10, 15),
            name: "Arkham City Parking",
            cardNumber: "**** **** **** 4567",
            cardType: "VISA",
            amount: 18.50,
            duration: "3 hours",
            status: "completed",
            vehicleType: "Car",
            spotNumber: "B-045",
            location: "East Side, 900 Crime Alley"
          },
          {
            id: "TX789014",
            date: new Date(2025, 2, 12, 9, 0),
            name: "Gotham Heights Parking",
            cardNumber: "**** **** **** 4567",
            cardType: "VISA",
            amount: 15.00,
            duration: "2.5 hours",
            status: "completed",
            vehicleType: "Car",
            spotNumber: "C-198",
            location: "North Gotham, 123 Bat Street"
          },
          {
            id: "TX789015",
            date: new Date(2025, 2, 10, 18, 45),
            name: "Wayne Tower Parking",
            cardNumber: "**** **** **** 4567",
            cardType: "VISA",
            amount: 12.00,
            duration: "2 hours",
            status: "completed",
            vehicleType: "Car",
            spotNumber: "A-056",
            location: "Downtown Gotham, 1007 Mountain Drive"
          },
          {
            id: "TX789016",
            date: new Date(2025, 2, 8, 13, 20),
            name: "Gotham Central Parking",
            cardNumber: "**** **** **** 4567",
            cardType: "VISA",
            amount: 30.00,
            duration: "5 hours",
            status: "completed",
            vehicleType: "Car",
            spotNumber: "D-012",
            location: "Central Gotham, 42 Wayne Avenue"
          },
          {
            id: "TX789017",
            date: new Date(2025, 2, 5, 8, 10),
            name: "Arkham City Parking",
            cardNumber: "**** **** **** 4567",
            cardType: "VISA",
            amount: 10.50,
            duration: "1.5 hours",
            status: "completed",
            vehicleType: "Car",
            spotNumber: "B-134",
            location: "East Side, 900 Crime Alley"
          },
          {
            id: "TX789018",
            date: new Date(2025, 2, 1, 15, 0),
            name: "Wayne Tower Parking",
            cardNumber: "**** **** **** 4567",
            cardType: "VISA",
            amount: 28.00,
            duration: "4.5 hours",
            status: "completed",
            vehicleType: "Car",
            spotNumber: "A-003",
            location: "Downtown Gotham, 1007 Mountain Drive"
          },
        ];
        setTransactions(mockTransactions);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // PDF Download functionality
  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Parking Transaction History", 14, 15);
      
      const tableColumn = ["Transaction ID", "Location", "Spot", "Amount", "Date", "Name"];
      const tableRows = [];

      transactions.forEach((txn) => {
        const txnData = [
          txn.id,
          txn.location || "Unknown location",
          txn.spotNumber,
          `$${txn.amount.toFixed(2)}`,
          formatDate(txn.date),
          txn.name
        ];
        tableRows.push(txnData);
      });

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 25,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [75, 85, 99],
          lineWidth: 0.25,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        }
      });
      
      // Add footer with date
      const pageCount = doc.internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2, 
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
      
      doc.save("parking_transactions.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF. Please try again.");
    }
  };

  // CSV Download functionality
  const downloadCSV = () => {
    const dataToExport = transactions.map(txn => ({
      Transaction_ID: txn.id,
      Name: txn.name,
      Location: txn.location || "Unknown location",
      Amount: txn.amount,
      Date: formatDate(txn.date),
      Time: txn.date.toLocaleTimeString(),
      Card_Number: txn.cardNumber,
      Vehicle_Type: txn.vehicleType,
      Spot_Number: txn.spotNumber,
      Status: txn.status
    }));
    
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "parking_transactions.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate most visited location based on location property
  const getMostVisitedLocation = () => {
    // Group by location address (before the comma if there is one)
    const locationCount = {};
    
    transactions.forEach(txn => {
      if (!txn.location) return;
      
      // Extract the main location name (before the comma)
      const mainLocation = txn.location.split(',')[0].trim();
      locationCount[mainLocation] = (locationCount[mainLocation] || 0) + 1;
    });

    let mostVisited = "";
    let maxCount = 0;
    
    // Find the most frequent location
    Object.entries(locationCount).forEach(([location, count]) => {
      if (count > maxCount) {
        mostVisited = location;
        maxCount = count;
      }
    });

    return mostVisited || "None";
  };

  // Filter transactions based on search query and selected filter
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === "all") return matchesSearch;
    if (selectedFilter === "high") return matchesSearch && transaction.amount > 20;
    if (selectedFilter === "medium") return matchesSearch && transaction.amount > 15 && transaction.amount <= 20;
    if (selectedFilter === "low") return matchesSearch && transaction.amount <= 15;
    
    return matchesSearch;
  });

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortOrder === "desc") {
      return b.date - a.date;
    } else {
      return a.date - b.date;
    }
  });

  // Pagination
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = sortedTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const pageCount = Math.ceil(sortedTransactions.length / transactionsPerPage);

  // Format date to be more readable
  const formatDate = (date) => {
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= pageCount; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1F2937] p-6 font-['Proxima Nova', 'Roboto', sans-serif]">
      {/* Header with new color scheme */}
      <div className="flex items-center justify-between mb-8 border-b border-[#E5E7EB] pb-4">
        <div className="flex items-center">
            <button 
                onClick={() => navigate("/dashboard")} 
                className="flex items-center mr-6 bg-white px-4 py-3 rounded-xl hover:bg-[#DBEAFE] transition-all duration-300 shadow-md border border-[#E5E7EB] hover:shadow-xl hover:translate-y-[-2px]"
                >
                <FaArrowLeft className="mr-2 text-[#C94B4B]" />
                <span>Return to Dashboard</span>
            </button>
          <h1 className="text-3xl font-bold text-[#664a85]">Payment History</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={downloadPDF}
            className="flex items-center bg-[#C94B4B] text-white px-4 py-2 rounded-lg hover:bg-[#B83E3E] transition-colors shadow-sm"
          >
            <FaDownload className="mr-2" />
            <span>Export PDF</span>
          </button>
          <button 
            onClick={downloadCSV}
            className="flex items-center bg-[#3B82F6] text-white px-4 py-2 rounded-lg hover:bg-[#2563EB] transition-colors shadow-sm"
          >
            <FaPrint className="mr-2" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3 text-[#4B5563]" />
          <input
            type="text"
            placeholder="Search by name, location or transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#DBEAFE] text-[#1F2937] shadow-sm"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm border border-[#E5E7EB]">
            <FaFilter className="mr-2 text-[#3B82F6]" />
            <select 
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="bg-white text-[#1F2937] focus:outline-none"
            >
              <option value="all">All Amounts</option>
              <option value="high">High ($20+)</option>
              <option value="medium">Medium ($15-20)</option>
              <option value="low">Low (Under $15)</option>
            </select>
          </div>
          
          <button 
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex items-center bg-white px-4 py-2 rounded-lg hover:bg-[#DBEAFE] transition-colors shadow-sm border border-[#E5E7EB]"
          >
            <FaSort className="mr-2 text-[#3B82F6]" />
            <span>{sortOrder === "asc" ? "Oldest First" : "Newest First"}</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3B82F6]"></div>
        </div>
      ) : currentTransactions.length > 0 ? (
        <div className="bg-white rounded-xl shadow-md overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F3F4F6] border-b border-[#E5E7EB]">
                <th className="py-4 px-6 text-left">Date & Time</th>
                <th className="py-4 px-6 text-left">Transaction ID</th>
                <th className="py-4 px-6 text-left">Location</th>
                <th className="py-4 px-6 text-left">Name</th>
                <th className="py-4 px-6 text-right">Amount</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {currentTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-4 px-6">{formatDate(transaction.date)}</td>
                  <td className="py-4 px-6 font-mono">{transaction.id}</td>
                  <td className="py-4 px-6">
                    <div className="font-medium">{transaction.location || "Unknown location"}</div>
                    <div className="text-sm text-[#4B5563]">Spot {transaction.spotNumber}</div>
                  </td>
                  <td className="py-4 px-6">{transaction.name}</td>
                  <td className="py-4 px-6 text-right font-medium">${transaction.amount.toFixed(2)}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="px-3 py-1 rounded-full text-sm bg-[#D1FAE5] text-[#047857]">
                      {transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button className="p-2 bg-[#DBEAFE] rounded-lg hover:bg-[#BFDBFE] transition-colors">
                      <FaEye className="text-[#3B82F6]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center shadow-md">
          <p className="text-xl mb-2 text-[#1F2937]">No transactions found</p>
          <p className="text-[#4B5563]">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Pagination Controls */}
      {pageCount > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <button 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-lg ${
              currentPage === 1 
                ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed' 
                : 'bg-white hover:bg-[#DBEAFE] text-[#1F2937] border border-[#E5E7EB]'
            }`}
          >
            Prev
          </button>
          
          {getPageNumbers().map(number => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={`px-3 py-1 rounded-lg ${
                currentPage === number
                  ? 'bg-[#3B82F6] text-white'
                  : 'bg-white hover:bg-[#DBEAFE] text-[#1F2937] border border-[#E5E7EB]'
              }`}
            >
              {number}
            </button>
          ))}
          
          <button 
            onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage === pageCount}
            className={`px-3 py-1 rounded-lg ${
              currentPage === pageCount 
                ? 'bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed' 
                : 'bg-white hover:bg-[#DBEAFE] text-[#1F2937] border border-[#E5E7EB]'
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Summary Section */}
      <div className="mt-8 bg-white rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4 text-[#1F2937]">Payment Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
            <p className="text-sm text-[#4B5563]">Total Spent</p>
            <p className="text-2xl font-bold text-[#1F2937]">
              ${transactions.reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
            <p className="text-sm text-[#4B5563]">Average Per Transaction</p>
            <p className="text-2xl font-bold text-[#1F2937]">
              ${(transactions.reduce((sum, tx) => sum + tx.amount, 0) / Math.max(1, transactions.length)).toFixed(2)}
            </p>
          </div>
          <div className="bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
            <p className="text-sm text-[#4B5563]">Most Visited</p>
            <p className="text-xl font-bold text-[#1F2937]">{getMostVisitedLocation()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;