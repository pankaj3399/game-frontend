import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/auth'
import { useAuth } from './hooks/auth'
import { Toaster } from '@/components/ui/sonner'
import { MainLayout } from '@/layouts/MainLayout'
import { ProtectedRoute } from '@/components/auth'
import Loader from "@/components/shared/Loader"
import { ROLES } from './constants/roles'

const Login = lazy(() => import('./pages/auth/Login'))
const UserInformation = lazy(() => import('./pages/user/UserInformation'))
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'))
const SettingsPage = lazy(() => import('./pages/profile/SettingsPage'))
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage'))
const ManageClubPage = lazy(() => import('./pages/clubs/ManageClubPage'))
const SponsorsPage = lazy(() => import('./pages/sponsors/SponsorsPage'))
const AboutPage = lazy(() => import('./pages/about/AboutPage'))
const AdminPage = lazy(() => import('./pages/admin/AdminPage'))


function Home() {
  const { isAuthenticated, isProfileComplete, loading } = useAuth()

  if (loading) {
    return <Loader />
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isProfileComplete) return <Navigate to="/information" replace />
  return <Navigate to="/profile" replace />
}

function App() {
  return (
    <div className='w-screen h-screen bg-gray-50 overflow-x-hidden'>

    <AuthProvider>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/information" element={<MainLayout />}>
            <Route index element={<UserInformation />} />
          </Route>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={ <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>}>
            <Route path="/profile" element={<SettingsPage />} />
            <Route path="/tournaments" element={<PlaceholderPage />} />
            <Route path="/my-score" element={<PlaceholderPage />} />
            <Route path="/record-score" element={<PlaceholderPage />} />
            <Route path="/clubs" element={<ManageClubPage />} />
            <Route path="/sponsors" element={<SponsorsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/admin" element={ <ProtectedRoute requireRoleOrAbove={ROLES.SUPER_ADMIN}> <AdminPage /> </ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </AuthProvider>
    </div>
  )
}

export default App
