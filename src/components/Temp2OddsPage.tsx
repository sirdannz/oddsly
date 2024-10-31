// Install necessary dependencies:
// npm install @mui/material @mui/x-data-grid @emotion/react @emotion/styled

import React, { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Search, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchOdds } from '../services/api';
import { DataGrid } from '@mui/x-data-grid';
import { TextField, Button, Checkbox, FormControlLabel } from '@mui/material';

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
  estimatedProbability: number;
  bankroll: number;
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
  { key: 'soccer_japan_j_league', title: 'J League' },
];

const ALL_SPORTS = [...MAIN_SPORTS, ...SOCCER_LEAGUES];

const marketOptions: MarketOption[] = [
  { value: 'h2h', label: 'Moneyline' },
  { value: 'spreads', label: 'Spread' },
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

const findBestOdds = (
  outcomes: Outcome[],
  teamName: string
): number | null => {
  const teamOutcome = outcomes?.find((outcome) => outcome.name === teamName);
  return teamOutcome?.price || null;
};

// KELLY CRITERION //

const americanToDecimal = (americanOdds: number): number => {
  if (!americanOdds || isNaN(americanOdds)) {
    return NaN;
  }
  if (americanOdds > 0) {
    return americanOdds / 100 + 1;
  } else {
    return 100 / Math.abs(americanOdds) + 1;
  }
};

const calculateImpliedProbability = (decimalOdds: number): number => {
  if (!decimalOdds || isNaN(decimalOdds) || decimalOdds === 0) {
    return 0;
  }
  return 1 / decimalOdds;
};

const calculateConsensusImpliedProbability = (
  outcomes: Outcome[],
  teamName: string
): number => {
  const teamOutcome = outcomes?.find((outcome) => outcome.name === teamName);
  if (!teamOutcome?.price) return 0;

  const decimalOdds = americanToDecimal(teamOutcome.price);
  if (!decimalOdds || isNaN(decimalOdds) || !isFinite(decimalOdds)) return 0;

  return calculateImpliedProbability(decimalOdds);
};

const normalizeImpliedProbabilities = (
  homeProb: number,
  awayProb: number
): [number, number] => {
  const total = homeProb + awayProb;
  if (total === 0) return [0, 0];
  return [homeProb / total, awayProb / total];
};

const calculateKellyCriterion = (
  decimalOdds: number,
  estimatedProbability: number
): number => {
  const q = 1 - estimatedProbability;
  const b = decimalOdds - 1;

  if (b === 0) {
    return 0;
  }

  const kelly = (b * estimatedProbability - q) / b;

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
    <TextField
      label="Enter bankroll"
      variant="outlined"
      value={inputValue}
      onChange={handleInputChange}
      InputProps={{
        startAdornment: <DollarSign className="h-5 w-5 text-gray-400" />,
      }}
    />
  );
};

