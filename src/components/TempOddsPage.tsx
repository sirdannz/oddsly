import React, { useState, useEffect, useRef } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Search, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchOdds } from '../services/api';

interface Sport {
  key: string;
  title: string;
}

interface MarketOption {
  value: string;
  label: string;
}

interface Market {
  key: string;
  outcomes: Outcome[];
}

interface BookmakerData {
  key: string;
  title: string;
  markets: Market[];
}

interface Bookmaker {
  key: string;
  title: string;
}

interface Outcome {
  name: string;
  price: number;
  point?: number;
}

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  bookmakers: BookmakerData[];
  sport?: string;
}

interface OddsCellProps {
  bookmaker: BookmakerData;
  team: string;
  market: string;
  isBestOdds: boolean;
  estimatedProbability?: number;
  bankroll?: number;

}

const ROW_HEIGHT = "h-32";

const MAIN_SPORTS: Sport[] = [
  { key: 'americanfootball_nfl', title: 'NFL' },
  { key: 'americanfootball_ncaaf', title: 'NCAAF' },
  { key: 'basketball_nba', title: 'NBA' },
  { key: 'baseball_mlb', title: 'MLB' },
  { key: 'mma_mixed_martial_arts', title: 'MMA' },
  { key: 'icehockey_nhl', title: 'NHL' },
  { key: 'tennis_atp_french_open', title: 'Tennis' },
];

const SOCCER_LEAGUES: Sport[] = [
  { key: 'soccer_usa_mls', title: 'MLS' },
  { key: 'soccer_brazil_campeonato', title: 'Brazil Série A' },
  { key: 'soccer_spain_segunda_division', title: 'La Liga 2' },
  { key: 'soccer_uefa_european_championship', title: 'UEFA Euro' },
  { key: 'soccer_australia_aleague', title: 'A-League' },
  { key: 'soccer_japan_j_league', title: 'J League' }
];

const ALL_SPORTS = [...MAIN_SPORTS, ...SOCCER_LEAGUES];

const marketOptions: MarketOption[] = [
  { value: 'h2h', label: 'Moneyline' },
  { value: 'spreads', label: 'Spread' }
];

const popularBookmakers: Bookmaker[] = [
  { key: 'draftkings', title: 'DraftKings' },
  { key: 'williamhill_us', title: 'Caesars' },
  { key: 'betus', title: 'BetUS' },
  { key: 'fanduel', title: 'FanDuel' },
  { key: 'mybookieag', title: 'MyBookie.ag' },
  { key: 'betrivers', title: 'BetRivers' },
  { key: 'betmgm', title: 'BetMGM' },
  { key: 'betonlineag', title: 'BetOnline.ag' },
  { key: 'lowvig', title: 'LowVig.ag' },
  { key: 'bovada', title: 'Bovada' },
];

// FIND THE BEST ODDS //

const findBestOdds = (outcomes: Outcome[], teamName: string, market: string): number | null => {
  const teamOutcome = outcomes?.find(outcome => outcome.name === teamName);
  return teamOutcome?.price || null;
};

// KELLY CRITERION //

const americanToDecimal = (americanOdds: number): number => {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
};

const calculateImpliedProbability = (decimalOdds: number): number => {
  return 1 / decimalOdds;
};

const calculateConsensusImpliedProbability = (outcomes: Outcome[], teamName: string): number => {
  const teamOutcome = outcomes?.find(outcome => outcome.name === teamName);
  if (!teamOutcome?.price) return 0;
  
  const decimalOdds = americanToDecimal(teamOutcome.price);
  return calculateImpliedProbability(decimalOdds);
};

const normalizeImpliedProbabilities = (homeProb: number, awayProb: number): [number, number] => {
  const total = homeProb + awayProb;
  if (total === 0) return [0, 0];
  return [homeProb / total, awayProb / total];
};

const calculateKellyCriterion = (
  decimalOdds: number, 
  estimatedProbability: number
): number => {
  const q = 1 - estimatedProbability;
  const b = decimalOdds - 1; // Convert to decimal odds minus 1 for Kelly formula
  
  // Kelly Formula: f* = (bp - q) / b
  // where f* is the fraction of bankroll to bet
  // b is the decimal odds minus 1
  // p is our estimated probability of winning
  // q is the probability of losing (1-p)
  const kelly = (b * estimatedProbability - q) / b;
  
  // Return 0 if kelly is negative (no bet)
  // Cap kelly at 25% of bankroll as a conservative measure
  return Math.max(0, Math.min(kelly, 0.25));
};

