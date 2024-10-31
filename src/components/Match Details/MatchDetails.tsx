import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { fetchBothMatchDetails } from '../../services/api';
import { ArrowLeft } from 'lucide-react';
import { PlayerProps } from '../Player Props/PlayerProps';

interface Outcome {
  name: string;
  description?: string;
  price: number;
  point?: number;
}

interface Market {
  key: string;
  last_update: string;
  outcomes: Outcome[];
}

interface Bookmaker {
  key: string;
  title: string;
  markets: Market[];
}

interface MatchDetails {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

interface OddsCellProps {
  bookmaker: Bookmaker;
  team: string;
  market: string;
}

const OddsCell: React.FC<OddsCellProps> = ({ bookmaker, team, market }) => {

  const marketData = bookmaker.markets.find(m => m.key === market);
  const outcome = marketData?.outcomes.find(o => o.name === team);

  if (!outcome) return <td className="p-2 text-center">N/A</td>;

  const odds = outcome.price;
  
  return (
    <td className="p-2 text-center">
      <div>{odds}</div>
      {market === 'spreads' && outcome.point !== undefined && (
        <div className="text-gray-400 text-sm">
          {outcome.point > 0 ? '+' : ''}{outcome.point}
        </div>
      )}
    </td>
  );
};

const MarketTable: React.FC<{
  details: MatchDetails;
  marketType: string;
  title: string;
}> = ({ details, marketType, title }) => {
  const validBookmakers = details.bookmakers.filter(
    bookmaker => bookmaker.markets.some(market => 
      market.key === marketType && 
      market.outcomes && 
      market.outcomes.length > 0
    )
  );

  if (validBookmakers.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-500">No {title.toLowerCase()} odds available for this match.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto mb-8">
      <h2 className="text-2xl font-bold mb-4">
        {title}
      </h2>
      
      <table className="min-w-full border-2 border-neon bg-temp">
        <thead>
          <tr>
            <th className="p-2 border-b border-neon text-left sticky left-0 bg-temp">
              Game
            </th>
            <th className="p-2 border-b border-neon text-left sticky left-[120px] bg-temp">
              Team
            </th>
            {validBookmakers.map(bookmaker => (
              <th key={bookmaker.key} className="p-2 border-b border-neon text-center">
                {bookmaker.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-neon">
            <td rowSpan={2} className="p-2 text-left border-r-4 border-neon sticky left-0 bg-temp">
              <div className="font-semibold text-sm text-gray-500">
                {details.sport_title}
              </div>
              <div className="text-neon">
                {details.home_team} vs {details.away_team}
              </div>
            </td>
            <td className="p-2 sticky left-[120px] bg-temp">
              {details.home_team}
            </td>
            {validBookmakers.map(bookmaker => (
              <OddsCell
                key={`${bookmaker.key}-home`}
                bookmaker={bookmaker}
                team={details.home_team}
                market={marketType}
              />
            ))}
          </tr>
          <tr className="border-b-4 border-neon">
            <td className="p-2 sticky left-[120px] bg-temp">
              {details.away_team}
            </td>
            {validBookmakers.map(bookmaker => (
              <OddsCell
                key={`${bookmaker.key}-away`}
                bookmaker={bookmaker}
                team={details.away_team}
                market={marketType}
              />
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const MatchDetailsPage = () => {
  const { sportKey, matchId } = useParams<{ sportKey: string; matchId: string }>();
  
  const { data: matchDetails, isLoading, error } = useQuery({
    queryKey: ['matchDetails', sportKey, matchId],
    queryFn: async () => {
      try {
        const response = await fetchBothMatchDetails(sportKey!, matchId!);
        console.log('API Response:', response);
        return response;
      } catch (error) {
        console.error('Error fetching match details:', error);
        throw error;
      }
    },
    enabled: !!sportKey && !!matchId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <div className="animate-pulse text-center">Loading match details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="text-red-500 text-center">Error loading match details</div>
      </div>
    );
  }

  const details = matchDetails as MatchDetails;

  return (
    <div className="min-h-screen p-8">
      <Link to="/" className="flex items-center gap-2 text-neon mb-6 hover:underline">
        <ArrowLeft size={20} />
        Back to all matches
      </Link>
      
      <h1 className="text-4xl font-bold mb-6">
        {details.home_team} vs {details.away_team}
      </h1>
      
      <div className="space-y-8">
        <MarketTable 
          details={details}
          marketType="h2h"
          title="Moneyline"
        />
        
        <MarketTable 
          details={details}
          marketType="spreads"
          title="Spread"
        />

        <PlayerProps 
          sportKey={sportKey!}
          matchId={matchId!}
        />

      </div>
    </div>
  );
};

export default MatchDetailsPage;