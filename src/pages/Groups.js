import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import SearchableSelect from "../components/SearchableSelect";
import {
  addGroup,
  deleteGroup,
  getAllInvestments,
  getCustomers,
  getGroups,
  updateGroup,
  updateInvestment,
  deleteInvestment,
} from "../services/firestoreService";
import InvestmentsGrid from "../components/InvestmentsGrid";

export default function Groups() {
  const { currentUser } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    Promise.all([getCustomers(uid), getAllInvestments(uid), getGroups(uid)])
      .then(([customerList, investmentList, groupList]) => {
        setCustomers(customerList);
        setInvestments(investmentList);
        setGroups(groupList);
      })
      .catch(console.error);
  }, [currentUser]);

  const refreshData = async () => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const [customerList, investmentList, groupList] = await Promise.all([
      getCustomers(uid),
      getAllInvestments(uid),
      getGroups(uid),
    ]);
    setCustomers(customerList);
    setInvestments(investmentList);
    setGroups(groupList);
  };

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) || null,
    [groups, selectedGroupId],
  );

  useEffect(() => {
    if (!selectedGroup) {
      setGroupName("");
      setSelectedCustomerIds([]);
      return;
    }
    setGroupName(selectedGroup.name || "");
    setSelectedCustomerIds(selectedGroup.customerIds || []);
  }, [selectedGroup]);

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setSaving(true);
    try {
      const payload = {
        name: groupName.trim(),
        customerIds: selectedCustomerIds,
      };

      if (selectedGroup) {
        await updateGroup(currentUser.uid, selectedGroup.id, payload);
      } else {
        const newId = await addGroup(currentUser.uid, payload);
        setSelectedGroupId(newId);
      }

      await refreshData();
      alert(`Group ${selectedGroup ? "updated" : "created"} successfully!`);
    } catch (error) {
      console.error("Error saving group:", error);
      alert("Failed to save group");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    if (!window.confirm(`Delete group "${selectedGroup.name}"?`)) return;

    try {
      await deleteGroup(currentUser.uid, selectedGroup.id);
      setSelectedGroupId("");
      setGroupName("");
      setSelectedCustomerIds([]);
      await refreshData();
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Failed to delete group");
    }
  };

  const handleUpdateInvestment = async (rowData, newAmount, newRemarks) => {
    try {
      const investmentsForRow = investments.filter(
        (inv) =>
          inv.customerId === rowData.customerId &&
          inv.type === rowData.investmentType &&
          inv.id === rowData.id,
      );

      if (investmentsForRow.length === 0) return;

      const updateObj = { value: newAmount };
      if (newRemarks !== undefined) updateObj.remarks = newRemarks;

      await updateInvestment(
        currentUser.uid,
        investmentsForRow[0].id,
        updateObj,
      );

      setInvestments(await getAllInvestments(currentUser.uid));
    } catch (error) {
      console.error("Error updating investment:", error);
      alert("Failed to update investment");
    }
  };

  const handleDeleteInvestment = async (rowData) => {
    try {
      const investmentsForRow = investments.filter(
        (inv) =>
          inv.customerId === rowData.customerId &&
          inv.type === rowData.investmentType,
      );

      for (const inv of investmentsForRow) {
        await deleteInvestment(currentUser.uid, inv.id);
      }

      setInvestments(await getAllInvestments(currentUser.uid));
    } catch (error) {
      console.error("Error deleting investment:", error);
      alert("Failed to delete investment");
    }
  };

  const selectedCustomers = customers.filter((customer) =>
    selectedCustomerIds.includes(customer.id),
  );

  return (
    <div>
      <div className="dashboard-header">
        <h1>Groups</h1>
        <div className="portfolio-value">
          {selectedGroup
            ? `${selectedCustomers.length} member(s) in "${selectedGroup.name}"`
            : "Create a group to view members and their investments"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px minmax(0, 1fr)",
          gap: "1.5rem",
          alignItems: "start",
          minWidth: 0,
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            padding: "1rem",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            background: "white",
            minWidth: 0,
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          <h2>Manage Group</h2>
          <form onSubmit={handleSaveGroup}>
            <div style={{ marginBottom: "0.75rem" }}>
              <SearchableSelect
                label="Existing Group"
                placeholder="Create new group"
                value={selectedGroupId}
                onChange={setSelectedGroupId}
                options={groups.map((group) => ({
                  label: group.name || "Untitled group",
                  value: group.id,
                }))}
                noOptionsText="No groups available"
              />
            </div>

            <label>Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Family, VIP Clients"
              style={{ width: "100%", marginBottom: "0.75rem" }}
              required
            />

            <label>Members</label>
            <div style={{ marginBottom: "0.75rem", marginTop: "0.25rem" }}>
              <SearchableSelect
                multiple
                placeholder="Search and select members"
                value={selectedCustomerIds}
                onChange={setSelectedCustomerIds}
                options={customers.map((customer) => ({
                  label: customer.name || "Unknown",
                  value: customer.id,
                }))}
                noOptionsText={
                  customers.length === 0
                    ? "No customers available"
                    : "No matches"
                }
                fullWidth
              />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="submit" disabled={saving}>
                {selectedGroup ? "Update Group" : "Create Group"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedGroupId("");
                  setGroupName("");
                  setSelectedCustomerIds([]);
                }}
              >
                Clear
              </button>
              {selectedGroup && (
                <button type="button" onClick={handleDeleteGroup}>
                  Delete
                </button>
              )}
            </div>
          </form>
        </div>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              padding: "1rem",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              background: "white",
              minWidth: 0,
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            <h2>Group Members</h2>
            {selectedGroup ? (
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {selectedCustomers.map((customer) => (
                  <li key={customer.id}>{customer.name}</li>
                ))}
                {selectedCustomers.length === 0 && (
                  <li>No members selected.</li>
                )}
              </ul>
            ) : (
              <p style={{ margin: 0 }}>
                Pick an existing group or create a new one to see the member
                list.
              </p>
            )}
          </div>

          <InvestmentsGrid
            title={
              selectedGroup
                ? `${selectedGroup.name} Investments`
                : "Group Investments"
            }
            investments={investments}
            customers={customers}
            customerIdsFilter={selectedGroup ? selectedCustomerIds : null}
            showCustomerFilter={false}
            groupByType={false}
            onUpdateInvestment={handleUpdateInvestment}
            onDeleteInvestment={handleDeleteInvestment}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
}