const OddsCell: React.FC<OddsCellProps> = ({
  bookmaker,
  team,
  market,
  isBestOdds,
  estimatedProbability = 0,
  bankroll = 0,
}) => {
  const marketData = bookmaker.markets.find(
    (m: Market) => m.key === market
  );

  const marketOutcome = marketData?.outcomes;

  const teamOutcome = marketOutcome?.find(
    (outcome: Outcome) => outcome.name === team
  );

  if (!teamOutcome || teamOutcome.price == null) {
    return <div style={{ textAlign: 'center' }}>N/A</div>;
  }

  const odds = teamOutcome.price;
  const decimalOdds = americanToDecimal(odds);

  if (!decimalOdds || isNaN(decimalOdds) || !isFinite(decimalOdds)) {
    return <div style={{ textAlign: 'center' }}>Invalid Odds</div>;
  }

  const impliedProb = calculateImpliedProbability(decimalOdds);

  if (!impliedProb || isNaN(impliedProb) || !isFinite(impliedProb)) {
    return <div style={{ textAlign: 'center' }}>Invalid Probability</div>;
  }

  const probDifference = estimatedProbability - impliedProb;

  const kellyFraction = calculateKellyCriterion(
    decimalOdds,
    estimatedProbability
  );
  const recommendedBet = kellyFraction * bankroll;

  const isValueBet = probDifference > 0;
  const isKellyBet = kellyFraction > 0;

  return (
    <div
      style={{
        textAlign: 'center',
        fontWeight: isBestOdds ? 'bold' : 'normal',
        backgroundColor: isValueBet && isKellyBet ? '#d0f0c0' : 'transparent',
        padding: '8px',
      }}
    >
      {probDifference !== 0 && (
        <div
          style={{
            fontSize: '12px',
            color: probDifference > 0 ? 'green' : 'red',
          }}
        >
          {probDifference > 0 ? '⬆' : '⬇'}{' '}
          {Math.abs(probDifference * 100).toFixed(1)}%
        </div>
      )}

      <div
        style={{
          fontSize: '16px',
          marginBottom: '4px',
          color: isValueBet
            ? probDifference > 0
              ? 'green'
              : 'red'
            : 'black',
        }}
      >
        {odds}
      </div>

      <div style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>
        {(impliedProb * 100).toFixed(1)}%
      </div>

      {market === 'spreads' && teamOutcome.point !== undefined && (
        <div style={{ fontSize: '14px', color: '#888' }}>
          {teamOutcome.point > 0 ? '+' : ''}
          {teamOutcome.point}
        </div>
      )}

      {bankroll && isKellyBet && (
        <div style={{ fontSize: '12px', color: 'green', fontWeight: 'bold' }}>
          ${recommendedBet.toFixed(0)}
          <div style={{ fontSize: '12px', color: '#555' }}>
            ({(kellyFraction * 100).toFixed(3)}%)
          </div>
        </div>
      )}
    </div>
  );
};

