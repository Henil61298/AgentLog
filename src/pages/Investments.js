import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getCustomers, addWorkLog } from "../services/firestoreService";

export default function Investments() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    getCustomers(currentUser.uid).then(setCustomers).catch(console.error);
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !amount || !date) return;

    setLoading(true);
    try {
      await addWorkLog(currentUser.uid, {
        customerId: selectedCustomer,
        value: parseFloat(amount),
        date,
        type: "investment",
      });
      // reset form
      setSelectedCustomer("");
      setAmount("");
      setDate("");
      alert("Investment added!");
    } catch (err) {
      console.error(err);
      alert("Failed to add investment");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Manage Investments</h1>
      <form onSubmit={handleSubmit} className="auth-container">
        <label>Customer</label>
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          required
        >
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label>Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          Add Investment
        </button>
      </form>
    </div>
  );
}