import { createBrowserRouter } from "react-router";

import App from "../App";

import PublicOnlyRoute from "../routes/PublicOnlyRoute";
import ProtectedRoute from "../routes/ProtectedRoute";

import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";

import DashboardPage from "../features/dashboard/pages/DashboardPage";
import ProfilePage from "../features/profile/pages/ProfilePage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                element: <PublicOnlyRoute />,
                children: [
                    {
                        path: "auth/login", element: <LoginPage />,
                    },
                    {
                        path: "auth/register", element: <RegisterPage />,
                    },
                ],
            },
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        path: "app/dashboard", element: <DashboardPage />,
                    },
                    {
                        path: "app/profile", element: <ProfilePage />,
                    },
                ],
            },

            {
                path: "*", element: <div>404 - Page Not Found</div>,
            },
        ],
    },
]);