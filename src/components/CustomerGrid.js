import * as React from "react";
import { DataGrid } from "@mui/x-data-grid";

export default function CustomerGrid({ customers }) {
  const columns = [
    { field: "name", headerName: "Name", width: 150 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "phone", headerName: "Phone", width: 150 },
    // add more fields as needed
  ];

  const rows = customers.map((c) => ({ id: c.id, ...c }));

  return (
    <div className="data-grid-card" style={{ height: 400, width: "100%" }}>
      <DataGrid rows={rows} columns={columns} pageSize={5} />
    </div>
  );
}
