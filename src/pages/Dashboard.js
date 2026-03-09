import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getCustomers,
  getAllInvestments,
  updateInvestment,
  deleteInvestment,
} from "../services/firestoreService";
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

  // Handle update investment amount
  const handleUpdateInvestment = async (rowData, newAmount) => {
    try {
      const investmentsForRow = investments.filter(
        (inv) =>
          inv.customerId === rowData.customerId &&
          inv.type === rowData.investmentType,
      );

      if (investmentsForRow.length === 0) return;

      // If there's only one investment, update it directly
      if (investmentsForRow.length === 1) {
        await updateInvestment(currentUser.uid, investmentsForRow[0].id, {
          value: newAmount,
        });
      } else {
        // If multiple investments, proportionally distribute the new amount
        const oldTotal = investmentsForRow.reduce(
          (sum, inv) => sum + (inv.value || 0),
          0,
        );
        const ratio = oldTotal > 0 ? newAmount / oldTotal : 0;

        for (const inv of investmentsForRow) {
          const newValue = inv.value * ratio;
          await updateInvestment(currentUser.uid, inv.id, {
            value: newValue,
          });
        }
      }

      // Refresh investments
      const updatedInvestments = await getAllInvestments(currentUser.uid);
      setInvestments(updatedInvestments);
    } catch (error) {
      console.error("Error updating investment:", error);
      alert("Failed to update investment");
    }
  };

  // Handle delete investment(s)
  const handleDeleteInvestment = async (rowData) => {
    try {
      const investmentsForRow = investments.filter(
        (inv) =>
          inv.customerId === rowData.customerId &&
          inv.type === rowData.investmentType,
      );

      // Delete all investments for this customer-type combination
      for (const inv of investmentsForRow) {
        await deleteInvestment(currentUser.uid, inv.id);
      }

      // Refresh investments
      const updatedInvestments = await getAllInvestments(currentUser.uid);
      setInvestments(updatedInvestments);
    } catch (error) {
      console.error("Error deleting investment:", error);
      alert("Failed to delete investment");
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1>Agent Dashboard</h1>
        <div>Total Portfolio: ₹ {totalPortfolio.toLocaleString()}</div>
      </div>
      <div className="section">
        <h2>Customers</h2>
        <CustomerGrid
          customers={filteredCustomers}
          investments={investments}
          onUpdateInvestment={handleUpdateInvestment}
          onDeleteInvestment={handleDeleteInvestment}
        />
      </div>
      <div className="section">
        <InvestmentsGrid
          investments={investments}
          customers={customers}
          onUpdateInvestment={handleUpdateInvestment}
          onDeleteInvestment={handleDeleteInvestment}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}
