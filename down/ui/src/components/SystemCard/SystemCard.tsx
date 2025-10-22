import React, { useCallback, useContext, useEffect, useState } from 'react'
import Button from '../Button/Button'
import { Line } from 'react-chartjs-2'
import { alertType, dataObj, downtimeModalType, eventType, historyType, statusType, systemType } from '../../types'
import { AppContext } from '../../AppContext'
import { registerables, Chart } from 'chart.js';
import { getDate, getDateWithGivenHour, parseDateTime, sortArray } from '../../helpers'
import { SystemCardPlaceholderBlock } from './SystemCardPlaceholder'
import LiveIcon from '../../assets/icons/heart-pulse.svg'
import Api from '../../assets/icons/api.svg'
import Report from '../../assets/icons/report.svg'
import Subscribe from '../../assets/icons/subscribe.svg'
Chart.register(...registerables);

type Props = {
    system?: systemType
    reportIssue: (value: string) => void
    subscribe: (value: string) => void
    downtime?: { start?: Date, end?: Date }[]
    history?: historyType[]
    alerts?: alertType[]
    setSelected: (value: string) => void
    setSelectedData: (value: any) => void
    setModalChartOptions: (value: systemType[]) => void
    lastCheck?: string | number
    delay?: string
    setShowDowntime: (value: downtimeModalType) => void
    index: number
    selected?: string
    report?: string
    showDowntime?: downtimeModalType,
    subscription?: string
    logo?: string
    raw?: string
}

