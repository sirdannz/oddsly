/* ++++++++++ IMPORTS ++++++++++ */
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom'

/* ++++++++++ HEADER ++++++++++ */
import Header from './components/Header/Header'

/* ++++++++++ HOME ++++++++++ */
import Home from './components/Home/Home'

/* ++++++++++ MAIN CONTENT ++++++++++ */
import OddsPage from './components/OddsPage'
import MatchDetailsPage from './components/Match Details/MatchDetails'

/* ++++++++++ AUTHORIZATION / LOGIN ++++++++++ */
import Login from "./components/Account/Login";
import RingLoader from 'react-spinners/RingLoader'

/* ++++++++++ USER PROFILE ++++++++++ */
import UserProfile from './components/Account/UserProfile'

/* ++++++++++ LEGAL ++++++++++ */
import TermsPage from './components/Legal/TermsPage'
import PrivacyPolicyPage from './components/Legal/PrivacyPolicyPage'

/* ++++++++++ STYLES ++++++++++ */
import './App.css'

const queryClient = new QueryClient();

function App() {
  const [bankroll, setBankroll] = useState<number>(10000);

  // Auto-redirect away from login page
  const location = window.location.pathname;
  if (location === '/login') {
    window.location.href = '/odds'; // or '/' if you want the home screen
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#171717]">

          {/* Show header unless on login page */}
          {location !== '/login' && <Header />}

          <Routes>
            {/* Home page as default route */}
            <Route path="/" element={<Home />} />

            {/* Login page (won't be used due to redirect above) */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes (auth bypassed) */}
            <Route
              path="/odds"
              element={
                <PrivateRoute>
                  <OddsPage bankroll={bankroll} setBankroll={setBankroll} />
                </PrivateRoute>
              }
            />
            <Route
              path="/match/:sportKey/:matchId"
              element={
                <PrivateRoute>
                  <MatchDetailsPage bankroll={bankroll} setBankroll={setBankroll} />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <UserProfile />
                </PrivateRoute>
              }
            />

            {/* Legal pages */}
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

/* ++++++++++ PRIVATE ROUTE (No Auth) ++++++++++ */
function PrivateRoute({ children }: { children: JSX.Element }) {
  return children;
}

export default App;
