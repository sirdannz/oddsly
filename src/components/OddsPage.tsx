import React, { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { fetchOdds } from '../services/api';
import { convertToAmericanOdds } from '../utils/oddsConversion';
import { Search } from 'lucide-react';

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
  sport?: string;  // Added to track which sport the match belongs to
}

interface OddsCellProps {
  bookmaker: BookmakerData;
  team: string;
  market: string;
}

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

const OddsCell: React.FC<OddsCellProps> = ({ bookmaker, team, market }) => {
  const marketOutcome = bookmaker.markets.find(
    (m: Market) => m.key === market
  )?.outcomes;
  
  const teamOutcome = marketOutcome?.find(
    (outcome: Outcome) => outcome.name === team
  );

  if (!teamOutcome) return <td className="p-2 text-center">N/A</td>;

  const odds = convertToAmericanOdds(teamOutcome.price);
  
  return (
    <td className="p-2 text-center">
      <div>{odds}</div>
      {market === 'spreads' && teamOutcome.point !== undefined && (
        <div className="text-gray-400 text-sm">
          {teamOutcome.point > 0 ? '+' : ''}{teamOutcome.point}
        </div>
      )}
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

  // Query all sports simultaneously
  const sportsQueries = useQueries({
    queries: ALL_SPORTS.map(sport => ({
      queryKey: ['odds', sport.key, selectedMarket, Array.from(selectedBooks)],
      queryFn: () => fetchOdds(sport.key, 'us', selectedMarket).then(data => 
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

  return (
    <div className="mt-4 text-black">
      {/* Search Bar */}
      <div className="flex justify-center mb-6">
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

      <div className="flex justify-center mb-4 space-x-4 border-b border-neon">
        {MAIN_SPORTS.map((sport) => (
          <button
            key={sport.key}
            onClick={() => handleSportClick(sport.key)}
            className={`p-2 border-b-2 text-3xl ${
              selectedSport === sport.key ? 'border-neon' : 'border-transparent'
            } text-black`}
          >
            {sport.title}
          </button>
        ))}
        <button
          onClick={() => handleSportClick('soccer')}
          className={`p-2 border-b-2 text-3xl ${
            showSoccerLeagues ? 'border-neon' : 'border-transparent'
          } text-black`}
        >
          Soccer
        </button>
      </div>

      {showSoccerLeagues && (
        <div className="flex justify-center mb-4 space-x-4 border-b border-neon">
          {SOCCER_LEAGUES.map((league) => (
            <button
              key={league.key}
              onClick={() => handleSoccerLeagueClick(league.key)}
              className={`p-2 border-b-2 text-xl ${
                selectedSoccerLeague === league.key ? 'border-neon' : 'border-transparent'
              } text-black`}
            >
              {league.title}
            </button>
          ))}
        </div>
      )}

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

        {isLoading && <p className="text-center">Loading odds...</p>}

        {filteredMatches.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-2 border-neon bg-temp">
              <thead>
                <tr>
                  <th className="p-2 border-b border-neon text-left sticky left-0 bg-temp">
                    Game
                  </th>
                  <th className="p-2 border-b border-neon text-left sticky left-[120px] bg-temp">
                    Team
                  </th>
                  {filteredMatches[0]?.bookmakers
                    .filter((bookmaker: BookmakerData) => selectedBooks.size === 0 || selectedBooks.has(bookmaker.key))
                    .map((bookmaker: BookmakerData) => (
                      <th key={bookmaker.key} className="p-2 border-b border-neon text-center">
                        {bookmaker.title}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((match: Match) => (
                  <React.Fragment key={match.id}>
                    <tr className="border-b border-neon">
                      <td
                        rowSpan={2}
                        className="p-2 text-left border-r-4 border-neon sticky left-0 bg-temp"
                      >
                        <div className="font-semibold text-sm text-gray-500">
                          {ALL_SPORTS.find(sport => sport.key === match.sport)?.title}
                        </div>
                        {match.home_team} vs {match.away_team}
                      </td>
                      <td className="p-2 sticky left-[120px] bg-temp">
                        {match.home_team}
                      </td>
                      {match.bookmakers
                        .filter((bookmaker: BookmakerData) => selectedBooks.size === 0 || selectedBooks.has(bookmaker.key))
                        .map((bookmaker: BookmakerData) => (
                          <OddsCell
                            key={`${bookmaker.key}-home`}
                            bookmaker={bookmaker}
                            team={match.home_team}
                            market={selectedMarket}
                          />
                        ))}
                    </tr>
                    <tr className="border-b-4 border-neon">
                      <td className="p-2 sticky left-[120px] bg-temp">
                        {match.away_team}
                      </td>
                      {match.bookmakers
                        .filter((bookmaker: BookmakerData) => selectedBooks.size === 0 || selectedBooks.has(bookmaker.key))
                        .map((bookmaker: BookmakerData) => (
                          <OddsCell
                            key={`${bookmaker.key}-away`}
                            bookmaker={bookmaker}
                            team={match.away_team}
                            market={selectedMarket}
                          />
                        ))}
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
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