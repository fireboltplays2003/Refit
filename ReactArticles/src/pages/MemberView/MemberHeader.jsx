import React from 'react';
import { NavLink } from 'react-router-dom';

function MemberHeader() {
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
                  About us
                </NavLink>
              </li>
              <li>
                <NavLink
                  to='/contact'
                  className={({ isActive }) =>
                    isActive ? 'menu-item active' : 'menu-item'
                  }
                >
                  Contact us
                </NavLink>
              </li>
              <li>
                <NavLink
                  to='/registerMembership'
                  className={({ isActive }) =>
                    isActive ? 'menu-item active' : 'menu-item'
                  }
                  end
                >
                  RegisterMembership
                </NavLink>
              </li>
              <li>
                <NavLink
                  to='/bookView'
                  className={({ isActive }) =>
                    isActive ? 'menu-item active' : 'menu-item'
                  }
                  end
                >
                  BookView
                </NavLink>
              </li>
              <li>
                <NavLink
                  to='/membershipView'
                  className={({ isActive }) =>
                    isActive ? 'menu-item active' : 'menu-item'
                  }
                  end
                >
                  Membership
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default MemberHeader;
