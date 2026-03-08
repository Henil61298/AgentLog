import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getWorkLogs } from "../services/firestoreService";
import Insights from "../components/Insights";

export default function InsightsPage() {
  const [logs, setLogs] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    getWorkLogs(uid, { orderBy: "date", direction: "asc" })
      .then(setLogs)
      .catch(console.error);
  }, [currentUser]);

  const chartData = logs.map((log) => ({
    date: log.date,
    value: log.value || 1,
  }));

  return (
    <div>
      <h1>Insights</h1>
      <Insights data={chartData} />
    </div>
  );
}