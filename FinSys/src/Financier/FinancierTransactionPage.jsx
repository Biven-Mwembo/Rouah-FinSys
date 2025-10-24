import React, { useEffect, useState } from "react";
import axios from "axios";

// Card component for totals
const Card = ({ title, value }) => (
  <div className="card p-4 shadow rounded bg-white">
    <h3 className="font-bold mb-2">{title}</h3>
    <p className="text-lg">{value.toFixed(2)}</p>
  </div>
);

const FinancierTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [dollarsSum, setDollarsSum] = useState([0, 0]); // [Entrées, Sorties]
  const [fcSum, setFcSum] = useState([0, 0]); // [Entrées, Sorties]
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const { data } = await axios.get(
        "https://finsys.onrender.com/api/transactions",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const sortedTx = data.sort((a, b) => new Date(b.date) - new Date(a.date)); // Latest first
      setTransactions(sortedTx);
      calculateSums(sortedTx);
      calculatePerformance(sortedTx);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(
        "https://finsys.onrender.com/api/users/all",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Calculate sums by currency and channel
  const calculateSums = (transactions) => {
    const approvedTx = transactions.filter((tx) => tx.status === "Approved");

    const totalDollarsEntrees = approvedTx
      .filter((tx) => tx.channel === "Entrées" && tx.currency === "$")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const totalDollarsSorties = approvedTx
      .filter((tx) => tx.channel === "Sorties" && tx.currency === "$")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const totalFcEntrees = approvedTx
      .filter((tx) => tx.channel === "Entrées" && tx.currency === "FC")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const totalFcSorties = approvedTx
      .filter((tx) => tx.channel === "Sorties" && tx.currency === "FC")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    setDollarsSum([totalDollarsEntrees, totalDollarsSorties]);
    setFcSum([totalFcEntrees, totalFcSorties]);
  };

  // Calculate performance metrics
  const calculatePerformance = (txData) => {
    const approvedTx = txData.filter((tx) => tx.status === "Approved");
    const totalTx = approvedTx.length;

    const userTxCounts = {};
    approvedTx.forEach(tx => {
      const userId = tx.user_id;
      if (userId) userTxCounts[userId] = (userTxCounts[userId] || 0) + 1;
    });

    const userContributions = {};
    approvedTx.forEach(tx => {
      const userId = tx.user_id;
      if (userId) {
        if (!userContributions[userId]) userContributions[userId] = { entrees: { usd: 0, fc: 0 }, sorties: { usd: 0, fc: 0 } };
        if (tx.channel === "Entrées") {
          if (tx.currency === "$") userContributions[userId].entrees.usd += Number(tx.amount || 0);
          else if (tx.currency === "FC") userContributions[userId].entrees.fc += Number(tx.amount || 0);
        } else if (tx.channel === "Sorties") {
          if (tx.currency === "$") userContributions[userId].sorties.usd += Number(tx.amount || 0);
          else if (tx.currency === "FC") userContributions[userId].sorties.fc += Number(tx.amount || 0);
        }
      }
    });

    const aggregates = { entrees: { usd: dollarsSum[0], fc: fcSum[0] }, sorties: { usd: dollarsSum[1], fc: fcSum[1] } };

    const sortedUsers = Object.entries(userTxCounts)
      .map(([userId, count]) => {
        const user = users.find(u => u.id === userId);
        return {
          id: userId,
          name: user ? `${user.name} ${user.surname}` : "Unknown",
          txCount: count,
          contributions: userContributions[userId] || { entrees: { usd: 0, fc: 0 }, sorties: { usd: 0, fc: 0 } },
        };
      })
      .sort((a, b) => b.txCount - a.txCount);

    const topUser = sortedUsers[0];

    setPerformanceData({
      totalTx,
      sortedUsers,
      topUser,
      aggregates,
    });
  };

  // Delete transaction
  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `https://finsys.onrender.com/api/transactions/item/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = transactions.filter((tx) => tx.id !== id);
      setTransactions(updated);
      calculateSums(updated);
      calculatePerformance(updated);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Edit transaction
  const handleEdit = async (id, updatedData) => {
    try {
      await axios.patch(
        `https://finsys.onrender.com/api/transactions/item/${id}`,
        updatedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = transactions.map((tx) =>
        tx.id === id ? { ...tx, ...updatedData } : tx
      );
      setTransactions(updated);
      calculateSums(updated);
      calculatePerformance(updated);
    } catch (err) {
      console.error("Edit failed:", err);
    }
  };

  // Get user name
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.name} ${user.surname}` : userId || "N/A";
  };

  useEffect(() => {
    fetchTransactions();
    fetchUsers();
  }, []);

  if (loading) return <p>Loading transactions...</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Financier Transactions</h1>

      {/* Total Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card title="Entrées USD ($)" value={dollarsSum[0]} />
        <Card title="Sorties USD ($)" value={dollarsSum[1]} />
        <Card title="Entrées FC" value={fcSum[0]} />
        <Card title="Sorties FC" value={fcSum[1]} />
      </div>

      {/* Performance Metrics */}
      {performanceData && (
        <div className="card p-4 shadow rounded mb-6">
          <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
          {performanceData.topUser && (
            <div className="mb-4">
              <h3>Top Contributor</h3>
              <p><strong>{performanceData.topUser.name}</strong> added the most transactions: {performanceData.topUser.txCount} out of {performanceData.totalTx} total.</p>
            </div>
          )}
          <div className="mb-4">
            <h3>User Rankings</h3>
            <ul>
              {performanceData.sortedUsers.map((user, index) => (
                <li key={user.id}>
                  {index + 1}. {user.name} - {user.txCount} transactions
                </li>
              ))}
            </ul>
          </div>
          {/* Add progress bars here if needed */}
        </div>
      )}

      {/* Transactions Table */}
      <table className="table-auto w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">User</th>
            <th className="border px-4 py-2">Date</th>
            <th className="border px-4 py-2">Amount</th>
            <th className="border px-4 py-2">Currency</th>
            <th className="border px-4 py-2">Channel</th>
            <th className="border px-4 py-2">Motif</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td className="border px-4 py-2">{tx.id}</td>
              <td className="border px-4 py-2">{getUserName(tx.user_id)}</td>
              <td className="border px-4 py-2">{tx.date ? new Date(tx.date).toLocaleDateString() : "N/A"}</td>
              <td className="border px-4 py-2">{tx.amount}</td>
              <td className="border px-4 py-2">{tx.currency}</td>
              <td className="border px-4 py-2">{tx.channel}</td>
              <td className="border px-4 py-2">{tx.motif}</td>
              <td className="border px-4 py-2">{tx.status}</td>
              <td className="border px-4 py-2 flex gap-2">
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() =>
                    handleEdit(tx.id, {
                      status: tx.status === "Approved" ? "Pending" : "Approved",
                    })
                  }
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded"
                  onClick={() => handleDelete(tx.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FinancierTransactionsPage;
