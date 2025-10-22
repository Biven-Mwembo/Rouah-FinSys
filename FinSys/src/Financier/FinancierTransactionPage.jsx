import React, { useEffect, useState } from "react";
import axios from "axios";

// Optional: Replace with your own card/table components
const Card = ({ title, entries, sorties }) => (
  <div className="card p-4 shadow rounded">
    <h3 className="font-bold mb-2">{title}</h3>
    <p>Entrées: {entries.toFixed(2)}</p>
    <p>Sorties: {sorties.toFixed(2)}</p>
  </div>
);

const FinancierTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [dollarsSum, setDollarsSum] = useState([0, 0]); // [Entrées, Sorties]
  const [fcSum, setFcSum] = useState([0, 0]); // [Entrées, Sorties]
  const [loading, setLoading] = useState(true);

  // Fetch transactions from API
  const fetchTransactions = async () => {
    try {
      const { data } = await axios.get(
        "https://finsys.onrender.com/api/transactions"
      );
      setTransactions(data);
      calculateSums(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setLoading(false);
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

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Delete transaction
  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `https://finsys.onrender.com/api/transactions/item/${id}`
      );
      const updated = transactions.filter((tx) => tx.id !== id);
      setTransactions(updated);
      calculateSums(updated); // recalc sums
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Edit transaction
  const handleEdit = async (id, updatedData) => {
    try {
      await axios.patch(
        `https://finsys.onrender.com/api/transactions/item/${id}`,
        updatedData
      );
      const updated = transactions.map((tx) =>
        tx.id === id ? { ...tx, ...updatedData } : tx
      );
      setTransactions(updated);
      calculateSums(updated);
    } catch (err) {
      console.error("Edit failed:", err);
    }
  };

  if (loading) return <p>Loading transactions...</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Financier Transactions</h1>

      {/* Cards showing totals like Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card
          title="USD ($)"
          entries={dollarsSum[0]}
          sorties={dollarsSum[1]}
        />
        <Card title="FC" entries={fcSum[0]} sorties={fcSum[1]} />
      </div>

      {/* Transactions Table */}
      <table className="table-auto w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">Amount</th>
            <th className="border px-4 py-2">Currency</th>
            <th className="border px-4 py-2">Channel</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td className="border px-4 py-2">{tx.id}</td>
              <td className="border px-4 py-2">{tx.amount}</td>
              <td className="border px-4 py-2">{tx.currency}</td>
              <td className="border px-4 py-2">{tx.channel}</td>
              <td className="border px-4 py-2">{tx.status}</td>
              <td className="border px-4 py-2 flex gap-2">
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() =>
                    handleEdit(tx.id, {
                      // Example edit: toggle status
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
