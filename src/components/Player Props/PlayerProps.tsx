import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchPlayerProps } from '../../services/api';

interface PlayerPropOutcome {
  name: string;
  description: string;
  price: number;
  point?: number;
}

interface PlayerPropMarket {
  key: string;
  last_update: string;
  outcomes: PlayerPropOutcome[];
}

interface PlayerPropBookmaker {
  key: string;
  title: string;
  markets: PlayerPropMarket[];
}

const PROP_TYPE_GROUPS = {
  'Passing': ['player_pass_tds', 'player_pass_yds', 'player_pass_attempts', 'player_pass_completions', 'player_pass_interceptions'],
  'Rushing': ['player_rush_yds', 'player_rush_attempts', 'player_rush_longest'],
  'Receiving': ['player_receptions', 'player_reception_yds', 'player_reception_longest'],
  'Scoring': ['player_pass_rush_reception_tds', 'player_anytime_td', 'player_1st_td', 'player_last_td'],
  'Defense': ['player_sacks', 'player_solo_tackles', 'player_tackles_assists']
} as const;

const PROP_DISPLAY_NAMES: Record<string, string> = {
  'player_pass_tds': 'Passing Touchdowns',
  'player_pass_yds': 'Passing Yards',
  'player_pass_attempts': 'Pass Attempts',
  'player_pass_completions': 'Pass Completions',
  'player_pass_interceptions': 'Interceptions',
  'player_rush_yds': 'Rushing Yards',
  'player_rush_attempts': 'Rush Attempts',
  'player_rush_longest': 'Longest Rush',
  'player_receptions': 'Receptions',
  'player_reception_yds': 'Receiving Yards',
  'player_reception_longest': 'Longest Reception',
  'player_pass_rush_reception_tds': 'Total Touchdowns',
  'player_anytime_td': 'Anytime Touchdown',
  'player_1st_td': 'First Touchdown',
  'player_last_td': 'Last Touchdown',
  'player_sacks': 'Sacks',
  'player_solo_tackles': 'Solo Tackles',
  'player_tackles_assists': 'Tackles + Assists'
};

const PlayerPropCell: React.FC<{
  bookmaker: PlayerPropBookmaker;
  marketKey: string;
  playerName: string;
}> = ({ bookmaker, marketKey, playerName }) => {
  const market = bookmaker.markets.find(m => m.key === marketKey);
  const overOutcome = market?.outcomes.find(o => 
    o.description === playerName && o.name === "Over"
  );
  const underOutcome = market?.outcomes.find(o => 
    o.description === playerName && o.name === "Under"
  );

  if (!overOutcome && !underOutcome) return (
    <td className="p-2 text-center" colSpan={2}>-</td>
  );

  return (
    <>
      <td className="p-2 text-center border-r border-neon">
        <div className={`text-neon ${overOutcome?.price ? 'text-green-400' : ''}`}>
          {overOutcome?.price || '-'}
        </div>
      </td>
      <td className="p-2 text-center">
        <div className={`text-neon ${underOutcome?.price ? 'text-red-400' : ''}`}>
          {underOutcome?.price || '-'}
        </div>
      </td>
    </>
  );
};

interface PlayerPropsTableProps {
  sportKey: string;
  matchId: string;
  propType: string;
  markets: readonly string[];
}

const PlayerPropsTable: React.FC<PlayerPropsTableProps> = ({ sportKey, matchId, propType, markets }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['playerProps', sportKey, matchId, propType],
    queryFn: () => fetchPlayerProps(sportKey, matchId, markets as any[]),
    enabled: !!sportKey && !!matchId
  });

  if (isLoading) return <div className="animate-pulse">Loading {propType} props...</div>;
  if (!data?.bookmakers?.length) return null;

  // Get unique players and their props
  const playerPropMap = new Map<string, Map<string, number>>();
  
  data.bookmakers.forEach((bookmaker: PlayerPropBookmaker) => {
    bookmaker.markets.forEach((market: PlayerPropMarket) => {
      market.outcomes.forEach((outcome: PlayerPropOutcome) => {
        if (!playerPropMap.has(outcome.description)) {
          playerPropMap.set(outcome.description, new Map());
        }
        const playerProps = playerPropMap.get(outcome.description)!;
        if (!playerProps.has(market.key)) {
          playerProps.set(market.key, outcome.point ?? 0);
        }
      });
    });
  });

  if (playerPropMap.size === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">{propType} Props</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border-2 border-neon bg-temp">
          <thead>
            <tr className=''>
              <th className="p-2 border-b border-neon text-left sticky left-0 bg-temp">Player</th>
              <th className="p-2 border-b border-neon text-left sticky left-[150px] bg-temp">Prop</th>
              <th className="p-2 border-b border-neon text-center sticky left-[300px] bg-temp">Line</th>
              {data.bookmakers.map((bookmaker: PlayerPropBookmaker) => (
                <th key={bookmaker.key} className="p-2 border-b border-neon text-center" colSpan={2}>
                  {bookmaker.title}
                  <div className="grid grid-cols-2 text-sm mt-1">
                    <div className="text-green-400">Over</div>
                    <div className="text-red-400">Under</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(playerPropMap.entries()).flatMap(([playerName, props]) =>
              Array.from(props.entries()).map(([marketKey, line]) => (
                <tr key={`${playerName}-${marketKey}`} className="border-b border-neon">
                  <td className="p-2 sticky left-0 bg-temp">{playerName}</td>
                  <td className="p-2 sticky left-[150px] bg-temp">{PROP_DISPLAY_NAMES[marketKey]}</td>
                  <td className="p-2 text-center sticky left-[300px] bg-temp">
                    {line}
                  </td>
                  {data.bookmakers.map((bookmaker: PlayerPropBookmaker) => (
                    <PlayerPropCell
                      key={bookmaker.key}
                      bookmaker={bookmaker}
                      marketKey={marketKey}
                      playerName={playerName}
                    />
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const PlayerProps: React.FC<{
  sportKey: string;
  matchId: string;
}> = ({ sportKey, matchId }) => {
  return (
    <div className="space-y-8">
      {Object.entries(PROP_TYPE_GROUPS).map(([groupName, markets]) => (
        <PlayerPropsTable
          key={groupName}
          sportKey={sportKey}
          matchId={matchId}
          propType={groupName}
          markets={markets}
        />
      ))}
    </div>
  );
};