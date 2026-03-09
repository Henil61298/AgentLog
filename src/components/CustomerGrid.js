import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
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

export default function CustomerGrid({
  customers,
  investments,
  onUpdateInvestment,
  onDeleteInvestment,
}) {
  const [filterModel, setFilterModel] = useState({
    items: [],
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [editData, setEditData] = useState(null);
  const [newAmount, setNewAmount] = useState("");

  const handleEditClick = (rowData) => {
    setEditData(rowData);
    // Calculate total amount for that customer-type combo
    const investmentsForRow = investments.filter(
      (inv) =>
        inv.customerId === rowData.customerId &&
        inv.type === rowData.investmentType,
    );
    const total = investmentsForRow.reduce(
      (sum, inv) => sum + (inv.value || 0),
      0,
    );
    setNewAmount(total.toString());
    setOpenDialog(true);
  };

  const handleDeleteClick = (rowData) => {
    if (
      window.confirm(
        `Delete all investments of type "${rowData.investmentType}" for ${rowData.name}?`,
      )
    ) {
      onDeleteInvestment(rowData);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditData(null);
    setNewAmount("");
  };

  const handleSaveAmount = () => {
    if (!editData || !newAmount) return;
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) {
      alert("Please enter a valid amount");
      return;
    }
    onUpdateInvestment(editData, amount);
    handleCloseDialog();
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

  const columns = [
    {
      field: "name",
      headerName: "Name",
      width: 140,
      filterable: true,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "email",
      headerName: "Email",
      width: 180,
      filterable: true,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "mobile",
      headerName: "Phone",
      width: 130,
      filterable: true,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "dob",
      headerName: "DOB",
      width: 120,
      filterable: true,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "investmentType",
      headerName: "Investment Type",
      width: 140,
      filterable: true,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "totalAmount",
      headerName: "Total Investment",
      width: 140,
      type: "number",
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
  ];

  const rows = useMemo(() => {
    if (!investments || investments.length === 0) {
      // no investments, show customers without investment types
      return customers.map((c, idx) => ({
        id: `${c.id}-0`,
        customerId: c.id,
        name: c.name,
        email: c.email,
        mobile: c.mobile,
        dob: c.dob,
        investmentType: "-",
        totalAmount: 0,
      }));
    }

    // group investments by customer and type
    const grouped = {};
    investments.forEach((inv) => {
      const customerId = inv.customerId;
      const type = inv.type || "Unknown";
      const key = `${customerId}-${type}`;

      if (!grouped[key]) {
        grouped[key] = {
          customerId,
          type,
          total: 0,
        };
      }
      grouped[key].total += inv.value || 0;
    });

    // create rows
    const rowList = [];
    Object.entries(grouped).forEach(([key, data]) => {
      const customer = customers.find((c) => c.id === data.customerId);
      if (customer) {
        rowList.push({
          id: key,
          customerId: data.customerId,
          name: customer.name,
          email: customer.email,
          mobile: customer.mobile,
          dob: customer.dob,
          investmentType: data.type,
          totalAmount: data.total,
        });
      }
    });

    return rowList;
  }, [customers, investments]);

  return (
    <div className="data-grid-card" style={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5}
        filterModel={filterModel}
        onFilterModelChange={(newFilterModel) => setFilterModel(newFilterModel)}
      />

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
          {editData && (
            <Box sx={{ mt: 2, fontSize: "0.9rem", color: "gray" }}>
              <div>
                Customer: <strong>{editData.name}</strong>
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
    </div>
  );
}
