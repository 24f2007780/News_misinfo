import { useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'
import { initSocket, subscribeAdmin } from '@/lib/socket'
import { 
  LayoutDashboard, 
  Radio, 
  Network, 
  FlaskConical, 
  TrendingUp, 
  FileText, 
  Shield, 
  Settings,
  LogOut,
  Bell,
  Search,
  Sun,
  Moon
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const getMenuItems = (t: (key: string) => string) => [
  { icon: LayoutDashboard, label: t('overview'), path: '/admin' },
  { icon: Radio, label: t('streams'), path: '/admin/streams' },
  { icon: Network, label: t('claims'), path: '/admin/claims' },
  { icon: FlaskConical, label: t('verification'), path: '/admin/verification' },
  { icon: TrendingUp, label: t('trends'), path: '/admin/trends' },
  { icon: FileText, label: t('reports'), path: '/admin/reports' },
  { icon: Shield, label: t('governance'), path: '/admin/governance' },
  { icon: Settings, label: t('settings'), path: '/admin/settings' },
]

export default function AdminDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  
  const menuItems = getMenuItems(t)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/')
      return
    }

    const socket = initSocket(user.id)
    subscribeAdmin()

    return () => {
      socket?.off('daily-brief')
      socket?.off('spike-alert')
      socket?.off('claims-extracted')
      socket?.off('claim-verified')
    }
  }, [user, navigate])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'light' 
        ? 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100' 
        : 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900'
    }`}>
      {/* Top Navbar */}
      <header className={`h-16 border-b backdrop-blur-md fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        theme === 'light'
          ? 'border-gray-200 bg-white/80'
          : 'border-white/10 bg-black/30'
      }`}>
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Shield className="w-6 h-6 text-primary ai-glow" />
              </div>
              <div>
                <h1 className={`text-lg font-bold transition-colors duration-300 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>{t('aiMisinformationIntelligence')}</h1>
                <p className={`text-xs transition-colors duration-300 ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>{t('adminCommandCenter')}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                className={`w-64 h-9 pl-10 pr-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-300 ${
                  theme === 'light'
                    ? 'bg-gray-100 border border-gray-300 text-gray-900 placeholder:text-gray-500'
                    : 'bg-white/5 border border-white/10 text-white placeholder:text-gray-500'
                }`}
              />
            </div>
            <Button variant="ghost" size="sm">
              <Bell className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              title={theme === 'light' ? t('darkMode') : t('lightMode')}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className={`text-sm font-medium transition-colors duration-300 ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>{user?.name}</p>
                <p className={`text-xs transition-colors duration-300 ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>{t('administrator')}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Left Sidebar */}
        <aside className={`w-64 border-r backdrop-blur-sm fixed left-0 top-16 bottom-0 overflow-y-auto transition-colors duration-300 ${
          theme === 'light'
            ? 'border-gray-200 bg-white/80'
            : 'border-white/10 bg-black/20'
        }`}>
          <nav className="p-4 space-y-2">
            {menuItems.map((item: any) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all',
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : theme === 'light'
                        ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