const OddsPage: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedSoccerLeague, setSelectedSoccerLeague] = useState<
    string | null
  >(null);
  const [selectedMarket, setSelectedMarket] = useState<string>('h2h');
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(
    new Set(popularBookmakers.map((b) => b.key))
  );
  const [showSoccerLeagues, setShowSoccerLeagues] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bankroll, setBankroll] = useState(10000);

  const sportsQueries = useQueries({
    queries: ALL_SPORTS.map((sport) => ({
      queryKey: [
        'odds',
        sport.key,
        selectedMarket,
        Array.from(selectedBooks),
      ],
      queryFn: () =>
        fetchOdds(sport.key, selectedMarket).then((data) =>
          data.map((match: Match) => ({
            ...match,
            sport: sport.key,
            sportTitle: sport.title,
          }))
        ),
      enabled: !selectedSport || selectedSport === sport.key,
    })),
  });

  const isLoading = sportsQueries.some((query) => query.isLoading);
  const allOdds = sportsQueries
    .filter((query) => query.data)
    .flatMap((query) => query.data ?? []);

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
        : new Set(popularBookmakers.map((b) => b.key))
    );
  };

  const filterMatches = (matches: Match[]) => {
    if (!searchQuery) {
      return selectedSport
        ? matches.filter((match) => match.sport === selectedSport)
        : matches;
    }

    const query = searchQuery.toLowerCase();
    return matches.filter(
      (match) =>
        match.home_team.toLowerCase().includes(query) ||
        match.away_team.toLowerCase().includes(query)
    );
  };

  const isAllSelected = selectedBooks.size === popularBookmakers.length;
  const filteredMatches = filterMatches(allOdds);

  const selectedBookmakers = popularBookmakers.filter((b) =>
    selectedBooks.has(b.key)
  );

  const allBookmakersInMatches = selectedBookmakers.filter((bookmaker) =>
    filteredMatches.some((match) =>
      match.bookmakers.some((bm) => bm.key === bookmaker.key)
    )
  );

  const getBestOddsForTeam = (
    match: Match,
    team: string,
    market: string,
    bookmakers: BookmakerData[]
  ): number => {
    let bestDecimalOdds = -Infinity;

    bookmakers.forEach((bookmaker) => {
      const marketData = bookmaker.markets.find((m) => m.key === market);
      const outcome = marketData?.outcomes.find((o) => o.name === team);
      if (outcome?.price) {
        const decimalOdds = americanToDecimal(outcome.price);
        bestDecimalOdds = Math.max(bestDecimalOdds, decimalOdds);
      }
    });

    return bestDecimalOdds;
  };

  const calculateConsensusOdds = (match: Match, team: string): number => {
    let totalProbability = 0;
    let validBookmakerCount = 0;

    match.bookmakers
      .filter((bookmaker) => selectedBooks.has(bookmaker.key))
      .forEach((bookmaker) => {
        const marketData = bookmaker.markets.find(
          (m) => m.key === selectedMarket
        );
        if (marketData) {
          const probability = calculateConsensusImpliedProbability(
            marketData.outcomes,
            team
          );
          if (probability > 0) {
            totalProbability += probability;
            validBookmakerCount++;
          }
        }
      });

    return validBookmakerCount > 0
      ? totalProbability / validBookmakerCount
      : 0;
  };

  const columns = [
    {
      field: 'game',
      headerName: 'Game',
      width: 200,
      pinned: 'left',
      renderCell: (params) => params.value,
    },
    {
      field: 'team',
      headerName: 'Team',
      width: 150,
      pinned: 'left',
    },
    {
      field: 'estimatedProbability',
      headerName: 'Est. Prob.',
      width: 150,
      pinned: 'left',
      valueFormatter: (params) => {
        const value = params.value;
        return value != null && !isNaN(value)
          ? `${(value * 100).toFixed(1)}%`
          : 'N/A';
      },
    },
    ...allBookmakersInMatches.map((bookmaker) => ({
      field: bookmaker.key,
      headerName: bookmaker.title,
      width: 140,
      renderCell: (params) => {
        const data = params.row[bookmaker.key];
        if (!data) {
          return <div>N/A</div>;
        }
        return <OddsCell {...data} />;
      },
    })),
  ];

  const rows = [];

  filteredMatches.forEach((match: Match) => {
    const filteredBookmakers = match.bookmakers.filter((bookmaker) =>
      selectedBooks.has(bookmaker.key)
    );

    const bestHomeOdds = getBestOddsForTeam(
      match,
      match.home_team,
      selectedMarket,
      filteredBookmakers
    );
    const bestAwayOdds = getBestOddsForTeam(
      match,
      match.away_team,
      selectedMarket,
      filteredBookmakers
    );

    const [homeNormProb, awayNormProb] = normalizeImpliedProbabilities(
      calculateConsensusOdds(match, match.home_team),
      calculateConsensusOdds(match, match.away_team)
    );

    // Home team row
    const homeRow = {
      id: match.id + '_home',
      game: (
        <Link
          to={`/match/${match.sport}/${match.id}`}
          style={{ color: '#00f' }}
        >
          {match.home_team} vs {match.away_team}
        </Link>
      ),
      team: match.home_team,
      estimatedProbability: homeNormProb,
    };

    // Away team row
    const awayRow = {
      id: match.id + '_away',
      game: '', // Empty for the away team
      team: match.away_team,
      estimatedProbability: awayNormProb,
    };

    // For each bookmaker
    filteredBookmakers.forEach((bookmaker) => {
      // For home team
      homeRow[bookmaker.key] = {
        bookmaker: bookmaker,
        team: match.home_team,
        market: selectedMarket,
        isBestOdds:
          getBestOddsForTeam(match, match.home_team, selectedMarket, [
            bookmaker,
          ]) === bestHomeOdds,
        estimatedProbability: homeNormProb,
        bankroll: bankroll,
      };

      // For away team
      awayRow[bookmaker.key] = {
        bookmaker: bookmaker,
        team: match.away_team,
        market: selectedMarket,
        isBestOdds:
          getBestOddsForTeam(match, match.away_team, selectedMarket, [
            bookmaker,
          ]) === bestAwayOdds,
        estimatedProbability: awayNormProb,
        bankroll: bankroll,
      };
    });

    rows.push(homeRow);
    rows.push(awayRow);
  });

  return (
    <div style={{ marginTop: '16px', color: 'black' }}>
      {/* Search Bar and Bankroll Input */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <TextField
          label="Search across all sports and leagues..."
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <Search className="text-gray-400" size={20} />,
          }}
          style={{ width: '100%', maxWidth: '400px' }}
        />
      </div>

      <div
        style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ paddingBottom: '8px', fontWeight: 'bold' }}>
            Bankroll (Kelly Criterion)
          </h2>
          <BankrollInput bankroll={bankroll} setBankroll={setBankroll} />
        </div>
      </div>

      {/* Sports List */}
      <div
        style={{
          overflowX: 'auto',
          marginBottom: '16px',
          borderBottom: '1px solid #00f',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '0 16px 8px',
          }}
        >
          {MAIN_SPORTS.map((sport) => (
            <Button
              key={sport.key}
              onClick={() => handleSportClick(sport.key)}
              style={{
                borderBottom:
                  selectedSport === sport.key ? '2px solid #00f' : 'none',
                fontSize: '24px',
                marginRight: '16px',
              }}
            >
              {sport.title}
            </Button>
          ))}
          <Button
            onClick={() => handleSportClick('soccer')}
            style={{
              borderBottom: showSoccerLeagues ? '2px solid #00f' : 'none',
              fontSize: '24px',
            }}
          >
            Soccer
          </Button>
        </div>
      </div>

      {/* Soccer Leagues */}
      {showSoccerLeagues && (
        <div
          style={{
            overflowX: 'auto',
            marginBottom: '16px',
            borderBottom: '1px solid #00f',
          }}
        >
          <div style={{ display: 'flex', padding: '0 16px 8px' }}>
            {SOCCER_LEAGUES.map((league) => (
              <Button
                key={league.key}
                onClick={() => handleSoccerLeagueClick(league.key)}
                style={{
                  borderBottom:
                    selectedSoccerLeague === league.key ? '2px solid #00f' : 'none',
                  fontSize: '18px',
                  marginRight: '16px',
                }}
              >
                {league.title}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Market Selection and Bookmaker Filters */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid #00f',
          }}
        >
          {marketOptions.map((option) => (
            <Button
              key={option.value}
              onClick={() => setSelectedMarket(option.value)}
              style={{
                borderBottom:
                  selectedMarket === option.value ? '2px solid #00f' : 'none',
                fontSize: '18px',
                marginRight: '16px',
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div
          style={{
            marginBottom: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
          }}
        >
          <Button
            onClick={handleSelectAllBooks}
            variant={isAllSelected ? 'contained' : 'outlined'}
            color="primary"
          >
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </Button>
          {popularBookmakers.map((bookmaker) => (
            <FormControlLabel
              key={bookmaker.key}
              control={
                <Checkbox
                  checked={selectedBooks.has(bookmaker.key)}
                  onChange={() => handleBookToggle(bookmaker.key)}
                  color="primary"
                />
              }
              label={bookmaker.title}
            />
          ))}
        </div>

        {/* Loading State */}
        {isLoading && <p style={{ textAlign: 'center' }}>Loading odds...</p>}

        {/* Main Content */}
        {filteredMatches.length > 0 && (
          <div style={{ height: '70vh', width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              disableColumnMenu
              hideFooter
              rowHeight={100}
              getRowClassName={(params) =>
                params.row.id.includes('_home') ? 'home-row' : 'away-row'
              }
              componentsProps={{
                row: {
                  style: { maxHeight: '200px' },
                },
              }}
            />
          </div>
        )}

        {filteredMatches.length === 0 && !isLoading && (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '16px' }}>
            No matches found. Try adjusting your search or filters.
          </p>
        )}
      </div>
    </div>
  );
};

export default OddsPage;
