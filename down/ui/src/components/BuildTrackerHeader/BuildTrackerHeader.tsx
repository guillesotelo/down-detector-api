import React, { useContext, useState } from 'react'
import BTLogo from '../../assets/logos/build-tracker2.png'
import BTLogoDark from '../../assets/logos/build-tracker2-dark.png'
import SearchBar from '../SearchBar/SearchBar'
import { onChangeEventType } from '../../types'
import { AppContext } from '../../AppContext'
import Day from '../../assets/icons/day.svg'
import Night from '../../assets/icons/night.svg'
import { useHistory } from 'react-router-dom'
import UserIcon from '../../assets/icons/user-icon.svg'
import ControlPanel from '../../assets/icons/dashboard-2.svg'
import Tooltip from '../Tooltip/Tooltip'
import { getUser } from '../../helpers'

type Props = {
    search?: string
    setSearch?: (value: string) => void
    onChangeSearch?: (e: onChangeEventType) => void
    style?: React.CSSProperties
}

export default function BuildTrackerHeader({ search, setSearch, onChangeSearch, style }: Props) {
    const { setDarkMode, darkMode, isLoggedIn } = useContext(AppContext)
    const history = useHistory()

    const switchMode = () => {
        setDarkMode(!darkMode)
        localStorage.setItem('preferredMode', JSON.stringify(!darkMode))
        const event = new Event('darkMode')
        document.dispatchEvent(event)
    }

    const userOptions = () => {
        if (isLoggedIn) history.push('/account')
        else history.push('/login')
    }

    return (
        <div className={`btheader__container${darkMode ? '--dark' : ''}`} style={style}>
            <div className="btheader__wrapper">
                <Tooltip tooltip='Show build activity' inline>
                    <img
                        src={darkMode ? BTLogoDark : BTLogo}
                        alt="Build Tracker"
                        className="btheader__logo"
                        draggable={false}
                        style={{ opacity: darkMode ? '.9' : '1' }}
                        onClick={() => history.push('/build-tracker')}
                    />
                </Tooltip>
                <div className="btheader__row">
                    {getUser().buildTrackerAccess ?
                        <Tooltip tooltip='Control Panel'>
                            <img src={ControlPanel} alt="Control Panel" onClick={() => history.push('/build-tracker/control-panel')} draggable={false} className={`header__login-icon${darkMode ? '--dark' : ''}`} style={{ transform: 'scale(1.2)' }} />
                        </Tooltip>
                        : ''}
                    <Tooltip tooltip={isLoggedIn ? 'My Account' : 'Login'}>
                        <img src={UserIcon} alt="User Login" onClick={userOptions} draggable={false} className={`header__login-icon${darkMode ? '--dark' : ''}`} />
                    </Tooltip>
                    <Tooltip tooltip='Switch Mode'>
                        <img onClick={switchMode} src={darkMode ? Day : Night} draggable={false} alt="Switch Mode" className={`header__darkmode${darkMode ? '--dark' : ''}`} />
                    </Tooltip>
                    {setSearch && <SearchBar
                        handleChange={onChangeSearch}
                        value={search}
                        placeholder='Search builds...'
                    />}
                </div>
            </div>
        </div>
    )
}