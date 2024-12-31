import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { styles } from '../styles';
import { navLinks } from '../constants';
import { logo, menu, close } from '../assets';

const Navbar = () => {
  const [active, setactive] = useState('')
  const [toggle , settoggle ] = useState(false);

  return (
    <nav className={'${styles.paddingX} w-full flex items-center py-5 fixed top-0 z-20 bg-primary'}>
      <div className='w-full flex justify-between items-center max-w-7xl mx-auto'>
        <Link to ="/" className='flex items-center gap-2' onClick={ () => {setActive(""); window.scrollTo(0,0)}}>
          <img src={logo} alt='logo' className='w-9 h-9 object-contain'/>
          <p className='text-white text-[18px] font-bold cursor-pointer'>Richie <span className='sm:block hidden'>| Exploring since 2000</span></p>
        </Link>
        <ul className='list-none hidden sm:flex felx-row gap-10'>
          {navLinks.map((link) => (
            <li 
            key={link.id} 
            className={`${active === link.title? 'text-white': 'text-secondary'} hover:text-white text-[18px] font-medium curson-pointer`}
            onClick={() => setactive(link.title)}
            >
              <a href={`#${link.id}`}>{link.title}</a>
            </li>
          ))}
        </ul>

        <div className='sm:hidden flex flex-1 justify-end items-center'>
          <img 
          src={menu}
          alt='menu'
          className='w-[28px] h-[28px] object-contain cursor-pointer'
          onClick={() => settoggle(!toggle)} />
        </div>
      </div>
    </nav>
  )
}

export default Navbar