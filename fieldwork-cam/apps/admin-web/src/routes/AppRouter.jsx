import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext";
import ProtectedRoute from "../auth/ProtectedRoute";
import RoleRedirect from "../auth/RoleRedirect";

import LoginPage from "../pages/auth/LoginPage";
import AdminLayout from "../layouts/AdminLayout";
import VendorLayout from "../layouts/VendorLayout";
import AdminDashboardPage from "../pages/admin/DashboardPage";
import VendorDashboardPage from "../pages/vendor/VendorDashboardPage";
import ProjectPage from "../pages/admin/ProjectPage";
import CreateProjectPage from "../pages/admin/CreateProjectPage";
import VendorPage from "../pages/admin/VendorPage";
import VendorDetailsPage from "../pages/admin/VendorDetailsPage";
import InvoicesPages from "../pages/admin/InvoicesPage";
import SupportPage from "../pages/admin/SupportPage";
import AnalyticsPage from "../pages/admin/AnalyticsPage";
import ServicesPage from "../pages/admin/ServicesPage";
import ProfilePage from "../pages/admin/ProfilePage";
import EditProfileDialog from "../pages/admin/EditProfileDialog";
import AddVendorPage from "../pages/admin/AddVendorPage";
import AddInvoicePage from "../pages/admin/AddInvoicePage";
import SubmissionReviewPage from "../pages/admin/SubmissionReviewPage";
import AcceptInvitePage from "../pages/auth/AcceptInvitePage";
import VendorProjectsPage from "../pages/vendor/VendorProjectsPage";
import VendorProjectDetailsScreen from "../pages/vendor/VendorProjectDetailsPage";
import StaffPage from "../pages/vendor/StaffPage";
import VendorProfilePage from "../pages/vendor/VendorProfilePage";

function PlaceholderPage({ title }) {
  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">This module will be implemented next.</p>
    </div>
  );
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="/" element={<RoleRedirect />} />

          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="projects" element={<ProjectPage />} />
              <Route path="projects/new" element={<CreateProjectPage />} />
              <Route path="vendors" element={<VendorPage />} />
              <Route path="vendors/:vendorId" element={<VendorDetailsPage />} />
              <Route path="invoices" element={<InvoicesPages />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="profile/edit" element={<EditProfileDialog />} />
              <Route path="vendors/new" element={<AddVendorPage />} />
              <Route path="invoices/new" element={<AddInvoicePage />} />
              <Route
                path="submissions/:submissionId"
                element={<SubmissionReviewPage />}
              />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["VENDOR_OWNER"]} />}>
            <Route path="/vendor" element={<VendorLayout />}>
              <Route path="dashboard" element={<VendorDashboardPage />} />
              <Route path="projects" element={<VendorProjectsPage />} />
              <Route
                path="projects/:projectId"
                element={<VendorProjectDetailsScreen />}
              />
              <Route path="staff" element={<StaffPage />} />
              <Route
                path="invoices"
                element={<PlaceholderPage title="Invoices" />}
              />
              <Route
                path="earnings"
                element={<PlaceholderPage title="Earnings" />}
              />
              <Route path="staff" element={<PlaceholderPage title="Staff" />} />
              <Route
                path="performance"
                element={<PlaceholderPage title="Performance" />}
              />
              <Route
                path="support"
                element={<PlaceholderPage title="Support" />}
              />
              <Route path="profile" element={<VendorProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
