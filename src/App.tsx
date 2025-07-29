import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Header from './components/Header/Header'
import OddsPage from './components/OddsPage'
import MatchDetailsPage from './components/Match Details/MatchDetails'
import UserProfile from './components/Account/UserProfile'
import TermsPage from './components/Legal/TermsPage'
import PrivacyPolicyPage from './components/Legal/PrivacyPolicyPage'

import './App.css'

const queryClient = new QueryClient();

function App() {
  const [bankroll, setBankroll] = useState<number>(10000);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#171717]">
          <Header />

          <Routes>
            <Route path="/" element={<Navigate to="/odds" replace />} />
            <Route path="/login" element={<Navigate to="/odds" replace />} />
            <Route
              path="/odds"
              element={
                <OddsPage bankroll={bankroll} setBankroll={setBankroll} />
              }
            />
            <Route
              path="/match/:sportKey/:matchId"
              element={
                <MatchDetailsPage bankroll={bankroll} setBankroll={setBankroll} />
              }
            />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
