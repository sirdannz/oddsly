import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Header from './components/Header/Header'
import OddsPage from './components/OddsPage';
import MatchDetailsPage from './components/Match Details/MatchDetails';
import useAuth from "./authorization/useAuth";
import Login from "./components/Account/Login";
import './App.css';

const queryClient = new QueryClient();

function App() {
  const [bankroll, setBankroll] = useState<number>(10000);
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen p-4">
          <Header />
          <Routes>
            {/* If the user is not authenticated, redirect to Login */}
            <Route
              path="/login"
              element={user ? <Navigate to="/" replace /> : <Login />}
            />

            {/* Protected routes: Only accessible if authenticated */}
            <Route
              path="/"
              element={
                user ? (
                  <OddsPage bankroll={bankroll} setBankroll={setBankroll} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/match/:sportKey/:matchId"
              element={
                user ? (
                  <MatchDetailsPage bankroll={bankroll} setBankroll={setBankroll} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
