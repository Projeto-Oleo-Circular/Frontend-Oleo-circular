
import { Routes, Route } from 'react-router-dom'

//Rotas publicas
import LandingPage from './features/public/pages/LandingPage'
import About from './features/public/pages/About'
import Terms from './features/public/pages/Terms'
import Privacy from './features/public/pages/Privacy'

//Rotas de autenticação
import Login from './features/auth/pages/Login'
import Register from './features/auth/pages/Register'
import ForgotPassword from './features/auth/pages/ForgotPassword'
import NewPassword from './features/auth/pages/NewPassword'

//Rotas do usuário logado
import HomeLayout from "./components/layout/HomeLayout"
import Home from './features/usuario/pages/Home'
import Map from './features/usuario/pages/Map'
import ReportBarrel from './features/usuario/pages/ReportBarrel'
import Observations from './features/usuario/pages/Observations'
import ConfirmRequest from './features/usuario/pages/ConfirmRequest'
import MyRequests from './features/usuario/pages/MyRequests'
import MyPoints from './features/usuario/pages/MyPoints'
import RegisterPoint from './features/usuario/pages/RegisterPoint'
import Profile from './features/usuario/pages/Profile'
import InformarNivelBombona from './features/usuario/pages/InformarNivelBombona'

import { AdminProtectedRoute } from './components/AdminProtectedRoute'
import AdminLayout from './components/layout/AdminLayout'
import AdminLogin from './features/admin/pages/AdminLogin'
import Dashboard from './features/admin/pages/Dashboard'
import Requests from './features/admin/pages/Requests'
import AdminMap from './features/admin/pages/Map'
import List from './features/admin/pages/List'
import AdminMyPoints from './features/admin/pages/MyPoints'
import ProfileAdmin from './features/admin/pages/ProfileAdmin'

function App() {
  return (
    <Routes>
      {/*Rotas publicas*/}
      <Route path="/" element={<LandingPage />} />
      <Route path="/sobre" element={<About />} />
      <Route path="/termos" element={<Terms />} />
      <Route path="/privacidade" element={<Privacy />} />

      {/*Rotas de autenticação*/}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/new-password" element={<NewPassword />} />
      <Route path="/register" element={<Register />} />

      {/*Rotas do usuário logado*/}
      <Route element={<HomeLayout />}>
        <Route path="/home" element={<Home />} />
        <Route path="/map" element={<Map />} />
        <Route path="/my-requests" element={<MyRequests />} />
        <Route path="/my-points" element={<MyPoints />} />
        <Route path="/report-barrel" element={<ReportBarrel />} />
        <Route path="/observations" element={<Observations />} />
        <Route path="/confirm-request" element={<ConfirmRequest />} />
        <Route path="/register-point" element={<RegisterPoint />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/informar-nivel" element={<InformarNivelBombona />} />
      </Route>
      
      <Route path="/admin/login" element={<AdminLogin />} />

      {/*Rotas do administrador*/}
      <Route path="/admin/dashboard" element={<AdminProtectedRoute><Dashboard /></AdminProtectedRoute>} />
      <Route path="/admin/requests" element={<AdminProtectedRoute><Requests /></AdminProtectedRoute>} />
      <Route path="/admin/map" element={<AdminProtectedRoute><AdminMap /></AdminProtectedRoute>} />
      <Route path="/admin/list" element={<AdminProtectedRoute><List /></AdminProtectedRoute>} />
      <Route path="/admin/my-points" element={<AdminProtectedRoute><AdminMyPoints /></AdminProtectedRoute>} />
      <Route path="/admin/profile-admin" element={<AdminProtectedRoute><ProfileAdmin /></AdminProtectedRoute>} />
    </Routes>
  )
}

export default App