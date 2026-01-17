import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import Overview from './pages/admin/Overview'
import StreamsAgents from './pages/admin/StreamsAgents'
import ClaimIntelligence from './pages/admin/ClaimIntelligence'
import VerificationStudio from './pages/admin/VerificationStudio'
import TrendsHeatmaps from './pages/admin/TrendsHeatmaps'
import Reports from './pages/admin/Reports'
import Governance from './pages/admin/Governance'
import Settings from './pages/admin/Settings'
import IngestorAgent from './pages/admin/IngestorAgent'
import CommunityReport from './pages/CommunityReport'

function App() {
  const { user } = useAuthStore()

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
        <div className="min-h-screen bg-background">
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* User Dashboard */}
          <Route 
            path="/" 
            element={user ? <UserDashboard /> : <Navigate to="/login" />} 
          />
          
          {/* Community Report */}
          <Route 
            path="/community" 
            element={user ? <CommunityReport /> : <Navigate to="/login" />} 
          />
          
          {/* Admin Dashboard */}
          <Route 
            path="/admin" 
            element={
              user?.role === 'admin' ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          >
            <Route index element={<Overview />} />
            <Route path="streams" element={<StreamsAgents />} />
            <Route path="claims" element={<ClaimIntelligence />} />
            <Route path="verification" element={<VerificationStudio />} />
            <Route path="trends" element={<TrendsHeatmaps />} />
            <Route path="reports" element={<Reports />} />
            <Route path="governance" element={<Governance />} />
            <Route path="settings" element={<Settings />} />
            <Route path="ingestor" element={<IngestorAgent />} />
          </Route>
        </Routes>
        
        <Toaster 
          position="top-right"
          toastOptions={{
            className: 'dark:bg-card dark:text-foreground',
            duration: 4000,
          }}
        />
        </div>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
