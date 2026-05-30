import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { MeProvider } from './contexts/MeContext'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MeProvider>
          <AppRoutes />
        </MeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App