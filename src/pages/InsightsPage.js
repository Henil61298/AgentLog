import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getAllInvestments, getCustomers } from "../services/firestoreService";
import { DataGrid } from "@mui/x-data-grid";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function InsightsPage() {
  const [investments, setInvestments] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");

  const setThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDateFilter(start.toISOString().split("T")[0]);
    setEndDateFilter(end.toISOString().split("T")[0]);
  };

  const clearFilters = () => {
    setStartDateFilter("");
    setEndDateFilter("");
    setCustomerFilter("");
  };

  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    getAllInvestments(uid).then(setInvestments).catch(console.error);
    getCustomers(uid).then(setCustomers).catch(console.error);
  }, [currentUser]);

  // filtered based on date and customer
  const filtered = useMemo(() => {
    return investments.filter((inv) => {
      const invDate = inv.startDate ? new Date(inv.startDate) : null;
      if (startDateFilter && invDate && invDate < new Date(startDateFilter))
        return false;
      if (endDateFilter && invDate && invDate > new Date(endDateFilter))
        return false;
      if (customerFilter && inv.customerId !== customerFilter) return false;
      return true;
    });
  }, [investments, startDateFilter, endDateFilter, customerFilter]);

  // compute previous period stats
  const { currentTotal, previousTotal, percentChange } = useMemo(() => {
    if (!startDateFilter || !endDateFilter) {
      return { currentTotal: 0, previousTotal: 0, percentChange: 0 };
    }
    const start = new Date(startDateFilter);
    const end = new Date(endDateFilter);
    const lengthMs = end.getTime() - start.getTime() + 1;
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - lengthMs + 1);

    const calcTotal = (list, s, e) =>
      list
        .filter((inv) => {
          const d = inv.startDate ? new Date(inv.startDate) : null;
          return d && d >= s && d <= e;
        })
        .reduce((sum, inv) => sum + (inv.value || 0), 0);

    const curr = calcTotal(filtered, start, end);
    const prev = calcTotal(investments, prevStart, prevEnd);
    const change = prev === 0 ? 0 : ((curr - prev) / prev) * 100;
    return { currentTotal: curr, previousTotal: prev, percentChange: change };
  }, [filtered, investments, startDateFilter, endDateFilter]);

  // daily line data for filtered period
  const dailyData = useMemo(() => {
    const map = {};
    filtered.forEach((inv) => {
      const d = inv.startDate ? inv.startDate.split("T")[0] : "";
      if (d) {
        map[d] = (map[d] || 0) + (inv.value || 0);
      }
    });
    return Object.entries(map).map(([date, value]) => ({ date, value }));
  }, [filtered]);

  const barData = [
    { period: "Current", value: currentTotal },
    { period: "Previous", value: previousTotal },
  ];

  const typeData = useMemo(() => {
    const map = {};
    filtered.forEach((inv) => {
      const t = inv.type || "Unknown";
      map[t] = (map[t] || 0) + (inv.value || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const tableRows = filtered.map((inv, idx) => {
    const cust = customers.find((c) => c.id === inv.customerId);
    return {
      id: inv.id || idx,
      date: inv.startDate || "",
      customer: cust?.name || "Unknown",
      type: inv.type || "",
      amount: inv.value || 0,
    };
  });

  const tableColumns = [
    {
      field: "date",
      headerName: "Date",
      width: 130,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "customer",
      headerName: "Customer",
      width: 140,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "type",
      headerName: "Type",
      width: 120,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 130,
      type: "number",
      align: "center",
      headerAlign: "center",
    },
  ];

  return (
    <div>
      <h1>Insights</h1>
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ marginRight: "0.5rem" }}>Start Date:</label>
        <input
          type="date"
          value={startDateFilter}
          onChange={(e) => setStartDateFilter(e.target.value)}
        />
        <label style={{ margin: "0 0.5rem" }}>End Date:</label>
        <input
          type="date"
          value={endDateFilter}
          onChange={(e) => setEndDateFilter(e.target.value)}
        />
        <button onClick={setThisMonth} style={{ margin: "0 0.5rem" }}>
          This Month
        </button>
        <button onClick={clearFilters} style={{ margin: "0 0.5rem" }}>
          Clear
        </button>
        <div style={{ marginTop: "10px" }}>
          <label style={{ margin: "0 0.5rem" }}>Customer:</label>
        </div>
        <select
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
        >
          <option value="">All</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {startDateFilter && endDateFilter && (
        <div style={{ marginBottom: "1rem" }}>
          <strong>Current Total:</strong> ₹ {currentTotal.toLocaleString()}{" "}
          <br />
          <strong>Previous Total:</strong> ₹ {previousTotal.toLocaleString()}{" "}
          <br />
          <strong>Change:</strong> {percentChange.toFixed(2)} %
        </div>
      )}

      {/* Charts */}
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 300, height: 300 }}>
          <h3>Daily Activity</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 300, height: 300 }}>
          <h3>Period Comparison</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 300, height: 300 }}>
          <h3>By Investment Type</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {typeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      ["#8884d8", "#82ca9d", "#ffc658", "#d0ed57", "#a4de6c"][
                        index % 5
                      ]
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table of investments */}
      <div style={{ height: 400, width: "100%", marginTop: "1rem" }}>
        <DataGrid rows={tableRows} columns={tableColumns} pageSize={5} />
      </div>
    </div>
  );
}
