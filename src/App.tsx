import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Login from "./pages/Login";
import Register from "./pages/Register";
import PortalLogin from "./pages/PortalLogin";
import NotFound from "./pages/NotFound";

import PartnerLayout from "./layouts/PartnerLayout";
import PartnerDashboard from "./pages/partner/Dashboard";
import PartnerSchedule from "./pages/partner/Schedule";
import PartnerProfile from "./pages/partner/Profile";
import PartnerContract from "./pages/partner/Contract";
import PartnerWorkHistory from "./pages/partner/WorkHistory";
import PartnerPayslips from "./pages/partner/Payslips";
import PartnerDocuments from "./pages/partner/Documents";
import PartnerNotifications from "./pages/partner/Notifications";
import PartnerSupport from "./pages/partner/Support";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/portal/Dashboard";
import AdminPartners from "./pages/portal/Partners";
import AdminVerification from "./pages/portal/Verification";
import AdminScheduling from "./pages/portal/Scheduling";
import AdminCustomers from "./pages/portal/Customers";
import AdminDeliveryData from "./pages/portal/DeliveryData";
import AdminPayroll from "./pages/portal/Payroll";
import AdminInvoices from "./pages/portal/Invoices";
import AdminPayslips from "./pages/portal/AdminPayslips";
import AdminReports from "./pages/portal/Reports";
import AdminSettings from "./pages/portal/Settings";
import AdminAuditLog from "./pages/portal/AuditLog";
import AdminUsers from "./pages/portal/Users";
import AdminMessages from "./pages/portal/Messages";
import AdminCompliance from "./pages/portal/Compliance";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/portal/login" element={<PortalLogin />} />

          <Route path="/partner" element={<PartnerLayout />}>
            <Route path="dashboard" element={<PartnerDashboard />} />
            <Route path="schedule" element={<PartnerSchedule />} />
            <Route path="profile" element={<PartnerProfile />} />
            <Route path="contract" element={<PartnerContract />} />
            <Route path="work-history" element={<PartnerWorkHistory />} />
            <Route path="payslips" element={<PartnerPayslips />} />
            <Route path="documents" element={<PartnerDocuments />} />
            <Route path="notifications" element={<PartnerNotifications />} />
            <Route path="support" element={<PartnerSupport />} />
          </Route>

          <Route path="/portal" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="partners" element={<AdminPartners />} />
            <Route path="verification" element={<AdminVerification />} />
            <Route path="scheduling" element={<AdminScheduling />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="delivery-data" element={<AdminDeliveryData />} />
            <Route path="payroll" element={<AdminPayroll />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="payslips" element={<AdminPayslips />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="audit-log" element={<AdminAuditLog />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="compliance" element={<AdminCompliance />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
