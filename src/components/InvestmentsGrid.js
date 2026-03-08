import React, { useState, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";

export default function InvestmentsGrid({ investments, customers }) {
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");

  // get unique types
  const uniqueTypes = useMemo(() => {
    return [...new Set(investments.map((inv) => inv.type))].filter(Boolean);
  }, [investments]);

  // filter investments by date range
  const filtered = useMemo(() => {
    return investments.filter((inv) => {
      const invStart = inv.startDate ? new Date(inv.startDate) : null;
      const filterStart = startDateFilter ? new Date(startDateFilter) : null;
      const filterEnd = endDateFilter ? new Date(endDateFilter) : null;

      if (filterStart && invStart && invStart < filterStart) return false;
      if (filterEnd && invStart && invStart > filterEnd) return false;

      if (typeFilter && inv.type !== typeFilter) return false;
      if (customerFilter && inv.customerId !== customerFilter) return false;

      return true;
    });
  }, [investments, startDateFilter, endDateFilter, typeFilter, customerFilter]);

  // group by type when no date filter
  const hasDateFilter = startDateFilter || endDateFilter;
  const displayData = useMemo(() => {
    if (hasDateFilter) {
      // show individual records
      return filtered.map((inv, idx) => {
        const customer = customers.find((c) => c.id === inv.customerId);
        return {
          id: inv.id || idx,
          customerName: customer?.name || "Unknown",
          investmentType: inv.type,
          amount: inv.value || 0,
          startDate: inv.startDate,
          endDate: inv.endDate,
        };
      });
    } else {
      // group by type and sum
      const grouped = {};
      filtered.forEach((inv) => {
        const type = inv.type;
        if (!grouped[type]) {
          grouped[type] = { type, totalAmount: 0, count: 0 };
        }
        grouped[type].totalAmount += inv.value || 0;
        grouped[type].count += 1;
      });
      return Object.entries(grouped).map(([type, data], idx) => ({
        id: `${type}-${idx}`,
        investmentType: data.type,
        totalAmount: data.totalAmount,
        count: data.count,
      }));
    }
  }, [filtered, hasDateFilter, customers]);

  const columns = hasDateFilter
    ? [
        { field: "customerName", headerName: "Customer", width: 150 },
        { field: "investmentType", headerName: "Type", width: 120 },
        { field: "amount", headerName: "Amount", width: 130, type: "number" },
        { field: "startDate", headerName: "Start Date", width: 130 },
        { field: "endDate", headerName: "End Date", width: 130 },
      ]
    : [
        { field: "investmentType", headerName: "Investment Type", width: 150 },
        {
          field: "totalAmount",
          headerName: "Total Amount",
          width: 150,
          type: "number",
        },
        { field: "count", headerName: "Count", width: 100, type: "number" },
      ];

  const totalAmount = displayData.reduce((sum, row) => {
    const value = hasDateFilter ? row.amount : row.totalAmount;
    return sum + (value || 0);
  }, 0);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2>Investments</h2>
        <div>Total Portfolio Value: ${totalAmount.toLocaleString()}</div>
      </div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h3>Filters</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: "1rem",
          }}
        >
          <div>
            <label>Start Date Filter</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
            />
          </div>
          <div>
            <label>End Date Filter</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
            />
          </div>
          <div>
            <label>Investment Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Customer</label>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!hasDateFilter && (
        <p style={{ fontWeight: "bold", marginBottom: "1rem" }}>
          Grouped by Investment Type (Individual mode when date filters active)
        </p>
      )}

      <div style={{ height: 400, width: "100%" }} className="data-grid-card">
        <DataGrid rows={displayData} columns={columns} pageSize={5} />
      </div>

      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          background: "#f5f5f5",
          borderRadius: "4px",
        }}
      ></div>
    </div>
  );
}
