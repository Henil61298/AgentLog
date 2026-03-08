import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  addCustomer,
  getCustomers,
  updateCustomer,
} from "../services/firestoreService";

export default function AddCustomer() {
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    mobile: "",
    email: "",
    dob: "",
  });
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const { currentUser } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const customerData = {
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        name: `${form.firstName} ${form.middleName} ${form.lastName}`.trim(),
        mobile: form.mobile,
        email: form.email,
        dob: form.dob,
        portfolioValue: editingCustomer ? editingCustomer.portfolioValue : 0,
      };

      if (editMode && editingCustomer) {
        await updateCustomer(currentUser.uid, editingCustomer.id, customerData);
        alert("Customer updated successfully!");
        setEditMode(false);
        setEditingCustomer(null);
      } else {
        await addCustomer(currentUser.uid, customerData);
        alert("Customer added successfully!");
      }

      setForm({
        firstName: "",
        middleName: "",
        lastName: "",
        mobile: "",
        email: "",
        dob: "",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save customer");
    }
    setLoading(false);
  };

  const checkAndHandleExisting = async () => {
    const customers = await getCustomers(currentUser.uid);
    const existing = customers.find((c) => c.email === form.email);
    if (existing) {
      const edit = window.confirm(
        "Customer already exists. Do you want to edit it?",
      );
      if (edit) {
        setEditMode(true);
        setEditingCustomer(existing);
        setForm({
          firstName: existing.firstName || "",
          middleName: existing.middleName || "",
          lastName: existing.lastName || "",
          mobile: existing.mobile || "",
          email: existing.email || "",
          dob: existing.dob || "",
        });
      }
      return true;
    }
    return false;
  };

  const handleSubmitWithCheck = async (e) => {
    e.preventDefault();
    if (!editMode) {
      const exists = await checkAndHandleExisting();
      if (exists) return;
    }
    await handleSubmit(e);
  };

  return (
    <div>
      <h1>{editMode ? "Edit Customer" : "Add Customer"}</h1>
      <form onSubmit={handleSubmitWithCheck} className="auth-container">
        <label>First Name</label>
        <input
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          required
        />
        <label>Middle Name</label>
        <input
          name="middleName"
          value={form.middleName}
          onChange={handleChange}
        />
        <label>Last Name</label>
        <input
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          required
        />
        <label>Mobile Number</label>
        <input
          name="mobile"
          type="tel"
          value={form.mobile}
          onChange={handleChange}
          required
        />
        <label>Email</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          disabled={editMode}
        />
        <label>Date of Birth</label>
        <input
          name="dob"
          type="date"
          value={form.dob}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {editMode ? "Update Customer" : "Add Customer"}
        </button>
        {editMode && (
          <button
            type="button"
            onClick={() => {
              setEditMode(false);
              setEditingCustomer(null);
              setForm({
                firstName: "",
                middleName: "",
                lastName: "",
                mobile: "",
                email: "",
                dob: "",
              });
            }}
          >
            Cancel Edit
          </button>
        )}
      </form>
    </div>
  );
}
