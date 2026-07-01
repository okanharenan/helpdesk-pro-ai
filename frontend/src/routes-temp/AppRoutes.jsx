import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from '../pages/Dashboard/Dashboard'
import Tickets from '../pages/Tickets/Tickets'
import TicketDetails from '../pages/TicketDetails/TicketDetails'
import Users from '../pages/Users/Users'
import Reports from '../pages/Reports/Reports'
import Login from '../pages/Login/login'
import Register from '../pages/Register/Register'
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword'
import AuthCallback from '../pages/AuthCallback/AuthCallback'
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/tickets/:id" element={<TicketDetails />} />
          <Route path="/users" element={<Users />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}