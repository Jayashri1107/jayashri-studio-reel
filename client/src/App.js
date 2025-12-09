import './App.css';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom"
import Page404 from './Layout/Page404';
import {ConfigProvider} from './Context/ConfigContext'
import {UserProvider} from './Context/UserContext'

import routes from './Routes/Routes'
import AppLayout from './Layout/AppLayout';
import Login from './Pages/LoginPage/Login';
import Signup from './Pages/LoginPage/Signup';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect } from 'react';
import ProtectedRoute from './Routes/ProtectedRoute';

// Create router once - static configuration
const router = createBrowserRouter([
  {
    path: '/Login',
    element: <Login />,
  },
  {
    path: '/Signup',
    element: <Signup />,
  },
  {
    element: <AppLayout />,
    errorElement: <Page404 />,
    children: routes
  },
  {
    path: '/',
    element: <Navigate to="/Login" replace />
  }
], {
  // Add the future flag to suppress the warning
  future: {
    v7_startTransition: true
  }
});

function App() {
  useEffect(() => {
    // Initialize theme from sessionStorage
    try {
      const config = JSON.parse(sessionStorage.getItem('_THEME_CONFIG_') || '{}');
      if (config.theme) {
        document.documentElement.setAttribute('data-bs-theme', config.theme);
      } else {
        document.documentElement.setAttribute('data-bs-theme', 'light');
      }
    } catch (e) {
      // Default to light theme
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }

    // Initialize Lucide icons once on mount
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Prevent template JS from interfering with React-managed DOM
    if (window.ThemeLayout) {
      const originalThemeLayout = window.ThemeLayout;
      window.ThemeLayout = function() {
        try {
          return originalThemeLayout.apply(this, arguments);
        } catch (e) {
          // Silently fail if it tries to manipulate React elements
        }
      };
    }
  }, []);

  return (
    <ConfigProvider>
      <UserProvider>
        <RouterProvider router={router} />
        <ToastContainer />
      </UserProvider>
    </ConfigProvider>
  );
}

export default App;