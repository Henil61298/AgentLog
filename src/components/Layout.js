import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";

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
          <nav style={{ display: "flex", gap: "1rem" }}>
            <Link to="/" className={location.pathname === "/" ? "active" : ""}>
              Dashboard
            </Link>
            <Link
              to="/insights"
              className={location.pathname === "/insights" ? "active" : ""}
            >
              Insights
            </Link>
            <Link
              to="/investments"
              className={location.pathname === "/investments" ? "active" : ""}
            >
              Investments
            </Link>
            <Link
              to="/add-customer"
              className={location.pathname === "/add-customer" ? "active" : ""}
            >
              Add Customer
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </nav>
        )}
      </header>
      <main className="container">{children}</main>
    </>
  );
}
