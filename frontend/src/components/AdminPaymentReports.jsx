import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import { collection, query, getDocs, getDoc, orderBy, where } from "firebase/firestore";
import { FaFilter, FaSort, FaSearch, FaDownload, FaChartBar, FaCalendarAlt } from "react-icons/fa";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";
import Loader from "./Loader";

const AdminPaymentReports = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [userCache, setUserCache] = useState({});
  const [summaryStats, setSummaryStats] = useState({
    totalRevenue: 0,
    avgTransaction: 0,
    totalTransactions: 0,
    topLocation: "",
    dailyRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0
  });
  const transactionsPerPage = 10;

  // Fetch transactions from Firebase
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Base query with ordering by date
      let txnQuery = query(collection(db, "transactions"), orderBy("date", "desc"));
      
      // Apply date range filter if needed
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 7);
      const monthStart = new Date(today);
      monthStart.setMonth(today.getMonth() - 1);
      
      if (dateRange === "today") {
        txnQuery = query(collection(db, "transactions"), 
          where("date", ">=", today), 
          orderBy("date", "desc"));
      } else if (dateRange === "week") {
        txnQuery = query(collection(db, "transactions"), 
          where("date", ">=", weekStart), 
          orderBy("date", "desc"));
      } else if (dateRange === "month") {
        txnQuery = query(collection(db, "transactions"), 
          where("date", ">=", monthStart), 
          orderBy("date", "desc"));
      }

      const querySnapshot = await getDocs(txnQuery);
      
      // Process the transactions data
      const transactionsData = [];
      for (const doc of querySnapshot.docs) {
        const txnData = doc.data();
        
        const transaction = {
          id: doc.id,
          ...txnData,
          date: txnData.date?.toDate() || new Date()
        };

        // Get user details if available
        if (transaction.userId && transaction.userId !== 'anonymous') {
          if (userCache[transaction.userId]) {
            transaction.userDetails = userCache[transaction.userId];
          } else {
            try {
              const userDoc = await getDoc(doc(db, "users", transaction.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                transaction.userDetails = {
                  name: userData.name || 'N/A',
                  email: userData.email || transaction.userEmail || 'N/A',
                  phone: userData.phone || 'N/A'
                };
                // Update cache
                setUserCache(prev => ({
                  ...prev,
                  [transaction.userId]: transaction.userDetails
                }));
              }
            } catch (error) {
              console.error("Error fetching user details:", error);
            }
          }
        }

        transactionsData.push(transaction);
      }

      setTransactions(transactionsData);
      calculateSummaryStats(transactionsData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [userCache, dateRange]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Calculate summary statistics
  const calculateSummaryStats = (data) => {
    const totalRevenue = data.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const avgTransaction = data.length > 0 ? totalRevenue / data.length : 0;
    const totalTransactions = data.length;
    
    // Calculate top location
    const locationCount = {};
    data.forEach(tx => {
      if (!tx.location) return;
      const mainLocation = tx.location.split(',')[0].trim();
      locationCount[mainLocation] = (locationCount[mainLocation] || 0) + 1;
    });
    
    let topLocation = "";
    let maxCount = 0;
    Object.entries(locationCount).forEach(([location, count]) => {
      if (count > maxCount) {
        topLocation = location;
        maxCount = count;
      }
    });
    
    // Calculate revenue for different time periods
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);
    
    const dailyRevenue = data.filter(tx => tx.date >= today)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    const weeklyRevenue = data.filter(tx => tx.date >= weekAgo)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    const monthlyRevenue = data.filter(tx => tx.date >= monthAgo)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    setSummaryStats({
      totalRevenue,
      avgTransaction,
      totalTransactions,
      topLocation,
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue
    });
  };

  // PDF export functionality
  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title and branding
      doc.setFontSize(20);
      doc.setTextColor(131, 115, 191); // Purple color for title
      doc.text("Smart Parking Management System", 14, 20);
      doc.setFontSize(16);
      doc.text("Payment Transactions Report", 14, 30);
      
      // Add report metadata
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);
      doc.text(`Total Transactions: ${summaryStats.totalTransactions}`, 14, 45);
      doc.text(`Total Revenue: $${summaryStats.totalRevenue.toFixed(2)}`, 14, 50);
      
      // Add transactions table
      const tableColumn = ["Date", "Transaction ID", "User", "Location", "Amount", "Payment Method", "Status"];
      const tableRows = [];

      transactions.forEach((txn) => {
        const txnData = [
          formatDate(txn.date),
          txn.id,
          txn.userDetails?.name || txn.name || "Anonymous",
          txn.location || "Unknown location",
          `$${(txn.amount || 0).toFixed(2)}`,
          txn.cardType || "Unknown",
          txn.status || "Unknown"
        ];
        tableRows.push(txnData);
      });

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 60,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [75, 85, 99],
          lineWidth: 0.25,
        },
        headStyles: {
          fillColor: [131, 115, 191], // Admin theme purple
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        }
      });
      
      // Add summary section
      const finalY = doc.lastAutoTable.finalY || 60;
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55);
      doc.text("Revenue Summary", 14, finalY + 15);
      
      doc.setFontSize(9);
      doc.text(`Daily Revenue: $${summaryStats.dailyRevenue.toFixed(2)}`, 14, finalY + 25);
      doc.text(`Weekly Revenue: $${summaryStats.weeklyRevenue.toFixed(2)}`, 80, finalY + 25);
      doc.text(`Monthly Revenue: $${summaryStats.monthlyRevenue.toFixed(2)}`, 150, finalY + 25);
      doc.text(`Average Transaction: $${summaryStats.avgTransaction.toFixed(2)}`, 14, finalY + 35);
      doc.text(`Most Popular Location: ${summaryStats.topLocation}`, 80, finalY + 35);
      
      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(75, 85, 99);
        doc.text(
          `Smart Parking Management - Admin Report | Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2, 
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
      
      doc.save("admin_payment_report.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF. Please try again.");
    }
  };

  // CSV export functionality
  const downloadCSV = () => {
    const dataToExport = transactions.map(txn => ({
      Transaction_ID: txn.id,
      Date: formatDate(txn.date),
      User: txn.userDetails?.name || txn.name || "Anonymous",
      User_Email: txn.userDetails?.email || txn.userEmail || "N/A",
      Location: txn.location || "Unknown location",
      Amount: txn.amount || 0,
      Payment_Method: txn.cardType || "Unknown",
      Card_Number: txn.cardNumber || "N/A",
      Vehicle_Type: txn.vehicleType || "N/A",
      Spot_Number: txn.spotNumber || "N/A",
      Duration: txn.duration || "N/A",
      Status: txn.status || "Unknown"
    }));
    
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "admin_payment_report.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter transactions based on search query and selected filter
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      (transaction.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (transaction.id?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (transaction.location?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (transaction.userDetails?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (transaction.userDetails?.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    
    if (selectedFilter === "all") return matchesSearch;
    if (selectedFilter === "high") return matchesSearch && (transaction.amount || 0) > 20;
    if (selectedFilter === "medium") return matchesSearch && (transaction.amount || 0) > 15 && (transaction.amount || 0) <= 20;
    if (selectedFilter === "low") return matchesSearch && (transaction.amount || 0) <= 15;
    
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1F2937]">Payment Reports</h2>
          <p className="text-sm text-[#6B7280]">View and manage all financial transactions</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={downloadPDF}
            className="flex items-center bg-[#8373BF] text-white px-4 py-2 rounded-lg hover:bg-[#8373BF]/80 transition-colors shadow-sm"
          >
            <FaDownload className="mr-2" />
            <span>Export PDF</span>
          </button>
          <button 
            onClick={downloadCSV}
            className="flex items-center bg-[#8373BF] text-white px-4 py-2 rounded-lg hover:bg-[#8373BF]/80 transition-colors shadow-sm"
          >
            <FaDownload className="mr-2" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-[#6B7280] mb-1">Total Revenue</h3>
          <p className="text-2xl font-bold text-[#8373BF]">${summaryStats.totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-[#4B5563] mt-1">{summaryStats.totalTransactions} transactions</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-[#6B7280] mb-1">Today s Revenue</h3>
          <p className="text-2xl font-bold text-[#8373BF]">${summaryStats.dailyRevenue.toFixed(2)}</p>
          <p className="text-xs text-[#4B5563] mt-1">
            {transactions.filter(tx => tx.date >= new Date(new Date().setHours(0,0,0,0))).length} transactions today
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-[#6B7280] mb-1">Weekly Revenue</h3>
          <p className="text-2xl font-bold text-[#8373BF]">${summaryStats.weeklyRevenue.toFixed(2)}</p>
          <p className="text-xs text-[#4B5563] mt-1">Last 7 days</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB] hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-[#6B7280] mb-1">Monthly Revenue</h3>
          <p className="text-2xl font-bold text-[#8373BF]">${summaryStats.monthlyRevenue.toFixed(2)}</p>
          <p className="text-xs text-[#4B5563] mt-1">Last 30 days</p>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" />
            <input
              type="text"
              placeholder="Search by transaction ID, user, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8373BF] bg-[#F9FAFB] text-[#1F2937]"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center bg-[#F9FAFB] px-3 py-2 rounded-lg border border-[#E5E7EB]">
              <FaFilter className="mr-2 text-[#8373BF]" />
              <select 
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="bg-[#F9FAFB] text-[#1F2937] focus:outline-none"
              >
                <option value="all">All Amounts</option>
                <option value="high">High ($20+)</option>
                <option value="medium">Medium ($15-20)</option>
                <option value="low">Low (Under $15)</option>
              </select>
            </div>
            
            <div className="flex items-center bg-[#F9FAFB] px-3 py-2 rounded-lg border border-[#E5E7EB]">
              <FaCalendarAlt className="mr-2 text-[#8373BF]" />
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-[#F9FAFB] text-[#1F2937] focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
            
            <button 
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="flex items-center bg-[#F9FAFB] px-3 py-2 rounded-lg hover:bg-[#F1F0FF] transition-colors border border-[#E5E7EB]"
            >
              <FaSort className="mr-2 text-[#8373BF]" />
              <span>{sortOrder === "asc" ? "Oldest First" : "Newest First"}</span>
            </button>
            
            <button 
              onClick={fetchTransactions} 
              className="flex items-center bg-[#8373BF] text-white px-3 py-2 rounded-lg hover:bg-[#8373BF]/80 transition-colors"
            >
              <FaFilter className="mr-2" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader text="Loading payment data..." />
        </div>
      ) : currentTransactions.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E5E7EB]">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#4B5563] uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#4B5563] uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#4B5563] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-[#4B5563] uppercase tracking-wider">Payment Method</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E5E7EB]">
                {currentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1F2937]">{formatDate(transaction.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[#1F2937]">{transaction.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#1F2937]">
                        {transaction.userDetails?.name || transaction.name || "Anonymous"}
                      </div>
                      <div className="text-xs text-[#6B7280]">
                        {transaction.userDetails?.email || transaction.userEmail || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#1F2937]">{transaction.location || "Unknown location"}</div>
                      <div className="text-xs text-[#6B7280]">Spot {transaction.spotNumber || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-[#1F2937]">
                      ${(transaction.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        (transaction.status || "").toLowerCase() === "completed" 
                          ? "bg-green-100 text-green-800" 
                          : (transaction.status || "").toLowerCase() === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1) || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-[#1F2937]">
                      {transaction.cardType || "Unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-[#E5E7EB]">
          <div className="inline-block p-4 bg-[#F9FAFB] rounded-full mb-4">
            <FaChartBar className="text-4xl text-[#8373BF]" />
          </div>
          <h3 className="text-xl font-semibold text-[#1F2937] mb-2">No transactions found</h3>
          <p className="text-[#6B7280] mb-6">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg ${
              currentPage === 1
                ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                : "bg-white text-[#8373BF] hover:bg-[#F1F0FF] border border-[#E5E7EB]"
            }`}
          >
            Previous
          </button>
          
          {getPageNumbers().map((number) => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={`px-4 py-2 rounded-lg ${
                currentPage === number
                  ? "bg-[#8373BF] text-white"
                  : "bg-white text-[#1F2937] hover:bg-[#F1F0FF] border border-[#E5E7EB]"
              }`}
            >
              {number}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage === pageCount}
            className={`px-4 py-2 rounded-lg ${
              currentPage === pageCount
                ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                : "bg-white text-[#8373BF] hover:bg-[#F1F0FF] border border-[#E5E7EB]"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentReports;