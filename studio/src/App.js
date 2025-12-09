import './App.css';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom"
import StudioLayout from './Layout/StudioLayout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import studioRoutes from './Routes/StudioRoutes';
import Landing from './Pages/Dashboard/Landing';

// Create router with separate routes for landing page and authenticated routes
const router = createBrowserRouter([
  // Public routes (landing page without layout)
  { path: "/studio", element: <Landing /> },
  {
    // Authenticated routes (wrapped in layout)
    element: <StudioLayout />,
    children: studioRoutes.filter(route => route.path !== "/studio")
  },
  {
    path: '/',
    element: <Navigate to="/studio" replace />
  }
], {
  // Add the future flag to suppress the warning
  future: {
    v7_startTransition: true
  }
});
function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
}

export default App;