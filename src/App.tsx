/* ++++++++++ IMPORTS ++++++++++ */
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

/* ++++++++++ HEADER ++++++++++ */
import Header from './components/Header/Header';

/* ++++++++++ MAIN CONTENT ++++++++++ */
import OddsPage from './components/OddsPage';
import MatchDetailsPage from './components/Match Details/MatchDetails';

/* ++++++++++ AUTHORIZATION / LOGIN ++++++++++ */
import useAuth from "./authorization/useAuth";
import Login from "./components/Account/Login";
import RingLoader from 'react-spinners/RingLoader'

/* ++++++++++ LEGAL ++++++++++ */
import TermsPage from './components/Legal/TermsPage';
import PrivacyPolicyPage from './components/Legal/PrivacyPolicyPage';

/* ++++++++++ STYLES ++++++++++ */
import './App.css';

const queryClient = new QueryClient();

function App() {
  const [bankroll, setBankroll] = useState<number>(10000);
  const { user, loading } = useAuth();

  if (loading) {
    return (

      <div className="flex items-center justify-center min-h-screen">
        <RingLoader size={300} color='#200589' speedMultiplier={1.25}/>
      </div>

    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen p-4">

          <Header />

          <Routes>
            {/* Redirect logged-in users from the login page to the home page */}
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

            {/* Define a PrivateRoute wrapper for protected routes */}
            <Route
              path="/"
              element={
                <PrivateRoute user={user}>
                  <OddsPage bankroll={bankroll} setBankroll={setBankroll} />
                </PrivateRoute>
              }
            />
            <Route
              path="/match/:sportKey/:matchId"
              element={
                <PrivateRoute user={user}>
                  <MatchDetailsPage bankroll={bankroll} setBankroll={setBankroll} />
                </PrivateRoute>
              }
            />

            {/* Legal pages */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />

          </Routes>
        </div>
      </BrowserRouter>``
    </QueryClientProvider>
  );
}

/* ++++++++++ PRIVATE ROUTE ++++++++++ */
// PrivateRoute Component to handle protected routes
function PrivateRoute({ user, children }: { user: any; children: JSX.Element }) { // Add user prop
  return user ? children : <Navigate to="/login" replace />; // Redirect to login if user is not authenticated
}

export default App;
