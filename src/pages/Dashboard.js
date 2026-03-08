import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getCustomers, getAllInvestments } from "../services/firestoreService";
import CustomerGrid from "../components/CustomerGrid";
import InvestmentsGrid from "../components/InvestmentsGrid";
import Insights from "../components/Insights";

export default function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [filter, setFilter] = useState("");

  const { logout, currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    getCustomers(uid).then(setCustomers).catch(console.error);
    getAllInvestments(uid).then(setInvestments).catch(console.error);
  }, [currentUser]);

  // filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) =>
      c.name?.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [customers, filter]);

  // calculate total portfolio (sum of all investments)
  const totalPortfolio = useMemo(() => {
    return investments.reduce((sum, inv) => sum + (inv.value || 0), 0);
  }, [investments]);

  return (
    <div>
      <div className="dashboard-header">
        <h1>Agent Dashboard</h1>
        <div>Total Portfolio: ₹ {totalPortfolio.toLocaleString()}</div>
      </div>
      <div className="section">
        <h2>Customers</h2>
        <CustomerGrid customers={filteredCustomers} investments={investments} />
      </div>
      <div className="section">
        <InvestmentsGrid investments={investments} customers={customers} />
      </div>
    </div>
  );
}
