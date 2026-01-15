import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import Login from "./pages/Login.jsx";
import Page from "./pages/page.jsx"
import Admin from "./pages/Admin.jsx"
import Register from "./pages/Register.jsx";
import VendorRegister from "./pages/VendorRegister.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import Bazaar from "./pages/Bazaar.jsx";
import TripManagement from "./pages/TripManagement.jsx";
import WorkshopsList from './pages/WorkshopsList.jsx';
import WorkshopForm from './pages/WorkshopForm.jsx';
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext.jsx";
import axios from "axios";
import BazaarEdit from "./pages/BazaarEdit.jsx";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = "http://localhost:4000/api";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Define routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <Page />,   // default page
  },{
    path:"/admin",
    element: <Admin/>
  },
   {
    path: "/page",
    element: <Page />,   // default page
  },
  {
    path: "/register",
    element: <Register />,
  },
  
  {
    path: "/login",
    element: <Login />,   // Add this route
  },
  {
    path: "/vendor-register",
    element: <VendorRegister />,
  },
  {
    path: "/verify-email",
    element: <VerifyEmail />,
  },
  {
    path: "/bazaars",
    element: <Bazaar />,
  },
  {
    path: "/trips",
    element: <TripManagement />,
  },{
    path: "/bazaars/edit/:id",
    element: <BazaarEdit />
  },
  {
    path: "/app",
    element: <App />,
  },
  {
    path: "/workshops",
    element: <WorkshopsList />,
  },
  {
    path: "/workshops/new", 
    element: <WorkshopForm />,
  },
  {
    path: "/workshops/:id/edit",
    element: <WorkshopForm />,
  }
]);
