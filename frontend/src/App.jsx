import { Routes, Route } from 'react-router-dom'
import GlassmorphismLayout from './components/GlassmorphismLayout'
import DashboardPage from './pages/DashboardPage'
import CategoryPage from './pages/CategoryPage'
import DocumentPage from './pages/DocumentPage'
import TaskPage from './pages/TaskPage'
import ReportPage from './pages/ReportPage'
import PvnMonthlyReportPage from './pages/PvnMonthlyReportPage'
import LoginPage from './pages/LoginPage'
import { useAuth } from './contexts/AuthContext'

function App() {
  const { loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <>
        <div className="app-background" />
        <main className="auth-loading">Dang tai...</main>
      </>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <GlassmorphismLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/categories" element={<CategoryPage />} />
        <Route path="/documents" element={<DocumentPage />} />
        <Route path="/tasks" element={<TaskPage />} />
        <Route path="/reports" element={<ReportPage />} />
        <Route path="/reports/pvn-monthly" element={<PvnMonthlyReportPage />} />
      </Routes>
    </GlassmorphismLayout>
  )
}

export default App
