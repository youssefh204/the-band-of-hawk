import { Routes, Route } from "react-router-dom";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import VendorRegister from "./pages/VendorRegister.jsx";
import TripManagement from "./pages/TripManagement.jsx";
import WorkshopsList from "./pages/WorkshopsList.jsx";
import WorkshopForm from "./pages/WorkshopForm.jsx";
import Bazaar from "./pages/Bazaar.jsx";
import BazaarEdit from "./pages/BazaarEdit.jsx";
import VendorRoute from "./components/VendorRoute.jsx";
import Page from "./pages/page.jsx";
import VendorDashboard from "./pages/VendorDash.jsx";
import Admindash from "./pages/Admin.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";
import Home from "./pages/Home.jsx";
import CourtsPage from "./pages/CourtsPage.jsx";
import TripEdit from "./pages/TripEdit.jsx";
import ConferencesList from "./pages/ConferencesList.jsx";
import ConferenceForm from './pages/ConferenceForm.jsx';
import Gym from "./pages/Gym.jsx";
import Favorites from "./pages/Favorites.jsx";
import SalesReport from "./pages/SalesReport.jsx";
import ScanTicket from "./pages/ScanTicket";
import ProfessorDashboard from './pages/ProfessorDashboard';
import Document from './pages/Document.jsx';
import PollsPage from "./pages/PollsPage.jsx";
import ClubPage from "./pages/ClubPage.jsx"
import ClubDetails from "./pages/ClubDetailsPage.jsx";
import ClubEventDetails from "./pages/ClubEventDetails.jsx";
import ClubEventsPage from "./pages/ClubEventsPage.jsx";

// The user get redirected as an admin not a user line 45

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Page />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route path="/bazaars/edit/:id" element={<BazaarEdit />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/vendor-register" element={<VendorRegister />} />
      <Route path="/bazaars" element={<Bazaar />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/page" element={<Page />} />
      <Route path="/home" element={<Home />} />
      <Route path="/clubs" element={<ClubPage />} />
      <Route path="/club-events" element={<ClubEventsPage />} />
<Route path="/club-events/:id" element={<ClubEventDetails />} />

      <Route path="/clubs/:clubId" element={<ClubDetails />} />

      <Route path="/documents" element={<Document />} />

      <Route path="/gym" element={<Gym />} />
      <Route path="/scan/:eventType/:eventId/:ticketId" element={<ScanTicket />} />


      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole={["Admin","EventOffice"]}>
            <Admindash />
          </ProtectedRoute>
        }
      />
        <Route 
          path="/vendor-dashboard" 
          element={
            <VendorRoute>
              <VendorDashboard />
            </VendorRoute>
          } 
        />
      <Route
        path="/workshops"
        element={
          <ProtectedRoute requiredRole={["Admin","EventOffice","professor"]}>
            <WorkshopsList />
          </ProtectedRoute>
        }
      />
      {/* 👇 ADD THIS NEW ROUTE 👇 */}
      <Route
        path="/professor/dashboard"
        element={
          <ProtectedRoute requiredRole="professor">
            <ProfessorDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/polls" element={<PollsPage />} />

      <Route
        path="/favorites"
        element={
          <ProtectedRoute requiredRole={["student","staff","ta","professor"]}>
            <Favorites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workshops/new"
        element={
          <ProtectedRoute requiredRole={["Admin","EventOffice","professor"]}>
            <WorkshopForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conferences"
        element={
          <ProtectedRoute requiredRole="EventOffice">
            <ConferencesList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/conferences/new"
        element={
          <ProtectedRoute requiredRole="EventOffice">
            <ConferenceForm />
          </ProtectedRoute>
        }
        />
      <Route
          path="/conferences/:id/edit"
          element={
            <ProtectedRoute requiredRole="EventOffice">
              <ConferenceForm />
            </ProtectedRoute>
        }
        />

      
      <Route
        path="/trips"
        element={
          <ProtectedRoute requiredRole="Admin">
            <TripManagement />
          </ProtectedRoute>
        }
      />
            <Route
        path="/trips/edit/:id"
        element={
          <ProtectedRoute requiredRole="Admin">
            <TripEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courts"
        element={
          <ProtectedRoute requiredRole="student">
            <CourtsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sales-report"
        element={
          <ProtectedRoute requiredRole={["Admin", "EventOffice"]}>
            <SalesReport />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}