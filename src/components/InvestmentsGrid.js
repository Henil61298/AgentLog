import React, { useState, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";

export default function InvestmentsGrid({
  investments,
  customers,
  onUpdateInvestment,
  onDeleteInvestment,
  currentUser,
}) {
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editData, setEditData] = useState(null);
  const [newAmount, setNewAmount] = useState("");
  const [newRemarks, setNewRemarks] = useState("");

  // get unique types
  const uniqueTypes = useMemo(() => {
    return [...new Set(investments.map((inv) => inv.type))].filter(Boolean);
  }, [investments]);

  const handleEditClick = (investment) => {
    setEditData(investment);
    setNewAmount(investment.value?.toString() || "");
    setNewRemarks(investment.remarks || "");
    setOpenDialog(true);
  };

  const handleDeleteClick = (investment) => {
    if (window.confirm(`Delete this investment of ₹${investment.value}?`)) {
      const customerName = customers.find(
        (c) => c.id === investment.customerId,
      )?.name;
      handleDeleteSingleInvestment(investment, customerName);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditData(null);
    setNewAmount("");
    setNewRemarks("");
  };

  const handleSaveAmount = async () => {
    if (!editData || !newAmount) return;
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const { updateInvestment } = await import("../services/firestoreService");
      await updateInvestment(currentUser.uid, editData.id, {
        value: amount,
        remarks: newRemarks || "",
      });
      // Trigger refresh via parent callback
      onUpdateInvestment(editData, amount, newRemarks);
      handleCloseDialog();
    } catch (error) {
      console.error("Error updating investment:", error);
      alert("Failed to update investment");
    }
  };

  const handleDeleteSingleInvestment = async (investment, customerName) => {
    try {
      const { deleteInvestment } = await import("../services/firestoreService");
      await deleteInvestment(currentUser.uid, investment.id);
      // Trigger refresh via parent callback
      onDeleteInvestment({ ...investment, name: customerName });
    } catch (error) {
      console.error("Error deleting investment:", error);
      alert("Failed to delete investment");
    }
  };

  const RenderActionButtons = (params) => {
    return (
      <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
        <IconButton
          size="small"
          onClick={() => handleEditClick(params.row)}
          title="Edit Amount"
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={() => handleDeleteClick(params.row)}
          title="Delete Investment"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  };

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
          customerId: inv.customerId,
          customerName: customer?.name || "Unknown",
          pan: customer?.pan || "",
          investmentType: inv.type,
          amount: inv.value || 0,
          value: inv.value || 0,
          startDate: inv.startDate,
          endDate: inv.endDate,
          remarks: inv.remarks || "",
        };
      });
    } else {
      // group by type and sum
      const grouped = {};
      filtered.forEach((inv) => {
        const type = inv.type;
        if (!grouped[type]) {
          grouped[type] = { type, totalAmount: 0, count: 0, pan: "" };
        }
        grouped[type].totalAmount += inv.value || 0;
        grouped[type].count += 1;
        // set pan from first matching customer if not already set
        if (!grouped[type].pan) {
          const customer = customers.find((c) => c.id === inv.customerId);
          grouped[type].pan = customer?.pan || "";
        }
      });
      return Object.entries(grouped).map(([type, data], idx) => ({
        id: `${type}-${idx}`,
        investmentType: data.type,
        pan: data.pan,
        totalAmount: data.totalAmount,
        count: data.count,
      }));
    }
  }, [filtered, hasDateFilter, customers]);

  const columns = hasDateFilter
    ? [
        {
          field: "customerName",
          headerName: "Customer",
          width: 150,
          align: "center",
          headerAlign: "center",
        },
        {
          field: "pan",
          headerName: "PAN",
          width: 140,
          filterable: true,
          align: "center",
          headerAlign: "center",
        },
        {
          field: "investmentType",
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
        {
          field: "startDate",
          headerName: "Start Date",
          width: 130,
          align: "center",
          headerAlign: "center",
        },
        {
          field: "endDate",
          headerName: "End Date",
          width: 130,
          align: "center",
          headerAlign: "center",
        },
        {
          field: "remarks",
          headerName: "Remarks",
          width: 200,
          filterable: true,
          align: "center",
          headerAlign: "center",
        },
        {
          field: "actions",
          headerName: "Actions",
          width: 120,
          sortable: false,
          filterable: false,
          align: "center",
          headerAlign: "center",
          renderCell: RenderActionButtons,
        },
      ]
    : [
        {
          field: "investmentType",
          headerName: "Investment Type",
          width: 150,
          align: "center",
          headerAlign: "center",
        },
        {
          field: "pan",
          headerName: "PAN",
          width: 140,
          filterable: true,
          align: "center",
          headerAlign: "center",
        },
        {
          field: "totalAmount",
          headerName: "Total Amount",
          width: 150,
          type: "number",
          align: "center",
          headerAlign: "center",
        },
        {
          field: "count",
          headerName: "Count",
          width: 100,
          type: "number",
          align: "center",
          headerAlign: "center",
        },
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
        <div className="portfolio-value">
          Total Portfolio Value: ₹ {totalAmount.toLocaleString()}
        </div>
      </div>
      <div style={{ marginBottom: "1.5rem" }}>
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

      {/* Edit Amount Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Edit Investment Amount</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            type="number"
            label="New Amount (₹)"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            fullWidth
            margin="dense"
            inputProps={{ step: "0.01", min: "0" }}
          />
          <TextField
            type="text"
            label="Remarks"
            value={newRemarks}
            onChange={(e) => setNewRemarks(e.target.value)}
            fullWidth
            margin="dense"
          />
          {editData && (
            <Box sx={{ mt: 2, fontSize: "0.9rem", color: "gray" }}>
              <div>
                Customer:{" "}
                <strong>
                  {customers.find((c) => c.id === editData.customerId)?.name ||
                    "Unknown"}
                </strong>
              </div>
              <div>
                Type: <strong>{editData.investmentType}</strong>
              </div>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveAmount}
            variant="contained"
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

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
