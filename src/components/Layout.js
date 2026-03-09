import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InsightsIcon from "@mui/icons-material/Insights";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

export default function Layout({ children }) {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  return (
    <>
      <header className="navbar">
        <Link to="/">AgentLog</Link>
        {currentUser && (
          <div
            style={{
              display: "flex",
              marginRight: "1rem",
              alignItems: "center",
            }}
          >
            <Link
              to="/profile"
              className={location.pathname === "/profile" ? "active" : ""}
              title="Profile"
              style={{ display: "flex", alignItems: "center" }}
            >
              <AccountCircleIcon />
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
              title="Logout"
            >
              <ExitToAppIcon />
            </button>
          </div>
        )}
      </header>

      {currentUser && (
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <Link
              to="/"
              className={`sidebar-link ${location.pathname === "/" ? "active" : ""}`}
              title="Dashboard"
            >
              <DashboardIcon />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/insights"
              className={`sidebar-link ${location.pathname === "/insights" ? "active" : ""}`}
              title="Insights"
            >
              <InsightsIcon />
              <span>Insights</span>
            </Link>
            <Link
              to="/investments"
              className={`sidebar-link ${location.pathname === "/investments" ? "active" : ""}`}
              title="Investments"
            >
              <TrendingUpIcon />
              <span>Investments</span>
            </Link>
            <Link
              to="/add-customer"
              className={`sidebar-link ${location.pathname === "/add-customer" ? "active" : ""}`}
              title="Add Customer"
            >
              <PersonAddIcon />
              <span>Add Customer</span>
            </Link>
          </nav>
        </aside>
      )}

      <main className="main-content">{children}</main>
    </>
  );
}
