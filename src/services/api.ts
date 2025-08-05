import axios from 'axios';

const API_BASE_URL = 'https://api.the-odds-api.com/v4';
const API_KEY = import.meta.env.VITE_ODDS_API_KEY;

const SUPPORTED_PLAYER_PROP_SPORTS = [
  'americanfootball_nfl',
  'americanfootball_ncaaf',
  'baseball_mlb',
  'basketball_nba',
  'icehockey_nhl',
  'mma_mixed_martial_arts',
  'tennis_atp_french_open',
  'tennis_wta_french_open'
];

const PLAYER_PROP_MARKETS = [
  // NFL / NCAAF
  'player_pass_yds',
  'player_pass_tds',
  'player_rush_yds',
  'player_receptions',
  'player_reception_yds',
  'player_rush_attempts',
  'player_pass_completions',
  'player_pass_interceptions',
  'player_tds_over',
  'player_1st_td',
  'player_anytime_td',

  // MLB
  'player_hits',
  'player_home_runs',
  'player_strikeouts',
  'player_total_bases',
  'player_rbis',
  'player_runs_scored',
  'player_pitching_outs',
  'player_walks',

  // NBA
  'player_points',
  'player_rebounds',
  'player_assists',
  'player_threes_made',
  'player_blocks',
  'player_steals',
  'player_turnovers',
  'player_pras',  // Points + Rebounds + Assists
  'player_par',   // Points + Assists + Rebounds
  'player_pra',   // Points + Rebounds + Assists

  // NHL
  'player_points',
  'player_shots_on_goal',
  'player_assists',
  'player_goals',
  'player_saves',

  // MMA
  'fighter_significant_strikes',
  'fighter_takedowns',

  // Tennis
  'player_aces',
  'player_double_faults',
  'player_total_games_won',
  'player_total_sets_won'
] as const;

type PlayerPropMarket = (typeof PLAYER_PROP_MARKETS)[number];
const defaultMarkets: PlayerPropMarket[] = [...PLAYER_PROP_MARKETS];

export const fetchSports = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/sports`, {
      params: { apiKey: API_KEY },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching sports:', error);
    throw error;
  }
};

export const fetchBookmakers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/bookmakers`, {
      params: { apiKey: API_KEY },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching bookmakers:', error);
    throw error;
  }
};

export const fetchOdds = async (sport: string, market: string = 'h2h') => {
  if (!SUPPORTED_PLAYER_PROP_SPORTS.includes(sport)) {
    console.warn(`fetchOdds not supported for: ${sport}`);
    return [];
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/sports/${sport}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: 'us,us2',
        markets: market,
        oddsFormat: 'american'
      },
    });
    const filteredOdds = response.data.filter((bookmaker: any) =>
      ['underdogfantasy', 'prizepicks'].includes(bookmaker.key)
    );
    return filteredOdds;
  } catch (error) {
    console.error('Error fetching odds:', error);
    throw error;
  }
};

export const fetchMatchDetails = async (sport: string, matchId: string) => {
  if (!SUPPORTED_PLAYER_PROP_SPORTS.includes(sport)) {
    console.warn(`fetchMatchDetails not supported for: ${sport}`);
    return [];
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/sports/${sport}/events/${matchId}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: 'us,us2',
        markets: PLAYER_PROP_MARKETS.join(','),
        oddsFormat: 'american'
      },
    });
    const filteredOdds = response.data.filter((bookmaker: any) =>
      ['underdogfantasy', 'prizepicks'].includes(bookmaker.key)
    );
    return filteredOdds;
  } catch (error) {
    console.error('Error fetching match details:', error);
    throw error;
  }
};

export const fetchBothMatchDetails = async (sport: string, matchId: string) => {
  if (!SUPPORTED_PLAYER_PROP_SPORTS.includes(sport)) {
    console.warn(`fetchBothMatchDetails not supported for: ${sport}`);
    return [];
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/sports/${sport}/events/${matchId}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: 'us,us2',
        markets: 'h2h,spreads',
        oddsFormat: 'american'
      }
    });
    const filteredOdds = response.data.filter((bookmaker: any) =>
      ['underdogfantasy', 'prizepicks'].includes(bookmaker.key)
    );
    return filteredOdds;
  } catch (error) {
    console.error('Error fetching match details:', error);
    throw error;
  }
};

export const fetchPlayerProps = async (
  sport: string,
  matchId: string,
  markets: PlayerPropMarket[] = defaultMarkets,
  region: string = 'us,us2',
) => {
  if (!SUPPORTED_PLAYER_PROP_SPORTS.includes(sport)) {
    console.warn(`fetchPlayerProps not supported for: ${sport}`);
    return [];
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/sports/${sport}/events/${matchId}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: region,
        markets: markets.join(','),
        oddsFormat: 'american'
      }
    });
    const filteredOdds = response.data.filter((bookmaker: any) =>
      ['underdogfantasy', 'prizepicks'].includes(bookmaker.key)
    );
    return filteredOdds;
  } catch (error) {
    console.error('Error fetching player props:', error);
    throw error;
  }
};
