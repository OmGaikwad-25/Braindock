import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Assessment from './pages/Assessment';
import DailyTasks from './pages/DailyTasks';
import WeeklyTest from './pages/WeeklyTest';
import Progress from './pages/Progress';
import Opportunities from './pages/Opportunities';
import MockInterview from './pages/MockInterview';
import Reports from './pages/Reports';
import AdminPanel from './pages/AdminPanel';
import CodingPlatform from './pages/CodingPlatform';
import Roadmaps from './pages/Roadmaps';
import Aptitude from './pages/Aptitude';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><div className="spinner" /><p>Loading...</p></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="assessment" element={<Assessment />} />
        <Route path="tasks" element={<DailyTasks />} />
        <Route path="tests" element={<WeeklyTest />} />
        <Route path="progress" element={<Progress />} />
        <Route path="opportunities" element={<Opportunities />} />
        <Route path="interview" element={<MockInterview />} />
        <Route path="reports" element={<Reports />} />
        <Route path="coding" element={<CodingPlatform />} />
        <Route path="roadmaps" element={<Roadmaps />} />
        <Route path="aptitude" element={<Aptitude />} />
        <Route path="admin" element={<AdminPanel />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
