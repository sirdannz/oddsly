import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

interface Bookmaker {
  key: string;
  title: string;
  markets: {
    key: string;
    outcomes: { name: string; price: number; point?: number }[];
  }[];
}

interface MatchDetailsTableProps {
  bookmakers: Bookmaker[];
  marketType: string;
}

const MatchDetailsTable: React.FC<MatchDetailsTableProps> = ({ bookmakers, marketType }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Bookmaker</TableCell>
          <TableCell align="center">Odds</TableCell>
          <TableCell align="center">Points</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {bookmakers.map((bookmaker) => {
          const market = bookmaker.markets.find((m) => m.key === marketType);
          return market ? (
            <TableRow key={bookmaker.key}>
              <TableCell>{bookmaker.title}</TableCell>
              <TableCell align="center">
                {market.outcomes.map((outcome) => outcome.price).join(', ')}
              </TableCell>
              <TableCell align="center">
                {market.outcomes.map((outcome) => outcome.point || '-').join(', ')}
              </TableCell>
            </TableRow>
          ) : null;
        })}
      </TableBody>
    </Table>
  </TableContainer>
);

export default MatchDetailsTable;
