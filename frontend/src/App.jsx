import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MeProvider } from "./contexts/MeContext";
import { SocketProvider } from "./contexts/SocketContext";

function App() {
  useEffect(() => {
    const LIMIT = 72 * 60 * 60 * 1000;

    const updateActivity = () => {
      localStorage.setItem("last_activity", Date.now().toString());
    };

    const checkInactivity = () => {
      const token = localStorage.getItem("helpdesk_token");
      const last = localStorage.getItem("last_activity");
      if (token && last && Date.now() - parseInt(last) > LIMIT) {
        localStorage.removeItem("helpdesk_token");
        localStorage.removeItem("last_activity");
        window.location.href = "/login";
      }
    };

    window.addEventListener("click", updateActivity);
    window.addEventListener("keydown", updateActivity);

    const interval = setInterval(checkInactivity, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      clearInterval(interval);
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <MeProvider>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </MeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
