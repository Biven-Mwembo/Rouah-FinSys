import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Transactions.css";

const API_BASE_URL = "https://finsys.onrender.com/api";

const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0]; // YYYY-MM-DD for input type=date
};

export default function AdminUpdatePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState(null);
    const [formData, setFormData] = useState({});
    const [banner, setBanner] = useState({ message: "", type: "" });
    const token = localStorage.getItem("token");

    // Fetch transaction by ID
    const fetchTransaction = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/transactions/item/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTransaction(res.data);
            setFormData({
                date: formatDate(res.data.date),
                amount: res.data.amount,
                currency: res.data.currency,
                channel: res.data.channel,
                motif: res.data.motif,
            });
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            setBanner({ message: `❌ Failed to load transaction: ${msg}`, type: "error" });
        }
    };

    useEffect(() => { fetchTransaction(); }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.patch(
                `${API_BASE_URL}/transactions/item/${id}`,
                { ...formData, amount: parseFloat(formData.amount) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setBanner({ message: "✅ Transaction updated successfully!", type: "success" });
            setTimeout(() => {
                setBanner({ message: "", type: "" });
                navigate("/admin/transactions"); // Go back to transactions list
            }, 2000);
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            setBanner({ message: `❌ Update failed: ${msg}`, type: "error" });
        }
    };

    if (!transaction) return <p>Loading transaction...</p>;

    return (
        <div className="transactions-container">
            {banner.message && (
                <div className={`toast-notification ${banner.type}`}>{banner.message}</div>
            )}

            <h1>Edit Transaction #{id}</h1>

            <form className="edit-form" onSubmit={handleSubmit}>
                <label>
                    Date:
                    <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                </label>
                <label>
                    Amount:
                    <input type="number" name="amount" value={formData.amount} step="0.01" onChange={handleChange} required />
                </label>
                <label>
                    Currency:
                    <input type="text" name="currency" value={formData.currency} onChange={handleChange} required />
                </label>
                <label>
                    Channel:
                    <input type="text" name="channel" value={formData.channel} onChange={handleChange} required />
                </label>
                <label>
                    Motif:
                    <input type="text" name="motif" value={formData.motif} onChange={handleChange} />
                </label>
                <div className="form-actions">
                    <button type="submit" className="action-btn save-btn">Save</button>
                    <button type="button" className="action-btn cancel-btn" onClick={() => navigate("/admin/transactions")}>Cancel</button>
                </div>
            </form>
        </div>
    );
}
