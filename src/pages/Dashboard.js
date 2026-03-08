import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getCustomers, getWorkLogs } from "../services/firestoreService";
import CustomerGrid from "../components/CustomerGrid";
import Insights from "../components/Insights";

export default function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("");

  const { logout, currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    getCustomers(uid).then(setCustomers).catch(console.error);
    getWorkLogs(uid, { orderBy: "date", direction: "asc" })
      .then((items) => {
        setLogs(items);
      })
      .catch(console.error);
  }, [currentUser]);

  // filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) =>
      c.name?.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [customers, filter]);

  // calculate total portfolio (sum of customer portfolioValue)
  const totalPortfolio = useMemo(() => {
    return filteredCustomers.reduce(
      (sum, c) => sum + (c.portfolioValue || 0),
      0,
    );
  }, [filteredCustomers]);

  // prepare data for chart (simple example)
  const chartData = logs.map((log) => ({
    date: log.date,
    value: log.value || 1,
  }));

  return (
    <div>
      <div className="dashboard-header">
        <h1>Agent Dashboard</h1>
        <div>Total Portfolio: INR {totalPortfolio.toLocaleString()}</div>
      </div>
      <div className="section">
        <h2>Customers</h2>
        <input
          type="text"
          placeholder="Filter by customer name"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ marginBottom: "1rem", width: "100%" }}
        />
        <CustomerGrid customers={filteredCustomers} />
      </div>
      <div className="section">
        <h2>Insights</h2>
        <Insights data={chartData} />
      </div>
    </div>
  );
}
