import { Routes, Route, Navigate } from 'react-router-dom'

// Rotas publicas
import LandingPage from './features/public/pages/LandingPage'
import About from './features/public/pages/About'
import Terms from './features/public/pages/Terms'
import Privacy from './features/public/pages/Privacy'

// Rotas de autenticação
import Login from './features/auth/pages/Login'
import Register from './features/auth/pages/Register'
import ForgotPassword from './features/auth/pages/ForgotPassword'
import NewPassword from './features/auth/pages/NewPassword'

// Rotas do usuário logado
import HomeLayout from "./components/layout/HomeLayout"
import Home from './features/usuario/pages/Home'
import Map from './features/usuario/pages/Map'
import ReportBarrel from './features/usuario/pages/ReportBarrel'
import Observations from './features/usuario/pages/Observations'
import ConfirmRequest from './features/usuario/pages/ConfirmRequest'
import MyRequests from './features/usuario/pages/MyRequests'
import RequestDetail from './features/usuario/pages/MyRequests/RequestDetail'
import Points from './features/usuario/pages/Points'
import RegisterPoint from './features/usuario/pages/RegisterPoint'
import Profile from './features/usuario/pages/Profile'
import PointDetail from './features/usuario/pages/Points/PointDetail'

import { AdminProtectedRoute } from './components/AdminProtectedRoute'
import AdminLayout from './components/layout/AdminLayout'
import AdminLogin from './features/admin/pages/AdminLogin'
import Dashboard from './features/admin/pages/Dashboard'
import Requests from './features/admin/pages/Requests'
import AdminMap from './features/admin/pages/Map'
import AdminPoints from './features/admin/pages/Points'
import PartnersApproval from './features/admin/pages/PartnersApproval'
import ProfileAdmin from './features/admin/pages/ProfileAdmin'
// Caminho corrigido (pasta IndicatorsApproval -> arquivo IndicatorsApproval)
import IndicatorsApproval from './features/admin/pages/IndicatorsApproval' 

function App() {
  return (
    <Routes>
      {/* Rotas publicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/sobre" element={<About />} />
      <Route path="/termos" element={<Terms />} />
      <Route path="/privacidade" element={<Privacy />} />

      {/* Rotas de autenticação */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/redefinir-senha" element={<NewPassword />} />
      <Route path="/register" element={<Register />} />

      {/* Rotas do usuário logado */}
      <Route element={<HomeLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/map" element={<Map />} />
        <Route path="/my-requests" element={<MyRequests />} />
        <Route path="/my-requests/:id" element={<RequestDetail />} />
        <Route path="/my-points" element={<Points />} />
        <Route path="/my-points/:id" element={<PointDetail />} />
        <Route path="/report-barrel" element={<ReportBarrel />} />
        <Route path="/observations" element={<Observations />} />
        <Route path="/confirm-request" element={<ConfirmRequest />} />
        <Route path="/register-point" element={<RegisterPoint />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Rotas do administrador */}
      {/* Adicionado Navigate para redirecionar "/admin" para "/admin/dashboard" */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      
      <Route path="/admin/dashboard" element={<AdminProtectedRoute><Dashboard /></AdminProtectedRoute>} />
      <Route path="/admin/requests" element={<AdminProtectedRoute><Requests /></AdminProtectedRoute>} />
      <Route path="/admin/map" element={<AdminProtectedRoute><AdminMap /></AdminProtectedRoute>} />
      <Route path="/admin/my-points" element={<AdminProtectedRoute><AdminPoints /></AdminProtectedRoute>} />
      <Route path="/admin/profile-admin" element={<AdminProtectedRoute><ProfileAdmin /></AdminProtectedRoute>} />
      <Route path="/admin/partners-approval" element={<AdminProtectedRoute><PartnersApproval /></AdminProtectedRoute>} />
      <Route path="/admin/indicators" element={<AdminProtectedRoute><IndicatorsApproval /></AdminProtectedRoute>} />
    </Routes>
  )
}

export default App