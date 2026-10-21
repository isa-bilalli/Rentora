import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router/dom";

import { router } from "./app/router";
import { ConfirmProvider } from "./components/confirm/ConfirmProvider";
import { AuthProvider } from "./features/auth/AuthProvider";

import "./index.css";

ReactDOM.createRoot(
    document.getElementById("root")!
).render(
    <React.StrictMode>
        <AuthProvider>
          <ConfirmProvider>
            <RouterProvider router={router} />
          </ConfirmProvider>
        </AuthProvider>
    </React.StrictMode>
);