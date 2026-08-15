import Footer from './components/Footer.jsx'
import Navbar from './components/Navbar.jsx'
import AppRoutes from './routes/AppRoutes.jsx'
import { useLocation } from 'react-router-dom'

export default function App() {
  const location = useLocation()
  const isAdminPage = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen flex flex-col bg-night text-ink">
      {!isAdminPage && <Navbar />}
      <main className="flex-1">
        <AppRoutes />
      </main>
      {!isAdminPage && <Footer />}
    </div>
  )
}
