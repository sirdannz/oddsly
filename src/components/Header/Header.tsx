import React from 'react';
import Logout from '../Account/Logout';
import { Link } from 'react-router-dom';
import useAuth from '../../authorization/useAuth';

/* ++++++++++ ICONS ++++++++++ */
import { Settings } from 'lucide-react';

/* ++++++++++ STYLES ++++++++++ */
import './header.css';

/*
interface HeaderProps {
  toggleNavbar: () => void;
}
  */

const Header: React.FC = () => {
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

          <li className="flex-1 flex justify-end items-center space-x-4 pb-4 md:pb-0">
            {user && (
              <>
                <Link
                  to="/profile"
                  className="text-gray-600 hover:text-neon transition-all duration-300"
                >
                  <Settings size={24} />
                </Link>
                <Logout />
              </>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
