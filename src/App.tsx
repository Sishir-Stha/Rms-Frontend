import { useState } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import Dashboard from './pages/Dashboard'
import DeviceRequestKanban from './pages/DeviceRequestKanban'
import DeviceRequests from './pages/DeviceRequests'
import Login from './pages/Login'
import RepairDetail from './pages/RepairDetail'
import RepairKanban from './pages/RepairKanban'
import RepairManagement from './pages/RepairManagement'
import Reports from './pages/Reports'
import DeviceReportDetail from './pages/reports/DeviceReportDetail'
import RepairsReportDetail from './pages/reports/RepairsReportDetail'
import RequestDetail from './pages/RequestDetail'
import Settings from './pages/Settings'
import DeviceStock from './pages/DeviceStock'
import DeviceStockDetail from './pages/DeviceStockDetail'

function AppLayout() {
  const { isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface)' }}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen((isOpen) => !isOpen)} />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/repairs" element={<ProtectedRoute><RepairManagement /></ProtectedRoute>} />
            <Route path="/repairs/:id" element={<ProtectedRoute><RepairDetail /></ProtectedRoute>} />
            <Route path="/repair-kanban" element={<ProtectedRoute><RepairKanban /></ProtectedRoute>} />
            <Route path="/requests" element={<ProtectedRoute><DeviceRequests /></ProtectedRoute>} />
            <Route path="/requests/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
            <Route path="/request-kanban" element={<ProtectedRoute><DeviceRequestKanban /></ProtectedRoute>} />
            <Route path="/device-stock" element={<ProtectedRoute><DeviceStock /></ProtectedRoute>} />
            <Route path="/device-stock/:id" element={<ProtectedRoute><DeviceStockDetail /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/reports/repairs" element={<ProtectedRoute><RepairsReportDetail /></ProtectedRoute>} />
            <Route path="/reports/device" element={<ProtectedRoute><DeviceReportDetail /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <AppLayout />
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
