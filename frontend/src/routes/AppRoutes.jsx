import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute'

const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'))
const Tickets = lazy(() => import('../pages/Tickets/Tickets'))
const TicketDetails = lazy(() => import('../pages/TicketDetails/TicketDetails'))
const Users = lazy(() => import('../pages/Users/Users'))
const Chat = lazy(() => import('../pages/Chat/Chat'))
const Reports = lazy(() => import('../pages/Reports/Reports'))
const Settings = lazy(() => import('../pages/Settings/Settings'))
const Login = lazy(() => import('../pages/Login/Login'))
const Register = lazy(() => import('../pages/Register/Register'))
const ForgotPassword = lazy(() => import('../pages/ForgotPassword/ForgotPassword'))
const AuthCallback = lazy(() => import('../pages/AuthCallback/AuthCallback'))

function LoadingFallback() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#9ca3af",
        fontSize: 13,
      }}
    >
      Carregando...
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
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
            <Route path="/chat" element={<Chat />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}