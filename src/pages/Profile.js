import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
  createUserProfile,
  getAllInvestments,
} from "../services/firestoreService";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
} from "@mui/material";
import emailjs from "@emailjs/browser";

export default function Profile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
    browserNotificationDays: 7,
    emailNotificationDays: 7,
    enableBrowserNotifications: false,
    enableEmailNotifications: false,
    emailjsServiceId: "",
    emailjsTemplateId: "",
    emailjsPublicKey: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    loadProfile();
  }, [currentUser]);

  const loadProfile = async () => {
    try {
      const data = await getUserProfile(currentUser.uid);
      if (data) {
        setProfile({
          name: data.name || "",
          email: data.email || currentUser.email || "",
          phone: data.phone || "",
          address: data.address || "",
          company: data.company || "",
          // migrate old single value if present
          browserNotificationDays:
            data.browserNotificationDays || data.notificationDays || 7,
          emailNotificationDays:
            data.emailNotificationDays || data.notificationDays || 7,
          enableBrowserNotifications: data.enableBrowserNotifications || false,
          enableEmailNotifications: data.enableEmailNotifications || false,
          emailjsServiceId: data.emailjsServiceId || "",
          emailjsTemplateId: data.emailjsTemplateId || "",
          emailjsPublicKey: data.emailjsPublicKey || "",
        });
      } else {
        // Initialize with current user email
        setProfile((prev) => ({
          ...prev,
          email: currentUser.email || "",
        }));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const existingProfile = await getUserProfile(currentUser.uid);
      if (existingProfile) {
        await updateUserProfile(currentUser.uid, profile);
      } else {
        await createUserProfile(currentUser.uid, profile);
      }
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage("Error saving profile");
    }
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const requestNotificationPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          setMessage("Browser notifications enabled!");
          setTimeout(() => setMessage(""), 3000);
        } else if (permission === "denied") {
          setMessage(
            "Browser notifications denied. Please enable in browser settings.",
          );
          setTimeout(() => setMessage(""), 3000);
        }
      });
    } else {
      setMessage("Browser notifications are not supported in this browser.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const testBrowserNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Test Notification", {
        body: "This is a test browser notification.",
        icon: "/favicon.ico",
      });
    } else {
      setMessage("Please enable browser notifications first");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const testEmailNotification = async () => {
    if (
      !profile.emailjsServiceId ||
      !profile.emailjsTemplateId ||
      !profile.emailjsPublicKey
    ) {
      setMessage("Please configure EmailJS settings first");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    try {
      emailjs.init(profile.emailjsPublicKey);

      const templateParams = {
        to_email: profile.email,
        to_name: profile.name || "User",
        subject: "Test Email Notification",
        message: "This is a test email notification for investment reminders.",
      };

      await emailjs.send(
        profile.emailjsServiceId,
        profile.emailjsTemplateId,
        templateParams,
      );

      setMessage("Test email sent successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error sending test email:", error);
      setMessage("Error sending test email");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Request permission automatically once browser notifications enabled
  useEffect(() => {
    if (profile.enableBrowserNotifications && "Notification" in window) {
      if (Notification.permission === "default") {
        requestNotificationPermission();
      }
    }
  }, [profile.enableBrowserNotifications]);

  // Check for notifications when component mounts or profile changes
  useEffect(() => {
    if (!currentUser) return;

    const checkNotifications = async () => {
      try {
        const profile = await getUserProfile(currentUser.uid);
        const notificationDays = profile?.notificationDays || 7;

        const investments = await getAllInvestments(currentUser.uid);

        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + notificationDays);

        const upcomingInvestments = investments.filter((inv) => {
          if (!inv.endDate) return false;
          const endDate = new Date(inv.endDate);
          return endDate >= now && endDate <= futureDate;
        });

        if (
          upcomingInvestments.length > 0 &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification("Investment Reminders Active", {
            body: `You have ${upcomingInvestments.length} investment(s) ending soon. Notifications are enabled.`,
            icon: "/favicon.ico",
          });
        }
      } catch (error) {
        console.error("Error checking notifications:", error);
      }
    };

    checkNotifications();
  }, [currentUser]);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>

      {message && (
        <Typography
          variant="body1"
          style={{
            color: message.includes("Error") ? "red" : "green",
            marginBottom: "1rem",
          }}
        >
          {message}
        </Typography>
      )}

      <Paper elevation={3} style={{ padding: "2rem", marginBottom: "2rem" }}>
        <Typography variant="h6" gutterBottom>
          Personal Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              value={profile.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              value={profile.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              value={profile.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Company"
              value={profile.company}
              onChange={(e) => handleInputChange("company", e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              value={profile.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} style={{ padding: "2rem", marginBottom: "2rem" }}>
        <Typography variant="h6" gutterBottom>
          Notification Settings
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Configure how you want to receive investment reminders.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Browser notification days before end"
              value={profile.browserNotificationDays}
              onChange={(e) =>
                handleInputChange(
                  "browserNotificationDays",
                  parseInt(e.target.value) || 7,
                )
              }
              inputProps={{ min: 1, max: 365 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Email notification days before end"
              value={profile.emailNotificationDays}
              onChange={(e) =>
                handleInputChange(
                  "emailNotificationDays",
                  parseInt(e.target.value) || 7,
                )
              }
              inputProps={{ min: 1, max: 365 }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Notification Types
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={profile.enableBrowserNotifications}
                  onChange={(e) =>
                    handleInputChange(
                      "enableBrowserNotifications",
                      e.target.checked,
                    )
                  }
                />
              }
              label="Browser Notifications (Free)"
            />
            <br />
            <FormControlLabel
              control={
                <Switch
                  checked={profile.enableEmailNotifications}
                  onChange={(e) =>
                    handleInputChange(
                      "enableEmailNotifications",
                      e.target.checked,
                    )
                  }
                />
              }
              label="Email Notifications (Free with EmailJS)"
            />
          </Grid>

          {profile.enableBrowserNotifications && (
            <>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={requestNotificationPermission}
                  fullWidth
                >
                  Enable Browser Notifications
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">
                  Permission status:{" "}
                  {"Notification" in window
                    ? Notification.permission
                    : "unsupported"}
                </Typography>
              </Grid>
            </>
          )}

          {profile.enableEmailNotifications && (
            <>
              <Grid item xs={12}>
                <Alert severity="info" style={{ marginBottom: "1rem" }}>
                  <Typography variant="subtitle2" gutterBottom>
                    How to set up EmailJS (Free):
                  </Typography>
                  <Typography variant="body2">
                    1. Go to{" "}
                    <a
                      href="https://www.emailjs.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      emailjs.com
                    </a>{" "}
                    and create a free account
                    <br />
                    2. Add your email service (Gmail, Outlook, etc.)
                    <br />
                    3. Create an email template with variables: to_email,
                    to_name, subject, message
                    <br />
                    4. Copy the Service ID, Template ID, and Public Key here
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  EmailJS Configuration
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Service ID"
                  value={profile.emailjsServiceId}
                  onChange={(e) =>
                    handleInputChange("emailjsServiceId", e.target.value)
                  }
                  placeholder="service_xxxxxx"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Template ID"
                  value={profile.emailjsTemplateId}
                  onChange={(e) =>
                    handleInputChange("emailjsTemplateId", e.target.value)
                  }
                  placeholder="template_xxxxxx"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Public Key"
                  value={profile.emailjsPublicKey}
                  onChange={(e) =>
                    handleInputChange("emailjsPublicKey", e.target.value)
                  }
                  placeholder="xxxxxxxxxxxxxx"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={testEmailNotification}
                  fullWidth
                >
                  Test Email Notification
                </Button>
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Button
              variant="outlined"
              onClick={testBrowserNotification}
              fullWidth
            >
              Test Browser Notification
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box display="flex" justifyContent="center">
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={loading}
          size="large"
        >
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </Box>
    </div>
  );
}
