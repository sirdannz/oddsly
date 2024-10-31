import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { fetchBothMatchDetails } from '../../services/api';
import { ArrowLeft } from 'lucide-react';
// import { PlayerProps } from '../Player Props/PlayerProps';
import { DataGrid, GridRenderCellParams } from '@mui/x-data-grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';

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

interface GridRow {
  id: string;
  team: string;
  [bookmakerKey: string]: string | number | undefined;
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#200589',
    },
  },
});

const MarketTable: React.FC<{
  details: MatchDetails;
  marketType: string;
  title: string;
}> = ({ details, marketType, title }) => {
  const validBookmakers = details.bookmakers.filter(
    bookmaker =>
      bookmaker.markets.some(
        market =>
          market.key === marketType &&
          market.outcomes &&
          market.outcomes.length > 0
      )
  );

  if (validBookmakers.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-500">
          No {title.toLowerCase()} odds available for this match.
        </p>
      </div>
    );
  }

  function createRow(team: string): GridRow {
    const row: GridRow = {
      id: team,
      team,
    };

    validBookmakers.forEach(bookmaker => {
      const marketData = bookmaker.markets.find(m => m.key === marketType);
      const outcome = marketData?.outcomes.find(o => o.name === team);
      if (outcome) {
        if (marketType === 'spreads' && outcome.point !== undefined) {
          row[bookmaker.key] = `${outcome.price} (${
            outcome.point > 0 ? '+' : ''
          }${outcome.point})`;
        } else {
          row[bookmaker.key] = outcome.price > 0 ? `+${outcome.price}` : outcome.price;
        }
      } else {
        row[bookmaker.key] = '-';
      }
    });

    return row;
  }

  const rows: GridRow[] = [
    createRow(details.home_team),
    createRow(details.away_team),
  ];

  const columns = [
    {
      field: 'team',
      headerName: 'Team',
      width: 150,
    },
    ...validBookmakers.map(bookmaker => ({
      field: bookmaker.key,
      headerName: bookmaker.title,
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        const value = params.value;
        return <div>{value}</div>;
      },
    })),
  ];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div style={{ height: 200, width: '100%' }}>
        <ThemeProvider theme={theme}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[2]}
            hideFooter
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                borderRight: '1px solid #e0e0e0',
                padding: '8px',
              },
              '& .MuiDataGrid-columnHeaders': {
                borderBottom: '2px solid #200589',
                backgroundColor: '#f8f8ff',
                '& .MuiDataGrid-columnHeader': {
                  borderRight: '2px solid #200589',
                  borderTop: '2px solid #200589',
                  '&:first-of-type': {
                    borderLeft: '2px solid #200589',
                  },
                },
              },
              '& .MuiDataGrid-columnHeader': {
                padding: '8px',
                color: '#200589',
                fontWeight: 'bold',
                backgroundColor: '#f8f8ff',
              },
              '& .MuiDataGrid-pinnedColumns': {
                backgroundColor: '#ffffff',
                boxShadow: '2px 0 4px rgba(32, 5, 137, 0.1)',
              },
              '& .MuiDataGrid-columnSeparator': {
                color: '#200589',
              },
              '& .MuiDataGrid-menuIcon': {
                color: '#200589',
              },
              '& .MuiDataGrid-sortIcon': {
                color: '#200589',
              },
            }}
          />
        </ThemeProvider>
      </div>
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
    enabled: !!sportKey && !!matchId,
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
        <MarketTable details={details} marketType="h2h" title="Moneyline" />

        <MarketTable details={details} marketType="spreads" title="Spread" />

        {/*
        <PlayerProps sportKey={sportKey!} matchId={matchId!} />
        */}
      </div>
    </div>
  );
};

export default MatchDetailsPage;
