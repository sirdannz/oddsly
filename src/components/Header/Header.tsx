import React from 'react';
import './header.css';
import Logout from '../Account/Logout';
import { Link } from 'react-router-dom';
import useAuth from '../../authorization/useAuth'; // Import the authentication hook

/*
interface HeaderProps {
  toggleNavbar: () => void;
}
  */

const Header: React.FC/*<HeaderProps>*/ = () => {
  const { user } = useAuth();


  return (
    <header className="header flex w-screen min-h-[90px] min-h-[8vh] justify-center px-4 py-1 relative z-20">
      <nav className="flex justify-center w-[95%] max-w-[1200px] items-center">
        <ul className="flex flex-col md:flex-row items-center justify-between w-full max-w-[800px]">

          <li className="flex-1 flex justify-start"></li>
          
          <li className="flex-1 flex justify-center">
            <Link to="/" className="text-8xl font-bold text-center text-neon pb-4 md:pb-0">
              Oddsly
            </Link>
          </li>

          <li className="flex-1 flex justify-end pb-4 md:pb-0">
            {user && <Logout />} {/* Show Logout only if user is signed in */}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
