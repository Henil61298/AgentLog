import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getCustomers,
  addWorkLog,
  addInvestmentType,
  getInvestmentTypes,
} from "../services/firestoreService";

export default function Investments() {
  const [customers, setCustomers] = useState([]);
  const [investmentTypes, setInvestmentTypes] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [amount, setAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [newType, setNewType] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    getCustomers(currentUser.uid).then(setCustomers).catch(console.error);
    getInvestmentTypes(currentUser.uid)
      .then(setInvestmentTypes)
      .catch(console.error);
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !amount || !startDate || !endDate || !selectedType)
      return;

    setLoading(true);
    try {
      await addWorkLog(currentUser.uid, {
        customerId: selectedCustomer,
        value: parseFloat(amount),
        startDate,
        endDate,
        type: selectedType,
      });
      // reset form
      setSelectedCustomer("");
      setAmount("");
      setStartDate("");
      setEndDate("");
      setSelectedType("");
      alert("Investment added!");
    } catch (err) {
      console.error(err);
      alert("Failed to add investment");
    }
    setLoading(false);
  };

  const handleAddType = async () => {
    if (!newType.trim()) return;
    try {
      await addInvestmentType(currentUser.uid, newType.trim());
      setNewType("");
      setShowModal(false);
      // refresh types
      getInvestmentTypes(currentUser.uid).then(setInvestmentTypes);
      alert("Investment type added!");
    } catch (err) {
      console.error(err);
      alert("Failed to add type");
    }
  };

  return (
    <div className="form-page-wrapper">
      <h1>Manage Investments</h1>
      <form onSubmit={handleSubmit}>
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
        <label>Investment Type</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          required
        >
          <option value="">Select Type</option>
          {investmentTypes.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
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
        <label>Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <label>End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
        <div
          style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}
        >
          <button type="submit" disabled={loading}>
            Add Investment
          </button>
          <button type="button" onClick={() => setShowModal(true)}>
            Add Type
          </button>
        </div>
      </form>
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "white",
              padding: "2rem",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Add New Investment Type</h3>
            <input
              type="text"
              placeholder="Investment type name"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              style={{ width: "100%", marginBottom: "1rem" }}
            />
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                justifyContent: "flex-end",
              }}
            >
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button onClick={handleAddType}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