const BankrollInput = ({ bankroll, setBankroll }) => {
  const [inputValue, setInputValue] = useState(bankroll.toString());
  
  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(value);
    if (value) {
      setBankroll(parseInt(value));
    }
  };

  return (
    <div className="relative w-48 mx-2">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <DollarSign className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Enter bankroll"
        className="pl-10 pr-4 py-2 w-full border-2 border-neon rounded-lg focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon"
      />
    </div>
  );
};



const OddsCell: React.FC<OddsCellProps> = ({ bookmaker, team, market, isBestOdds, estimatedProbability, bankroll }) => {
  const marketOutcome = bookmaker.markets.find(
    (m: Market) => m.key === market
  )?.outcomes;
  
  const teamOutcome = marketOutcome?.find(
    (outcome: Outcome) => outcome.name === team
  );

  if (!teamOutcome) {
    return (
      <td className={`p-2 text-center border-neon ${ROW_HEIGHT}`}>
        <div className="flex items-center justify-center h-full">
          N/A
        </div>
      </td>
    );
  }

  const odds = teamOutcome.price;
  const decimalOdds = americanToDecimal(odds);
  const impliedProb = calculateImpliedProbability(decimalOdds);
  const probDifference = estimatedProbability - impliedProb;
  
  const kellyFraction = calculateKellyCriterion(decimalOdds, estimatedProbability);
  const recommendedBet = kellyFraction * (bankroll || 0);
  
  const isValueBet = probDifference > 0;
  const isKellyBet = kellyFraction > 0;

  return (
    <td className={`p-4 text-center border border-neon relative min-w-[140px] ${ROW_HEIGHT}`}>
      <div className={`
        flex flex-col items-center justify-center h-full
        ${isBestOdds ? 'font-bold' : ''}
        ${isValueBet && isKellyBet ? 'bg-green-100 rounded-lg p-2' : ''}
      `}>
        {probDifference !== 0 && (
          <div className={`
            text-xs
            ${probDifference > 0 ? 'text-green-600' : 'text-red-600'}
          `}>
            {probDifference > 0 ? '⬆' : '⬇'} {Math.abs(probDifference * 100).toFixed(1)}%
          </div>
        )}

        <div className={`
          text-lg mb-1
          ${isValueBet ? (probDifference > 0 ? 'text-green-600' : 'text-red-600') : 'text-black'}
        `}>
          {odds}
        </div>

        <div className="text-xs text-gray-500 mb-1">
          {(impliedProb * 100).toFixed(1)}%
        </div>

        {market === 'spreads' && teamOutcome.point !== undefined && (
          <div className="text-sm text-gray-400">
            {teamOutcome.point > 0 ? '+' : ''}{teamOutcome.point}
          </div>
        )}

        {bankroll && isKellyBet && (
          <div className="text-xs text-green-600 font-bold mt-1">
            ${recommendedBet.toFixed(0)}
            <div className="text-xs text-gray-500">
              ({(kellyFraction * 100).toFixed(3)}%)
            </div>
          </div>
        )}
      </div>
    </td>
  );
};