const SystemCard = (props: Props) => {
    const [lastDayData, setLastDayData] = useState<any[]>([])
    const [completeData, setCompleteData] = useState<any[]>([])
    const [lastDayChartData, setLastDayChartData] = useState<any>({ datasets: [{}], labels: [''] })
    const [completeChartData, setCompleteChartData] = useState<any>({ datasets: [{}], labels: [''] })
    const [loading, setLoading] = useState(true)
    const [showMoreDowntime, setShowMoreDowntime] = useState(false)
    const [status, setStatus] = useState<boolean | null | string | undefined>(null)
    const { darkMode, headerLoading, setHeaderLoading, isSuper } = useContext(AppContext)

    const chartHeight = '1rem'
    const chartWidth = ''

    const {
        system,
        reportIssue,
        downtime,
        history,
        setSelected,
        setSelectedData,
        alerts,
        setModalChartOptions,
        lastCheck,
        delay,
        setShowDowntime,
        index,
        selected,
        report,
        showDowntime,
        subscribe,
        subscription,
        logo,
        raw
    } = props

    const {
        _id,
        name,
        reportedlyDown,
        broadcastMessages,
    } = system || {}

    useEffect(() => {
        if ((loading || (status !== false && status !== true)) && !headerLoading) setHeaderLoading(true)
    }, [loading, status])

    useEffect(() => {
        processChartData()
        setStatus(getCurrentStatus())
    }, [history, alerts, system, selected])

    useEffect(() => {
        generateLastDayData()
    }, [lastDayData])

    const getStatusColor = (item: statusType) => {
        if (!status) return 'red'
        if (reportedlyDown || status === 'BUSY') return 'orange'

        let color = darkMode ? '#00b000' : 'green'
        if (item && item.unknown) color = 'gray'
        if (item.busy) color = darkMode ? '#007f00' : '#006000'
        if (item.isDown) color = darkMode ? '#006600' : '#003a00'
        return color
    }

    const generateLastDayData = useCallback(() => {
        setLastDayChartData({
            labels: lastDayData.length ? lastDayData.map(el => parseDateTime(el.time)) : [],
            datasets: [
                {
                    data: lastDayData.length ? lastDayData.map((el: statusType) => !el.status || el.isDown ? 0 : el.busy ? 0.8 : 1) : [],
                    backgroundColor: (ctx: any) => lastDayData[ctx.index] && lastDayData[ctx.index].reported ? darkMode ? 'white' : 'black' : 'transparent',
                    borderColor: 'transparent',
                    borderWidth: 4,
                    label: 'Reported DOWN by user'
                },
                {
                    data: lastDayData.length ? lastDayData.map((el: statusType) => !el.status || el.isDown ? 0 : el.busy ? 0.8 : 1) : [],
                    backgroundColor: 'transparent',
                    segment: {
                        borderColor: (ctx: any) => getStatusColor(lastDayData[ctx.p1DataIndex])
                    },
                    tension: .4,
                    borderWidth: 3,
                    pointBorderWidth: 0,
                }
            ]
        })
    }, [
        lastDayChartData,
        setLastDayChartData,
        lastDayData,
        completeData,
        darkMode,
        status
    ])

    const generateCompleteData = useCallback(() => {
        setSelectedData({
            labels: completeData.length ? completeData.map(el => parseCompleteDataTime(el.time)) : [],
            datasets: [
                {
                    data: completeData.length ? completeData.map((el: statusType) => !el.status || el.isDown ? 0 : el.busy ? 0.8 : 1) : [],
                    backgroundColor: (ctx: any) => completeData[ctx.index] && completeData[ctx.index].reported ? darkMode ? 'white' : 'black' : 'transparent',
                    borderColor: 'transparent',
                    borderWidth: 4,
                    label: 'Reported DOWN by user'
                },
                {
                    data: completeData.length ? completeData.map((el: statusType) => !el.status || el.isDown ? 0 : el.busy ? 0.8 : 1) : [],
                    backgroundColor: 'transparent',
                    segment: {
                        borderColor: (ctx: any) => getStatusColor(completeData[ctx.p1DataIndex])
                    },
                    tension: .4,
                    pointBorderWidth: 0,
                    borderWidth: 3,
                }
            ]
        })
    }, [
        completeChartData,
        setCompleteChartData,
        lastDayData,
        completeData,
        darkMode,
        status
    ])

    const parseCompleteDataTime = (time: Date) => {
        const string = time ?
            getDate(time)
            : 'No data'
        return string ? string.split(' ').reverse().join(' - ') : ''
    }

    const processChartData = () => {
        /* Process datasets for cards and modals (two weeks) 
        and calculates user alerts to add them as a top layer 
        on the graphs (dots) */
        const reportedHours: string[] = []

        alerts?.forEach((el: alertType) => {
            if (el.createdAt) {
                const date = new Date(el.createdAt)
                date.setMinutes(0)
                date.setSeconds(0)
                reportedHours.push(date.toLocaleString())
            }
        })

        let twoWeeksSet = processSet(336) // Two weeks = 336 h
        const lastDaySet = twoWeeksSet.slice(Math.max(twoWeeksSet.length - 25, 0)) // take the last 24 hours for cards

        setLastDayData(lastDaySet.map(item => {
            if (reportedHours.includes(item.time.toLocaleString())) {
                return { ...item, reported: true }
            }
            return item
        }))

        setCompleteData(twoWeeksSet.map(item => {
            if (reportedHours.includes(item.time.toLocaleString())) {
                return { ...item, reported: true }
            }
            return item
        }))

        setLoading(false)
    }

    const processSet = (hourSet: number = 336) => {
        if (!history || !history.length) return []
        const lastRegister = history[0]
        const firstRegister = history[history.length - 1]
        const firstStatus = firstRegister.status ? 1 : 0
        const lastStatus = lastRegister.status ? 1 : 0
        const firstTime = new Date(firstRegister.createdAt || new Date())
        const lastTime = new Date(lastRegister.createdAt || new Date())
        firstTime.setMinutes(0)
        firstTime.setSeconds(0)
        lastTime.setMinutes(0)
        lastTime.setSeconds(0)

        const allHours = new Map()
        // We reverse so we check from old -> new registers
        history.reverse()
            .map((item, i, arr) => {
                if (!item.status) {
                    const currentStatus = item.status
                    const currentTime = new Date(item.createdAt || new Date()).getTime()
                    const nextTime = arr[i + 1] ? new Date(arr[i + 1].createdAt || new Date()).getTime() : null
                    const nextStatus = arr[i + 1] ? arr[i + 1].status : currentStatus
                    const isBusy = new Date().getTime() - currentTime < 120000
                    if (isBusy || (nextStatus && nextStatus !== currentStatus && nextTime && nextTime - currentTime < 120000)) {
                        item.status = 'BUSY'
                        item.busy = true
                    }
                }
                return item
            })
            .forEach((register, i, arr) => {
                const time = new Date(register.createdAt || new Date())
                time.setMinutes(0)
                time.setSeconds(0)
                const currentTime = new Date(register.createdAt || new Date()).getTime()

                if (allHours.get(time.toLocaleString())) {
                    // If the hour is already registered, we decide which one stays 
                    // based on how much time has passed (>3 mins)
                    const prevTime = new Date(allHours.get(time.toLocaleString()).createdAt || new Date()).getTime()

                    // If just one or two records registered, then we overwrite with latest (current iterated)
                    if (arr.length < 3) {
                        allHours.set(
                            time.toLocaleString(),
                            {
                                ...register,
                                status: register.status ? 1 : 0,
                                busy: allHours.get(time.toLocaleString()).busy || false,
                                isDown: !register.status || !allHours.get(time.toLocaleString()).status
                            }
                        )
                    }

                    // We check if the next hour, but not more that 3 minutes after, the status changed
                    const nextTime = arr[i + 1] ? new Date(arr[i + 1].createdAt || new Date()).getTime() : null
                    if (nextTime && (nextTime - currentTime < 180000) && arr[i + 1].status !== register.status) {
                        // If less than 3 minutes passed, we overwrite the hour status.
                        allHours.set(
                            time.toLocaleString(),
                            {
                                ...register,
                                status: arr[i + 1].status ? 1 : 0,
                                busy: arr[i + 1].busy || false,
                                isDown: !arr[i + 1].status || !register.status || !allHours.get(time.toLocaleString()).status
                            }
                        )
                    }
                    else if (
                        // register.status || 
                        currentTime - prevTime < 180000) {
                        allHours.set(
                            time.toLocaleString(),
                            {
                                ...register,
                                status: register.status ? 1 : 0,
                                busy: allHours.get(time.toLocaleString()).busy || false,
                                isDown: !register.status || !allHours.get(time.toLocaleString()).status
                            }
                        )
                    } else {
                        // On the other hand, if time with next register is more than one hour, we add a new register 
                        // as the next -unexistent- hour with the previous status to compensate the overwrite 
                        // (otherwise it would show DOWN or UP until the next register)
                        const nextRegisteredHour = arr[i + 1] ? new Date(arr[i + 1].createdAt || new Date()).getTime() : null
                        const currentHour = new Date(register.createdAt || new Date()).getTime()
                        if (nextRegisteredHour && nextRegisteredHour - currentHour > 3600000) {
                            const nextHour = new Date(register.createdAt || new Date())
                            nextHour.setHours(nextHour.getHours() + 1)
                            nextHour.setMinutes(0)
                            nextHour.setSeconds(0)
                            allHours.set(
                                nextHour.toLocaleString(),
                                {
                                    ...register,
                                    createdAt: nextHour,
                                    status: register.status ? 1 : 0,
                                    isDown: !register.status || !allHours.get(time.toLocaleString()).status
                                }
                            )
                        }
                    }
                } else {
                    allHours.set(
                        time.toLocaleString(),
                        {
                            ...register,
                            status: register.status ? 1 : 0,
                            isDown: !register.status
                        }
                    )
                }
            })

        let prevStatus = 1
        let prevBusy = false
        let prevIsDown = false
        // We add 2 hours to the set to render the full 24 hours in graph
        const set = Array.from({ length: hourSet + 2 }).map((_, i) => {
            const time = getDateWithGivenHour(hourSet - i)
            let status = lastStatus ? 1 : 0
            let unknown = false
            let busy = false
            let isDown = false

            if (allHours.size > 1) {
                // now < before === true
                // Copy all status from the right to the last registered
                if (new Date(time).getTime() > new Date(lastTime).getTime()) {
                    if (allHours.get(lastTime)) {
                        status = allHours.get(lastTime).status
                        busy = allHours.get(lastTime).busy || false
                        isDown = !allHours.get(lastTime).status
                    }
                }
                // Copy all status from the left to the first registered
                else if (new Date(time).getTime() < new Date(firstTime).getTime()) {
                    // status = firstStatus
                    // Other idea is putting unkown status (0.5) before the first register
                    unknown = true
                }
                else if (allHours.get(time)) {
                    const register = allHours.get(time)
                    status = register.status
                    prevStatus = register.status
                    busy = register.busy || false
                    prevBusy = register.busy || false
                    isDown = register.isDown
                    prevIsDown = register.isDown
                }
                // Copy status in between registered statuses
                else {
                    status = prevStatus
                    busy = prevBusy
                    isDown = prevIsDown

                    prevStatus = 1
                    prevBusy = false
                    prevIsDown = false
                }
            } else {
                status = allHours.values().next().value.status
                if (new Date(time).getTime() < new Date(firstTime).getTime()) {
                    unknown = true
                }
            }

            const itemStatus = {
                time,
                status,
                unknown,
                busy,
                isDown
            }

            return itemStatus
        })

        return set
    }

    const getDowntime = (event: eventType) => {
        if (event && event.start && event.end) {
            return (
                <span>
                    <span className={`systemcard__event-time${darkMode ? '--dark' : ''}`}>{getDate(event.start)}</span>
                    {name === 'GitLab' ? '' : <span style={{ fontWeight: 'normal' }}> ➜ </span>}
                    {name === 'GitLab' ? '' : <span className={`systemcard__event-time${darkMode ? '--dark' : ''}`}>getDate(event.end)</span>}
                    <div className={`systemcard__event-note${darkMode ? '--dark' : ''}`} dangerouslySetInnerHTML={{ __html: event.note || '' }} />
                </span>
            )
        }
        else return ''
    }

    const selectSystem = () => {
        generateCompleteData()
        setModalChartOptions(completeChartOptions)
        setSelected(system?._id || '')
    }

    const isLiveDowntime = (downtime: eventType) => {
        if (downtime && downtime.start) {
            const now = new Date().getTime()
            const start = new Date(downtime.start || new Date()).getTime()
            const end = new Date(downtime.end || new Date()).getTime()
            if (now - start > 0 && now - end < 0) return true
        }
        return false
    }

    const getCurrentStatus = () => {
        const lastHistories: historyType[] | null = history && Array.isArray(history) ?
            sortArray(history, 'createdAt', true).slice(0, 2) : null
        const current = lastHistories && lastHistories.length ? { ...lastHistories[0] } : null

        if (current && !current.status) {
            const currentStatus = current.status
            const currentTime = new Date(current.createdAt || new Date()).getTime()
            const isBusy = new Date().getTime() - currentTime < 120000
            current.status = isBusy ? 'BUSY' : currentStatus
        }
        return current ? current.status : null
    }

    const hasPageMessage = () => {
        const json = JSON.parse(broadcastMessages || '[]')
        const banners = Array.isArray(json) ? json.filter((message: dataObj) =>
            message.active && new Date(message.ends_at).getTime() - new Date().getTime() > 0) : []
        const gerritMessage = name?.toLocaleLowerCase().includes('gerrit') && raw?.includes('plugins/banner/static/banner.js')
        const gitLabMessage = name?.toLocaleLowerCase().includes('gitlab') && banners.length
        return isSuper && (gerritMessage || gitLabMessage)
    }

    const chartOptions: any = {
        maintainAspectRatio: false,
        indexAxis: 'x',
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Last 24 hours',
                align: 'start',
                fullSize: false,
                font: {
                    weight: 'normal'
                }
            },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => {
                        const label = ctx.dataset.label || ''
                        if (lastDayData[ctx.dataIndex] && lastDayData[ctx.dataIndex].reported) return label
                        else if (label.includes('user')) return ''
                        return lastDayData[ctx.dataIndex].unknown ? 'Not registered' :
                            lastDayData[ctx.dataIndex].busy ? 'BUSY' :
                                lastDayData[ctx.dataIndex].status ? 'UP' : 'DOWN'
                    },
                    labelColor: (ctx: any) => {
                        return {
                            backgroundColor: lastDayData[ctx.dataIndex].unknown ? 'gray' :
                                lastDayData[ctx.dataIndex].busy ? 'orange' :
                                    lastDayData[ctx.dataIndex].reported ? darkMode ? 'white' : 'black' :
                                        lastDayData[ctx.dataIndex].status ? 'green' : 'red',
                            borderWidth: 0,
                            borderRadius: 5,
                        }
                    },
                },
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                border: {
                    display: false
                },
                ticks: {
                    autoSkip: false,
                    display: false,
                    color: 'gray'
                },
                grid: {
                    display: false,
                    drawBorder: false,
                    drawChartArea: false,
                    color: darkMode ? '#333333a1' : '#dbdbdb9d'
                }
            },
            y: {
                beginAtZero: true,
                border: {
                    display: false
                },
                ticks: {
                    display: false
                },
                grid: {
                    display: false,
                    drawBorder: false,
                    drawChartArea: false,
                    color: darkMode ? '#333333a1' : '#dbdbdb9d'
                }
            }
        }
    }

    const completeChartOptions: any = {
        maintainAspectRatio: false,
        indexAxis: 'x',
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => {
                        const label = ctx.dataset.label || ''
                        if (completeData[ctx.dataIndex] && completeData[ctx.dataIndex].reported) return label
                        else if (label.includes('user')) return ''
                        return completeData[ctx.dataIndex].unknown ? 'Not registered' :
                            completeData[ctx.dataIndex].busy ? 'BUSY' :
                                completeData[ctx.dataIndex].status ? 'UP' : 'DOWN'
                    },
                    labelColor: (ctx: any) => {
                        return {
                            backgroundColor: completeData[ctx.dataIndex].unknown ? 'gray' :
                                completeData[ctx.dataIndex].busy ? 'orange' :
                                    completeData[ctx.dataIndex].reported ? darkMode ? 'white' : 'black' :
                                        completeData[ctx.dataIndex].status ? 'green' : 'red',
                            borderWidth: 0,
                            borderRadius: 5,
                        }
                    },
                },
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                border: {
                    display: false
                },
                ticks: {
                    autoSkip: false,
                    display: false,
                    // color: 'gray'
                },
                grid: {
                    display: false,
                    drawBorder: false,
                    drawChartArea: false,
                    color: darkMode ? '#333333a1' : '#dbdbdb9d'
                }
            },
            y: {
                beginAtZero: true,
                border: {
                    display: false
                },
                ticks: {
                    display: false
                },
                grid: {
                    display: false,
                    drawBorder: false,
                    drawChartArea: false,
                    color: (ctx: any) => ctx.tick.value !== .5 ? darkMode ? '#333333a1' : '#dbdbdb9d' : 'transparent'
                }
            }
        }
    }

    return (
        <div className="systemcard__wrapper" style={{ animationDelay: `${delay || '0'}` }}>
            <>
                <div
                    className={`systemcard__container${darkMode ? '--dark' : ''}`}
                    style={{
                        borderColor: darkMode ? '#424244' : '#d3d3d3',
                        // borderColor: loading ? 'gray' : status ? 'green' : 'red',
                        backgroundImage: loading || (status !== false && status !== true && status !== 'BUSY') ? '' :
                            status === 'BUSY' ? darkMode ? 'linear-gradient(to right bottom, rgb(0, 0, 0), rgb(255 152 0 / 26%)'
                                : 'linear-gradient(to right bottom, white, rgb(202 120 0 / 17%))' : darkMode ?
                                `linear-gradient(to bottom right, #000000, ${status ? '#00600085' : '#7000008c'})`
                                :
                                `linear-gradient(to bottom right, white, ${status ? 'rgba(0, 128, 0, 0.120)' : 'rgba(255, 0, 0, 0.120)'})`,
                        zIndex: downtime && downtime.length ? 4 : '',
                        borderBottom: downtime && downtime.length ? 'none' : `1px solid ${darkMode ? '#424244' : '#d3d3d3'}`,
                    }}
                    onMouseEnter={() => setShowMoreDowntime(true)}
                    onMouseLeave={() => setShowMoreDowntime(false)}>
                    <div className="systemcard__header" onClick={selectSystem}>
                        <img
                            src={logo || Api}
                            alt="System Logo"
                            className="systemcard__logo"
                            style={{
                                filter: darkMode && !logo ? 'invert(100%) sepia(5%) saturate(433%) hue-rotate(6deg) brightness(120%) contrast(100%)' : ''
                            }}
                            draggable={false}
                        />
                        <h1 className="systemcard__name">{hasPageMessage() ? '️🚧 ' : ''}{name || 'Api Name'}</h1>
                    </div>
                    {loading || (status !== false && status !== true && status !== 'BUSY') ?
                        SystemCardPlaceholderBlock(darkMode)
                        :
                        <div className="systemcard__graph" onClick={selectSystem}>
                            {!selected && !report && !showDowntime && !subscription ? <Line data={lastDayChartData} height={chartHeight} width={chartWidth} options={chartOptions} /> : ''}
                        </div>}
                    <div className="systemcard__footer">
                        <h2
                            className="systemcard__status"
                            style={{ color: loading ? 'gray' : reportedlyDown || status === 'BUSY' ? 'orange' : status ? darkMode ? '#00b000' : 'green' : 'red' }}>
                            {loading || (status !== false && status !== true && status !== 'BUSY') ? <p style={{ color: 'gray' }}>Checking status...</p> :
                                <>
                                    <span
                                        style={{
                                            animation: selected || report || subscription ? 'none' : '',
                                            animationDelay: `${delay || '0'}`
                                        }}
                                        className='systemcard__status-dot'>
                                        <img
                                            style={{
                                                filter: reportedlyDown || status === 'BUSY' ? 'invert(64%) sepia(97%) saturate(1746%) hue-rotate(359deg) brightness(101%) contrast(106%)'
                                                    : status ? 'invert(24%) sepia(100%) saturate(1811%) hue-rotate(97deg) brightness(130%) contrast(105%)' :
                                                        'invert(19%) sepia(87%) saturate(7117%) hue-rotate(358deg) brightness(97%) contrast(117%)'
                                            }}
                                            src={LiveIcon}
                                            alt="Live"
                                            className="systemcard__status-live"
                                            draggable={false} />
                                    </span>
                                    &nbsp;&nbsp;Status:&nbsp;
                                    <strong>{reportedlyDown ? 'Problem' : status ? status === 'BUSY' ? status : 'UP' : 'DOWN'}
                                    </strong>
                                </>
                            }
                        </h2>
                        {status ?
                            <div className='systemcard__buttons'>
                                <Button
                                    handleClick={() => subscribe(_id || '')}
                                    bgColor={darkMode ? '#353535' : '#dcdcdc'}
                                    textColor={darkMode ? 'lightgray' : '#323232'}
                                    svg={Subscribe}
                                    tooltip='Subscribe for updates'
                                    style={{ minHeight: '1.75rem', width: '1rem', padding: '0 .4§rem' }}
                                />
                                <Button
                                    handleClick={() => reportIssue(_id || '')}
                                    bgColor={darkMode ? '#353535' : '#dcdcdc'}
                                    textColor={darkMode ? 'lightgray' : '#323232'}
                                    svg={Report}
                                    tooltip='Report Issue'
                                    style={{ minHeight: '1.75rem', width: '1rem', padding: '0 .4rem' }}
                                />
                            </div>
                            : !loading && (status || status === false) && lastCheck ?
                                <p style={{ color: darkMode ? 'lightgray' : 'gray' }} className="systemcard__status-caption">{lastCheck}</p>
                                : ''}

                    </div>
                </div>
                {downtime && downtime.length ?
                    <div
                        className={`systemcard__event${darkMode ? '--dark' : ''}`}
                        style={{
                            backgroundColor: isLiveDowntime(downtime[0]) || name === 'GitLab' ? darkMode ?
                                'black' : '#ffc3c3' : darkMode ?
                                'black' : 'transparent',
                            border: isLiveDowntime(downtime[0]) || name === 'GitLab' ? darkMode ? '1px solid red'
                                : '1px solid transparent' : darkMode ? '1px solid #ffc7006b' : '1px solid #dbdbdb',
                            animationDelay: `${delay || '0'}`
                        }}
                        onMouseEnter={() => setShowMoreDowntime(true)}
                        onMouseLeave={() => setShowMoreDowntime(false)}>
                        <p className="systemcard__event-title">🚧 {name === 'GitLab' ? 'Decommission' : 'Planned downtime'} 🚧</p>
                        {downtime.map((time, i) =>
                            <div key={i}>
                                {showMoreDowntime && i > 0 ? <div className='systemcard__event-downtime-separator' /> : ''}
                                <div
                                    className={`systemcard__event-downtime${darkMode ? '--dark' : ''}`}
                                    onClick={() => setShowDowntime({ ...time, system, index })}
                                    style={{
                                        display: !showMoreDowntime ? 'none' : '',
                                        marginTop: i === 0 ? '.5rem' : ''
                                    }}>
                                    {getDowntime(time)}
                                </div>
                            </div>
                        )}
                    </div>
                    : ''}
            </>
        </div >
    )
}

export default React.memo(SystemCard)