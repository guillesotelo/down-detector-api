import React, { useContext, useEffect, useState } from 'react'
import LoginIcon from '../../assets/icons/login-icon.svg'
import UserIcon from '../../assets/icons/user-icon.svg'
import DDLogo from '../../assets/logos/down-logo.png'
import { AppContext, AppProvider } from '../../AppContext'
import { useHistory, useLocation } from 'react-router-dom'
import Day from '../../assets/icons/day.svg'
import Night from '../../assets/icons/night.svg'
import Menu from '../../assets/icons/menu.svg'
import Dashboard from '../../assets/icons/dashboard.svg'
import History from '../../assets/icons/history.svg'
import AppLogs from '../../assets/icons/logs.svg'
import Settings from '../../assets/icons/settings.svg'
import Help from '../../assets/icons/help.svg'
import Api from '../../assets/icons/api.svg'
import Users from '../../assets/icons/users.svg'
import Subscriptions from '../../assets/icons/subscribe.svg'
import Tooltip from '../Tooltip/Tooltip'
import Sidebar from '../Sidebar/Sidebar'
import { getUser } from '../../helpers'
import { APP_VERSION } from '../../constants/app'

export default function Header() {
  const [barWidth, setBarWidth] = useState('0%')
  const [openMenu, setOpenMenu] = useState(false)
  const {
    isLoggedIn,
    item,
    setItem,
    darkMode,
    setDarkMode,
    headerLoading,
    setHeaderLoading,
    isMobile
  } = useContext(AppContext)
  const history = useHistory()
  const location = useLocation()

  useEffect(() => {
    const menuListener = () => window.addEventListener('mouseup', (e: MouseEvent) => {
      try {
        const className = (e.target as HTMLElement).className
        if (className && !className.includes('menu')) setOpenMenu(false)
      } catch (err) {
        console.error(err)
      }
    })
    menuListener()

    return window.removeEventListener('mouseup', menuListener)
  }, [])

  useEffect(() => {
    if (headerLoading) renderHeaderLoader()
  }, [headerLoading])

  const renderHeaderLoader = () => {
    Array.from({ length: 110 }).forEach((_, i) => {
      setTimeout(() => setBarWidth(`${i < 109 ? i : 0}%`), i * 10)
    })
  }

  const userOptions = () => {
    setItem('')
    if (isLoggedIn) history.push('/account')
    else history.push('/login')
  }

  const gotoAbout = () => {
    if (location.pathname.includes('about')) return history.push('/')
    setItem('/about')
    history.push('/about')
  }

  const goToAccount = () => {
    const user = getUser()
    let page = user.token ? '/account' : '/login'
    history.push(page)
    setItem(page)
  }

  const switchMode = () => {
    setDarkMode(!darkMode)
    localStorage.setItem('preferredMode', JSON.stringify(!darkMode))
    const event = new Event('darkMode')
    document.dispatchEvent(event)
  }

  const renderMobile = () => {
    return (
      <div className={`header__container${darkMode ? '--dark' : ''}`}>
        <div className="header__col">
          <img
            src={UserIcon}
            onClick={goToAccount}
            alt='My Account'
            className={`header__login-icon${darkMode ? '--dark' : ''}`}
            style={{ padding: 0 }}
            draggable={false}
          />
        </div>
        <div className="header__col">
          {process.env.NODE_ENV === 'development' ? <p className='header__dev-label' >DEVELOPMENT</p> :
            <img
              src={DDLogo}
              onClick={gotoAbout}
              alt={location.pathname.includes('about') ? 'Show Systems' : 'About {process.env.APP_NAME}'}
              className={`header__down-icon${darkMode ? '--dark' : ''}`}
              style={{ padding: 0 }}
              draggable={false}
            />
          }
        </div>
        <div className="header__col">
          {isLoggedIn ?
            <img
              src={Menu}
              onClick={() => setOpenMenu(!openMenu)}
              alt='Menu'
              className={`header__menu${darkMode ? '--dark' : ''}`}
              draggable={false}
            />
            :
            <img
              src={darkMode ? Day : Night}
              onClick={() => {
                localStorage.setItem('preferredMode', JSON.stringify(!darkMode))
                setDarkMode(!darkMode)
              }}
              alt="Switch Mode"
              className={`header__menu${darkMode ? '--dark' : ''}`}
              draggable={false}
            />
          }
        </div>
        <div className="header__loading" style={{ width: barWidth }} />
        <div className={`header__menu-container${openMenu ? '--open' : ''}${darkMode ? '--dark' : ''}`}>
          <div
            className="header__menu-item"
            style={{
              marginTop: '1.5rem',
              backgroundColor: item === '/' ? darkMode ? 'rgb(57, 57, 57)' : 'rgb(237, 237, 237)' : ''
            }}
            onClick={() => {
              history.push('/')
              setItem('/')
              setOpenMenu(!openMenu)
            }}>
            <img src={Dashboard} alt="Dashboard" draggable={false} className={`header__menu-item-svg${darkMode ? '--dark' : ''}`} />
            <p className="header__menu-item-label">Dashboard</p>
          </div>
          <div
            className="header__menu-item"
            style={{
              backgroundColor: item === '/history' ? darkMode ? 'rgb(57, 57, 57)' : 'rgb(237, 237, 237)' : ''
            }}
            onClick={() => {
              history.push('/history')
              setItem('/history')
              setOpenMenu(!openMenu)
            }}>
            <img src={History} alt="History" draggable={false} className={`header__menu-item-svg${darkMode ? '--dark' : ''}`} />
            <p className="header__menu-item-label">History</p>
          </div>

          <div
            className="header__menu-item"
            style={{
              backgroundColor: item === '/systems' ? darkMode ? 'rgb(57, 57, 57)' : 'rgb(237, 237, 237)' : ''
            }}
            onClick={() => {
              history.push('/systems')
              setItem('/systems')
              setOpenMenu(!openMenu)
            }}>
            <img src={Api} alt="Systems" draggable={false} className={`header__menu-item-svg${darkMode ? '--dark' : ''}`} />
            <p className="header__menu-item-label">Systems</p>
          </div>
          <div
            className="header__menu-item"
            style={{
              backgroundColor: item === '/users' ? darkMode ? 'rgb(57, 57, 57)' : 'rgb(237, 237, 237)' : ''
            }}
            onClick={() => {
              history.push('/users')
              setItem('/users')
              setOpenMenu(!openMenu)
            }}>
            <img src={Users} alt="Users" draggable={false} className={`header__menu-item-svg${darkMode ? '--dark' : ''}`} />
            <p className="header__menu-item-label">Users</p>
          </div>

          <div
            className="header__menu-item"
            style={{
              backgroundColor: item === '/applogs' ? darkMode ? 'rgb(57, 57, 57)' : 'rgb(237, 237, 237)' : ''
            }}
            onClick={() => {
              history.push('/applogs')
              setItem('/applogs')
              setOpenMenu(!openMenu)
            }}>
            <img src={AppLogs} alt="App Logs" draggable={false} className={`header__menu-item-svg${darkMode ? '--dark' : ''}`} />
            <p className="header__menu-item-label">App Logs</p>
          </div>
          <div
            className="header__menu-item"
            style={{
              backgroundColor: item === '/subscriptions' ? darkMode ? 'rgb(57, 57, 57)' : 'rgb(237, 237, 237)' : ''
            }}
            onClick={() => {
              history.push('/subscriptions')
              setItem('/subscriptions')
              setOpenMenu(!openMenu)
            }}>
            <img src={Subscriptions} alt="Subscriptions" draggable={false} className={`header__menu-item-svg${darkMode ? '--dark' : ''}`} />
            <p className="header__menu-item-label">Subscriptions</p>
          </div>
          <div
            className="header__menu-item"
            onClick={() => {
              localStorage.setItem('preferredMode', JSON.stringify(!darkMode))
              setDarkMode(!darkMode)
              setOpenMenu(!openMenu)
            }}>
            <img src={darkMode ? Day : Night} alt="Switch Mode" draggable={false} className={`header__menu-item-svg${darkMode ? '--dark' : ''}`} />
            <p className="header__menu-item-label">{darkMode ? 'Light Mode' : 'Dark Mode'}</p>
          </div>
          <p className="header__menu-version">{APP_VERSION}</p>
        </div>
      </div>
    )
  }

  const renderDesktop = () => {
    return (
      <div className={`header__container${darkMode ? '--dark' : ''}`}>
        <div className="header__col">
          <Tooltip
            tooltip={location.pathname.includes('about') ? 'Show Systems' : 'About {process.env.APP_NAME}'}
            inline>
            <img
              src={DDLogo}
              onClick={gotoAbout}
              alt={location.pathname.includes('about') ? 'Show Systems' : 'About {process.env.APP_NAME}'}
              className={`header__down-icon${darkMode ? '--dark' : ''}`}
              draggable={false}
            />
          </Tooltip>
        </div>
        <div className="header__col">
          {process.env.NODE_ENV === 'development' ? <p className='header__dev-label' >DEVELOPMENT</p> : ''}
        </div>
        <div className="header__col">
          <div className="header__user-group">
            <img onClick={switchMode} src={darkMode ? Day : Night} draggable={false} alt="Switch Mode" className={`header__darkmode${darkMode ? '--dark' : ''}`} />
            <img src={UserIcon} alt="User Login" onClick={userOptions} draggable={false} className={`header__login-icon${darkMode ? '--dark' : ''}`} />
          </div>
        </div>
        <div className="header__loading" style={{ width: barWidth }} />
      </div>
    )
  }

  return isMobile ? renderMobile() : renderDesktop()
}