import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getCustomers,
  getAllInvestments,
  updateInvestment,
  deleteInvestment,
  getUserProfile,
  updateUserProfile,
} from "../services/firestoreService";
import CustomerGrid from "../components/CustomerGrid";
import InvestmentsGrid from "../components/InvestmentsGrid";
import emailjs from "@emailjs/browser";

export default function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [filter] = useState("");

  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    getCustomers(uid).then(setCustomers).catch(console.error);
    getAllInvestments(uid).then(setInvestments).catch(console.error);

    // Check for notifications
    checkNotifications(uid);

    // Set up periodic notification check (every 6 hours)
    const interval = setInterval(
      () => {
        checkNotifications(uid);
      },
      6 * 60 * 60 * 1000,
    ); // 6 hours

    return () => clearInterval(interval);
  }, [currentUser]);

  // Check for upcoming investment end dates and show notifications
  const checkNotifications = async (userId) => {
    try {
      const profile = await getUserProfile(userId);
      const browserDays = profile?.browserNotificationDays || 7;
      const emailDays = profile?.emailNotificationDays || 7;

      const investments = await getAllInvestments(userId);
      const customers = await getCustomers(userId);

      const now = new Date();

      // prepare lists separately
      const browserUpcoming = investments.filter((inv) => {
        if (!inv.endDate) return false;
        const endDate = new Date(inv.endDate);
        const future = new Date();
        future.setDate(now.getDate() + browserDays);
        return endDate >= now && endDate <= future;
      });
      const emailUpcoming = investments.filter((inv) => {
        if (!inv.endDate) return false;
        const endDate = new Date(inv.endDate);
        const future = new Date();
        future.setDate(now.getDate() + emailDays);
        return endDate >= now && endDate <= future;
      });

      const customerMap = {};
      customers.forEach((c) => (customerMap[c.id] = c.name));

      // Browser notifications
      if (
        profile?.enableBrowserNotifications &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        browserUpcoming.forEach((inv) => {
          const customerName = customerMap[inv.customerId] || "Unknown";
          const endDate = new Date(inv.endDate).toLocaleDateString();
          const daysLeft = Math.ceil(
            (new Date(inv.endDate) - now) / (1000 * 60 * 60 * 24),
          );
          new Notification("Investment Ending Soon", {
            body: `${customerName}'s ${inv.type || "investment"} ends on ${endDate} (${daysLeft} days left)`,
            icon: "/favicon.ico",
            tag: `investment-${inv.id}`,
          });
        });
      }

      // Email notifications
      if (
        profile?.enableEmailNotifications &&
        profile.emailjsServiceId &&
        profile.emailjsTemplateId &&
        profile.emailjsPublicKey &&
        emailUpcoming.length > 0
      ) {
        const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        if (profile.lastEmailSentDate !== currentDate) {
          try {
            emailjs.init(profile.emailjsPublicKey);
            const upcomingList = emailUpcoming
              .map((inv) => {
                const customerName = customerMap[inv.customerId] || "Unknown";
                const endDate = new Date(inv.endDate).toLocaleDateString();
                const daysLeft = Math.ceil(
                  (new Date(inv.endDate) - now) / (1000 * 60 * 60 * 24),
                );
                return `• ${customerName}'s ${inv.type || "investment"} - ${endDate} (${daysLeft} days)`;
              })
              .join("\n");
            const templateParams = {
              to_email: profile.email,
              to_name: profile.name || "User",
              subject: "Investment End Date Reminders",
              message: `You have ${emailUpcoming.length} investment(s) ending soon:\n\n${upcomingList}\n\nPlease review your investments.`,
            };
            await emailjs.send(
              profile.emailjsServiceId,
              profile.emailjsTemplateId,
              templateParams,
            );
            console.log("Email notification sent successfully");
            // Update last sent date
            await updateUserProfile(userId, { lastEmailSentDate: currentDate });
          } catch (emailError) {
            console.error("Error sending email notification:", emailError);
          }
        } else {
          console.log("Email already sent today, skipping.");
        }
      }
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
  };

  // filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(filter.toLowerCase()) ||
        c.pan?.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [customers, filter]);

  // calculate total portfolio (sum of all investments)
  const totalPortfolio = useMemo(() => {
    return investments.reduce((sum, inv) => sum + (inv.value || 0), 0);
  }, [investments]);

  // Handle update investment amount / remarks
  const handleUpdateInvestment = async (rowData, newAmount, newRemarks) => {
    try {
      const investmentsForRow = investments.filter(
        (inv) =>
          inv.customerId === rowData.customerId &&
          inv.type === rowData.investmentType,
      );

      if (investmentsForRow.length === 0) return;

      const updateObj = { value: newAmount };
      if (newRemarks !== undefined) updateObj.remarks = newRemarks;

      // If there's only one investment, update it directly
      if (investmentsForRow.length === 1) {
        await updateInvestment(
          currentUser.uid,
          investmentsForRow[0].id,
          updateObj,
        );
      } else {
        // If multiple investments, proportionally distribute the new amount
        const oldTotal = investmentsForRow.reduce(
          (sum, inv) => sum + (inv.value || 0),
          0,
        );
        const ratio = oldTotal > 0 ? newAmount / oldTotal : 0;

        for (const inv of investmentsForRow) {
          const entryUpdate = { value: inv.value * ratio };
          if (newRemarks !== undefined) entryUpdate.remarks = newRemarks;
          await updateInvestment(currentUser.uid, inv.id, entryUpdate);
        }
      }

      // Refresh investments
      const updatedInvestments = await getAllInvestments(currentUser.uid);
      setInvestments(updatedInvestments);
    } catch (error) {
      console.error("Error updating investment:", error);
      alert("Failed to update investment");
    }
  };

  // Handle delete investment(s)
  const handleDeleteInvestment = async (rowData) => {
    try {
      const investmentsForRow = investments.filter(
        (inv) =>
          inv.customerId === rowData.customerId &&
          inv.type === rowData.investmentType,
      );

      // Delete all investments for this customer-type combination
      for (const inv of investmentsForRow) {
        await deleteInvestment(currentUser.uid, inv.id);
      }

      // Refresh investments
      const updatedInvestments = await getAllInvestments(currentUser.uid);
      setInvestments(updatedInvestments);
    } catch (error) {
      console.error("Error deleting investment:", error);
      alert("Failed to delete investment");
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <h1>Agent Dashboard</h1>
        <div className="portfolio-value">
          Total Portfolio: ₹ {totalPortfolio.toLocaleString()}
        </div>
      </div>
      <div className="section">
        <h2>Customers</h2>
        <CustomerGrid
          customers={filteredCustomers}
          investments={investments}
          onUpdateInvestment={handleUpdateInvestment}
          onDeleteInvestment={handleDeleteInvestment}
        />
      </div>
      <div className="section">
        <InvestmentsGrid
          investments={investments}
          customers={customers}
          onUpdateInvestment={handleUpdateInvestment}
          onDeleteInvestment={handleDeleteInvestment}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}
