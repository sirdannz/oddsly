import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import OddsPage from './components/OddsPage';
import MatchDetailsPage from './components/Match Details/MatchDetails';
import './App.css';

const queryClient = new QueryClient();

const App = () => {
  const [bankroll, setBankroll] = useState<number>(10000);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen p-4">
          <h1 className="text-8xl font-bold text-center text-neon">Oddsly</h1>
          <Routes>
            <Route
              path="/"
              element={<OddsPage bankroll={bankroll} setBankroll={setBankroll} />}
            />
            <Route
              path="/match/:sportKey/:matchId"
              element={<MatchDetailsPage bankroll={bankroll} setBankroll={setBankroll} />}
            />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;