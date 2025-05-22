import React from 'react';
import { NavLink } from 'react-router-dom';

function Header() {
  return (
    <header>
      <div className='container'>
        <div className='header__wrap'>
          <nav>
            <ul className='menu'>
              <li>
                <NavLink
                  to='/'
                  className={({ isActive }) =>
                    isActive ? 'menu-item active' : 'menu-item'
                  }
                  end
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink
                  to='/about'
                  className={({ isActive }) =>
                    isActive ? 'menu-item active' : 'menu-item'
                  }
                >
                  About
                </NavLink>
              </li>
              <li>
                <NavLink
                  to='/contact'
                  className={({ isActive }) =>
                    isActive ? 'menu-item active' : 'menu-item'
                  }
                >
                  Contact
                </NavLink>
              </li>
              <li>
                <NavLink
                  to='/test'
                  className={({ isActive }) =>
                    isActive ? 'menu-item active' : 'menu-item'
                  }
                  end
                >
                  Test
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
