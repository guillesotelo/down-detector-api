import { useContext, useEffect, useState } from 'react'
import Dashboard from '../../assets/icons/dashboard.svg'
import History from '../../assets/icons/history.svg'
import AppLogs from '../../assets/icons/logs.svg'
import Api from '../../assets/icons/api.svg'
import Users from '../../assets/icons/users.svg'
import Subscriptions from '../../assets/icons/subscribe.svg'
import { AppContext } from '../../AppContext'
import { useHistory, useLocation } from 'react-router-dom'
import { APP_VERSION } from '../../constants/app'
import Tooltip from '../Tooltip/Tooltip'
import { getVersionDate } from '../../services'

type Props = {}

export default function Sidebar({ }: Props) {
    const [versionDate, setVersionDate] = useState('')
    const history = useHistory()
    const location = useLocation()
    const { isSuper, item, setItem, darkMode, isMobile } = useContext(AppContext)

    useEffect(() => {
        getTooltipVersionDate()
        setItem(window.location.pathname)
    }, [window.location, location])

    const getTooltipVersionDate = async () => {
        try {
            const vDate = await getVersionDate()
            if (vDate) setVersionDate(vDate || '')
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className={`sidebar__container${darkMode ? '--dark' : ''}`} style={{ display: isMobile ? 'none' : '' }}>
            <div
                className={`sidebar__item${darkMode ? '--dark' : ''}`}
                onClick={() => {
                    history.push('/')
                    setItem('/')
                }}
                style={{
                    marginTop: '1.5rem',
                    backgroundColor: item === '/' ? darkMode ? '#555555' : 'rgb(237, 237, 237)' : ''
                }}>
                <img src={Dashboard} alt="Dashboard" draggable={false} className={`sidebar__item-svg${darkMode ? '--dark' : ''}`} />
                <h4 className={`sidebar__item-label${darkMode ? '--dark' : ''}`}>Dashboard</h4>
            </div>
            <div
                className={`sidebar__item${darkMode ? '--dark' : ''}`}
                style={{
                    backgroundColor: item === '/history' ? darkMode ? '#555555' : 'rgb(237, 237, 237)' : ''
                }}
                onClick={() => {
                    history.push('/history')
                    setItem('/history')
                }}>
                <img src={History} alt="History" draggable={false} className={`sidebar__item-svg${darkMode ? '--dark' : ''}`} />
                <h4 className={`sidebar__item-label${darkMode ? '--dark' : ''}`}>History</h4>
            </div>
            <div className={`sidebar__separator${darkMode ? '--dark' : ''}`}></div>
            <div
                className={`sidebar__item${darkMode ? '--dark' : ''}`}
                style={{
                    backgroundColor: item.includes('systems') ? darkMode ? '#555555' : 'rgb(237, 237, 237)' : ''
                }}
                onClick={() => {
                    history.push('/systems')
                    setItem('settings-systems')
                }}>
                <img src={Api} alt="Settings" draggable={false} className={`sidebar__item-svg${darkMode ? '--dark' : ''}`} />
                <h4 className={`sidebar__item-label${darkMode ? '--dark' : ''}`}>Systems</h4>
            </div>
            {isSuper ?
                <>
                    <div
                        className={`sidebar__item${darkMode ? '--dark' : ''}`}
                        style={{
                            backgroundColor: item.includes('users') ? darkMode ? '#555555' : 'rgb(237, 237, 237)' : ''
                        }}
                        onClick={() => {
                            history.push('/users')
                            setItem('settings-users')
                        }}>
                        <img src={Users} alt="Users" draggable={false} className={`sidebar__item-svg${darkMode ? '--dark' : ''}`} />
                        <h4 className={`sidebar__item-label${darkMode ? '--dark' : ''}`}>Users</h4>
                    </div>
                    <div className={`sidebar__separator${darkMode ? '--dark' : ''}`}></div>
                    <div
                        className={`sidebar__item${darkMode ? '--dark' : ''}`}
                        style={{
                            backgroundColor: item === '/applogs' ? darkMode ? '#555555' : 'rgb(237, 237, 237)' : ''
                        }}
                        onClick={() => {
                            history.push('/applogs')
                            setItem('/applogs')
                        }}>
                        <img src={AppLogs} alt="App Logs" draggable={false} className={`sidebar__item-svg${darkMode ? '--dark' : ''}`} />
                        <h4 className={`sidebar__item-label${darkMode ? '--dark' : ''}`}>App Logs</h4>
                    </div>
                    <div
                        className={`sidebar__item${darkMode ? '--dark' : ''}`}
                        style={{
                            backgroundColor: item === '/subscriptions' ? darkMode ? '#555555' : 'rgb(237, 237, 237)' : ''
                        }}
                        onClick={() => {
                            history.push('/subscriptions')
                            setItem('/subscriptions')
                        }}>
                        <img src={Subscriptions} alt="Subscriptions" draggable={false} className={`sidebar__item-svg${darkMode ? '--dark' : ''}`} />
                        <h4 className={`sidebar__item-label${darkMode ? '--dark' : ''}`}>Subscriptions</h4>
                    </div>
                </>
                : ''}
            {/* <div
                className={`sidebar__item${darkMode ? '--dark' : ''}`}
                style={{
                    backgroundColor: item === '/help' ? darkMode ? '#555555' : 'rgb(237, 237, 237)' : ''
                }}
                onClick={() => {
                    history.push('/help')
                    setItem('/help')
                }}>
                <img src={Help} alt="Help" draggable={false} className={`sidebar__item-svg${darkMode ? '--dark' : ''}`} />
                <h4 className={`sidebar__item-label${darkMode ? '--dark' : ''}`}>Help</h4>
            </div> */}
            <div className="sidebar__version">
                <Tooltip tooltip={versionDate}>
                    <p className="sidebar__version-text">{APP_VERSION}</p>
                </Tooltip>
            </div >
        </div >
    )
}