const OddsPage: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedSoccerLeague, setSelectedSoccerLeague] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string>('h2h');
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set(popularBookmakers.map(b => b.key)));
  const [showSoccerLeagues, setShowSoccerLeagues] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bankroll, setBankroll] = useState(10000);
  


  const fixedTableRef = useRef<HTMLDivElement>(null);
  const scrollableTableRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);


  const fixedTableRowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});
  const scrollableTableRowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  const sportsQueries = useQueries({
    queries: ALL_SPORTS.map(sport => ({
      queryKey: ['odds', sport.key, selectedMarket, Array.from(selectedBooks)],
      queryFn: () => fetchOdds(sport.key, selectedMarket).then(data => 
        data.map((match: Match) => ({
          ...match,
          sport: sport.key,
          sportTitle: sport.title
        }))
      ),
      enabled: !selectedSport || selectedSport === sport.key,
    }))
  });

  const isLoading = sportsQueries.some(query => query.isLoading);
  const allOdds = sportsQueries
    .filter(query => query.data)
    .flatMap(query => query.data ?? []);

  const handleSportClick = (sportKey: string) => {
    if (sportKey === 'soccer') {
      setShowSoccerLeagues(true);
      setSelectedSport(null);
    } else {
      setShowSoccerLeagues(false);
      setSelectedSport(sportKey);
      setSelectedSoccerLeague(null);
    }
  };

  const handleSoccerLeagueClick = (leagueKey: string) => {
    setSelectedSport(leagueKey);
    setSelectedSoccerLeague(leagueKey);
  };

  const handleBookToggle = (bookmakerKey: string) => {
    setSelectedBooks((prev) => {
      const updated = new Set(prev);
      if (updated.has(bookmakerKey)) {
        updated.delete(bookmakerKey);
      } else {
        updated.add(bookmakerKey);
      }
      return updated;
    });
  };

  const handleSelectAllBooks = () => {
    setSelectedBooks(
      selectedBooks.size === popularBookmakers.length
        ? new Set()
        : new Set(popularBookmakers.map(b => b.key))
    );
  };

  const filterMatches = (matches: Match[]) => {
    if (!searchQuery) {
      return selectedSport ? matches.filter(match => match.sport === selectedSport) : matches;
    }
    
    const query = searchQuery.toLowerCase();
    return matches.filter(match => 
      match.home_team.toLowerCase().includes(query) ||
      match.away_team.toLowerCase().includes(query)
    );
  };

  const isAllSelected = selectedBooks.size === popularBookmakers.length;
  const filteredMatches = filterMatches(allOdds);

  const allBookmakersInMatches = popularBookmakers.filter(bookmaker =>
    selectedBooks.has(bookmaker.key) &&
    filteredMatches.some(match =>
      match.bookmakers.some(bm => bm.key === bookmaker.key)
    )
  );

  useEffect(() => {
    const syncRowHeights = () => {
      Object.keys(fixedTableRowRefs.current).forEach((key) => {
        const fixedRow = fixedTableRowRefs.current[key];
        const scrollableRow = scrollableTableRowRefs.current[key];
        
        if (fixedRow && scrollableRow) {
          // Get the natural heights of both rows
          fixedRow.style.height = 'auto';
          scrollableRow.style.height = 'auto';
          
          const fixedHeight = fixedRow.getBoundingClientRect().height;
          const scrollableHeight = scrollableRow.getBoundingClientRect().height;
          
          // Set both rows to the maximum height
          const maxHeight = Math.max(fixedHeight, scrollableHeight);
          fixedRow.style.height = `${maxHeight}px`;
          scrollableRow.style.height = `${maxHeight}px`;
        }
      });
    };

    // Run synchronization after initial render
    syncRowHeights();
    
    // Add resize observer to handle dynamic content changes
    const resizeObserver = new ResizeObserver(syncRowHeights);
    
    Object.values(fixedTableRowRefs.current).forEach(row => {
      if (row) resizeObserver.observe(row);
    });
    Object.values(scrollableTableRowRefs.current).forEach(row => {
      if (row) resizeObserver.observe(row);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [filteredMatches, selectedMarket, bankroll]);

  useEffect(() => {
    const fixedTable = fixedTableRef.current;
    const scrollableTable = scrollableTableRef.current;

    if (!fixedTable || !scrollableTable) return;

    const syncScroll = (e: Event) => {
      if (!isUserScrolling.current) {
        isUserScrolling.current = true;
        const sourceElement = e.target as HTMLDivElement;
        const targetElement = sourceElement === fixedTable ? scrollableTable : fixedTable;
        targetElement.scrollTop = sourceElement.scrollTop;
        requestAnimationFrame(() => {
          isUserScrolling.current = false;
        });
      }
    };

    // Add passive scroll listeners for better performance
    fixedTable.addEventListener('scroll', syncScroll, { passive: true });
    scrollableTable.addEventListener('scroll', syncScroll, { passive: true });

    return () => {
      fixedTable.removeEventListener('scroll', syncScroll);
      scrollableTable.removeEventListener('scroll', syncScroll);
    };
  }, []);


  // BEST ODDS FOR EACH BET //

  const getBestOddsForTeam = (match: Match, team: string, market: string, bookmakers: BookmakerData[]): number => {
    let bestOdds = -Infinity;
    let bestDecimalOdds = -Infinity;

    bookmakers.forEach(bookmaker => {
      const marketData = bookmaker.markets.find(m => m.key === market);
      const outcome = marketData?.outcomes.find(o => o.name === team);
      if (outcome?.price) {
        // For American odds comparison
        const americanOdds = outcome.price;
        if (americanOdds > 0) {
          // For positive odds, higher is better
          bestOdds = Math.max(bestOdds, americanOdds);
        } else {
          // For negative odds, closer to 0 is better
          bestOdds = bestOdds === -Infinity ? americanOdds : Math.max(bestOdds, americanOdds);
        }
        // Store the corresponding decimal odds
        bestDecimalOdds = Math.max(bestDecimalOdds, outcome.price);
      }
    });

    return bestDecimalOdds;
  };

  // UPDATE ESTIMATED PROBABILITIES //

  const calculateConsensusOdds = (match: Match, team: string): number => {
    let totalProbability = 0;
    let validBookmakerCount = 0;
    
    match.bookmakers
      .filter(bookmaker => selectedBooks.has(bookmaker.key))
      .forEach(bookmaker => {
        const marketData = bookmaker.markets.find(m => m.key === selectedMarket);
        if (marketData) {
          const probability = calculateConsensusImpliedProbability(marketData.outcomes, team);
          if (probability > 0) {
            totalProbability += probability;
            validBookmakerCount++;
          }
        }
      });
    
    return validBookmakerCount > 0 ? totalProbability / validBookmakerCount : 0;
  };

  const renderProbabilityCell = (match: Match, team: string) => {
    const [homeNormProb, awayNormProb] = normalizeImpliedProbabilities(
      calculateConsensusOdds(match, match.home_team),
      calculateConsensusOdds(match, match.away_team)
    );
    const normalizedProb = team === match.home_team ? homeNormProb : awayNormProb;
    
    return (
      <td className="p-2 border-neon sticky left-[240px] bg-temp z-20">
        <div className="text-center">
          {(normalizedProb * 100).toFixed(1)}%
        </div>
      </td>
    );
  };
  

  return (
    <div className="mt-4 text-black">
      {/* Search Bar and Bankroll Input */}
      <div className="flex justify-center items-center mb-6 space-x-4">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search across all sports and leagues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border-2 border-neon rounded-lg focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </div>

      <div className='w-100% flex justify-center'>

        <div className='flex-col justify-evenly items-center text-center'>

          <h2 className='pb-2 font-bold text-black'>Bankroll (Kelly Criterion)</h2>

        <BankrollInput bankroll={bankroll} setBankroll={setBankroll} />


        </div>


      </div>

      {/* Sports List */}
      <div className="overflow-x-auto mb-4 border-b border-neon">
        <div className="flex space-x-4 min-w-min px-4 pb-2 justify-center">
          {MAIN_SPORTS.map((sport) => (
            <button
              key={sport.key}
              onClick={() => handleSportClick(sport.key)}
              className={`p-2 border-b-2 text-3xl whitespace-nowrap ${
                selectedSport === sport.key ? 'border-neon' : 'border-transparent'
              } text-black`}
            >
              {sport.title}
            </button>
          ))}
          <button
            onClick={() => handleSportClick('soccer')}
            className={`p-2 border-b-2 text-3xl whitespace-nowrap ${
              showSoccerLeagues ? 'border-neon' : 'border-transparent'
            } text-black`}
          >
            Soccer
          </button>
        </div>
      </div>

      {/* Soccer Leagues */}
      {showSoccerLeagues && (
        <div className="overflow-x-auto mb-4 border-b border-neon">
          <div className="flex space-x-4 min-w-min px-4 pb-2">
            {SOCCER_LEAGUES.map((league) => (
              <button
                key={league.key}
                onClick={() => handleSoccerLeagueClick(league.key)}
                className={`p-2 border-b-2 text-xl whitespace-nowrap ${
                  selectedSoccerLeague === league.key ? 'border-neon' : 'border-transparent'
                } text-black`}
              >
                {league.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Market Selection and Bookmaker Filters */}
      <div>
        <div className="flex justify-center mb-4 space-x-4 border-b border-neon">
          {marketOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedMarket(option.value)}
              className={`p-2 border-b-2 text-xl ${
                selectedMarket === option.value ? 'border-neon' : 'border-transparent'
              } text-black`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-2 justify-center">
          <button
            onClick={handleSelectAllBooks}
            className={`px-4 py-2 rounded ${
              isAllSelected ? 'bg-neon' : 'bg-gray-800'
            } text-white`}
          >
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>
          {popularBookmakers.map((bookmaker) => (
            <button
              key={bookmaker.key}
              onClick={() => handleBookToggle(bookmaker.key)}
              className={`px-4 py-2 rounded ${
                selectedBooks.has(bookmaker.key) ? 'bg-neon' : 'bg-gray-800'
              } text-white`}
            >
              {bookmaker.title}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && <p className="text-center">Loading odds...</p>}

        {/* Main Content */}
        {filteredMatches.length > 0 && (
        <div className="overflow-x-auto">
          <div className="overflow-y-auto border-x-4 border-t-4 border-neon" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <div className="bg-neon p-[1px] border-b-4 border-neon">
            <table className="table w-full relative border-separate border-b bg-temp"
            style={{ borderSpacing: '0px' }}
            >
            <thead>
                  <tr>
                    {/* Fixed columns */}
                    <th className="sticky-column p-2 w-[120px] border-x border-b border-neon text-left bg-temp sticky top-0 left-0 z-40">
                      Game
                    </th>
                    <th className="sticky-column p-2 w-[120px] border-x border-b border-neon text-left bg-temp sticky top-0 left-[120px] z-40">
                      Team
                    </th>
                    <th className="sticky-column p-2 w-[100px] border-x border-b border-neon text-center bg-temp sticky top-0 left-[240px] z-40">
                      Est. Prob.
                    </th>

                    {/* Scrollable bookmaker columns */}
                    {allBookmakersInMatches.map((bookmaker) => (
                      <th 
                      key={bookmaker.key} 
                      className="sticky-column p-2 border-x border-b border-neon text-center min-w-[140px] sticky top-0 z-30 bg-temp"
                      >
                        {bookmaker.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMatches.map((match: Match) => {
                    const filteredBookmakers = match.bookmakers
                      .filter((bookmaker: BookmakerData) => 
                        selectedBooks.size === 0 || selectedBooks.has(bookmaker.key)
                      );

                    const bestHomeOdds = getBestOddsForTeam(match, match.home_team, selectedMarket, filteredBookmakers);
                    const bestAwayOdds = getBestOddsForTeam(match, match.away_team, selectedMarket, filteredBookmakers);
                    
                    const [homeNormProb, awayNormProb] = normalizeImpliedProbabilities(
                      calculateConsensusOdds(match, match.home_team),
                      calculateConsensusOdds(match, match.away_team)
                    );

                    return (
                      <React.Fragment key={match.id}>
                        {/* Home team row */}
                        <tr className="border-b border-neon">
                          {/* Fixed columns */}
                          <td rowSpan={2} className="p-2 text-left border border-neon bg-temp sticky left-0 z-20">
                            <div className="flex flex-col justify-center">
                              <div className="font-semibold text-sm text-gray-500">
                                {ALL_SPORTS.find(sport => sport.key === match.sport)?.title}
                              </div>
                              <Link 
                                to={`/match/${match.sport}/${match.id}`}
                                className="text-neon hover:underline"
                              >
                                {match.home_team} vs {match.away_team}
                              </Link>
                            </div>
                          </td>
                          <td className="sticky-column p-2 border border-neon bg-temp sticky left-[120px] z-20">
                            {match.home_team}
                          </td>
                          <td className="sticky-column p-2 border border-neon bg-temp sticky left-[240px] z-20 text-center">
                            {renderProbabilityCell(match, match.home_team)}
                          </td>

                          {/* Scrollable odds cells */}
                          {filteredBookmakers.map((bookmaker: BookmakerData) => {
                            const marketOutcome = bookmaker.markets.find(m => m.key === selectedMarket)?.outcomes;
                            const homeOdds = findBestOdds(marketOutcome || [], match.home_team, selectedMarket);
                            const isBestOdds = homeOdds === bestHomeOdds;

                            return (
                              <OddsCell
                                key={`${bookmaker.key}-home`}
                                bookmaker={bookmaker}
                                team={match.home_team}
                                market={selectedMarket}
                                isBestOdds={isBestOdds}
                                estimatedProbability={homeNormProb}
                                bankroll={bankroll}
                              />
                            );
                          })}
                        </tr>

                        {/* Away team row */}
                        <tr>
                          <td className="sticky-column p-2 border border-neon bg-temp sticky left-[120px] z-20">
                            {match.away_team}
                          </td>
                          <td className="sticky-column p-2 border border-neon bg-temp sticky left-[240px] z-20 text-center">
                            {renderProbabilityCell(match, match.away_team)}
                          </td>

                          {/* Scrollable odds cells */}
                          {filteredBookmakers.map((bookmaker: BookmakerData) => {
                            const marketOutcome = bookmaker.markets.find(m => m.key === selectedMarket)?.outcomes;
                            const awayOdds = findBestOdds(marketOutcome || [], match.away_team, selectedMarket);
                            const isBestOdds = awayOdds === bestAwayOdds;

                            return (
                              <OddsCell
                                key={`${bookmaker.key}-away`}
                                bookmaker={bookmaker}
                                team={match.away_team}
                                market={selectedMarket}
                                isBestOdds={isBestOdds}
                                estimatedProbability={awayNormProb}
                                bankroll={bankroll}
                              />
                            );
                          })}
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              </div>
          </div>
        </div>
      )}
        
        {filteredMatches.length === 0 && !isLoading && (
          <p className="text-center text-gray-500 mt-4">
            No matches found. Try adjusting your search or filters.
          </p>
        )}
      </div>
    </div>
  );
};

export default OddsPage;