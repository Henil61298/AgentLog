import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useMemo, useState } from "react";

export default function CustomerGrid({ customers, investments }) {
  const [filterModel, setFilterModel] = useState({
    items: [],
  });

  const columns = [
    { field: "name", headerName: "Name", width: 140, filterable: true },
    { field: "email", headerName: "Email", width: 180, filterable: true },
    { field: "mobile", headerName: "Phone", width: 130, filterable: true },
    { field: "dob", headerName: "DOB", width: 120, filterable: true },
    {
      field: "investmentType",
      headerName: "Investment Type",
      width: 140,
      filterable: true,
    },
    {
      field: "totalAmount",
      headerName: "Total Investment",
      width: 140,
      type: "number",
      filterable: true,
    },
  ];

  const rows = useMemo(() => {
    if (!investments || investments.length === 0) {
      // no investments, show customers without investment types
      return customers.map((c, idx) => ({
        id: `${c.id}-0`,
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
    </div>
  );
}
