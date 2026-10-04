import { createBrowserRouter, Navigate } from "react-router";

import App from "../App";

import { OrganizationProvider } from "../features/organizations/OrganizationProvider";

import ProtectedRoute from "../routes/ProtectedRoute";
import PublicOnlyRoute from "../routes/PublicOnlyRoute";

import AppLayout from "../layouts/AppLayout";

import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";

import DashboardPage from "../features/dashboard/pages/DashboardPage";
//import ProfilePage from "../features/profile/pages/ProfilePage";
import MaintenancePage from "../features/maintenance/pages/MaintenancePage";
import ReportsPage from "../features/reports/pages/ReportsPage";
import ExpensesPage from "../features/expenses/pages/ExpensesPage";
import PaymentsPage from "../features/payments/pages/PaymentsPage";
import LeaseDetailsPage from "../features/leases/pages/LeaseDetailsPage";
import LeasesPage from "../features/leases/pages/LeasesPage";
import TenantDetailsPage from "../features/tenants/pages/TenantDetailsPage";
import TenantsPage from "../features/tenants/pages/TenantsPage"
import PropertiesPage from "../features/properties/pages/PropertiesPage";
import PropertyDetailsPage from "../features/properties/pages/PropertyDetailsPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                index: true,
                element: <Navigate to={"auth/login"} replace />
            },
            {
                element: <PublicOnlyRoute />,
                children: [
                    {
                        path: "auth/login",
                        element: <LoginPage />,
                    },
                    {
                        path: "auth/register",
                        element: <RegisterPage />,
                    },
                ],
            },

            {
                element: <ProtectedRoute />,
                children: [
                    {
                        element: <OrganizationProvider />,
                        children: [
                            {
                                path: "app",
                                element: <AppLayout />,
                                children: [
                                    {
                                        index: true,
                                        element: (<Navigate to="dashboard" replace/>),
                                    },
                                    {
                                        path: "dashboard",
                                        element: <DashboardPage />,
                                    },
                                    {
                                        path: "properties",
                                        element: <PropertiesPage />,
                                    },
                                    {
                                        path: "properties/:propertyId",
                                        element: (<PropertyDetailsPage />),
                                    },
                                    {
                                        path: "tenants",
                                        element: <TenantsPage />,
                                    },
                                    {
                                        path: "tenants/:tenantId",
                                        element: (<TenantDetailsPage />),
                                    },
                                    {
                                        path: "leases",
                                        element: <LeasesPage />,
                                    },
                                    {
                                        path: "leases/:leaseId",
                                        element: (<LeaseDetailsPage />),
                                    },
                                    {
                                        path: "payments",
                                        element: <PaymentsPage />,
                                    },
                                    {
                                        path: "expenses",
                                        element: <ExpensesPage />,
                                    },
                                    {
                                        path: "maintenance",
                                        element: <MaintenancePage />,
                                    },
                                    {
                                        path: "reports",
                                        element: <ReportsPage />,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },

            {
                path: "*",
                element: <h1>404 - Page Not Found</h1>,
            },
        ],
    },
]);