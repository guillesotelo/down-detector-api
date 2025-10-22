import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../AppContext'
import SystemCard from '../../components/SystemCard/SystemCard'
import Modal from '../../components/Modal/Modal'
import { getActiveSystems, getAllHistory, createUserAlert, getAllAlerts, getAllEvents, deleteHistory, updateHistory, updateUserAlert, deleteUserAlert, createHistory, getVersionDate, createSubscription, getSystemDataSelect } from '../../services'
import { alertType, dataObj, downtimeModalType, eventType, historyType, onChangeEventType, SubscriptionType, systemType } from '../../types'
import { Line } from 'react-chartjs-2'
import { registerables, Chart } from 'chart.js';
import DataTable from '../../components/DataTable/DataTable'
import { hisrotyHeaders, systemHisrotyHeaders } from '../../constants/tableHeaders'
import InputField from '../../components/InputField/InputField'
import Dropdown from '../../components/Dropdown/Dropdown'
import Button from '../../components/Button/Button'
import { toast } from 'react-toastify'
import { APP_COLORS, APP_VERSION } from '../../constants/app'
import { getDate, getUser, sortArray, toHex } from '../../helpers'
import SystemCardPlaceholder from '../../components/SystemCard/SystemCardPlaceholder'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'
import LiveIcon from '../../assets/icons/live.svg'
import Report from '../../assets/icons/report.svg'
import Subscribe from '../../assets/icons/subscribe.svg'
import Tooltip from '../../components/Tooltip/Tooltip'
Chart.register(...registerables);

const Home = () => {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState('')
  const [subscription, setSubscription] = useState('')
  const [selected, setSelected] = useState('')
  const [showDowntime, setShowDowntime] = useState<downtimeModalType>(null)
  const [allSystems, setAllSystems] = useState<systemType[]>([])
  const [allEvents, setAllEvents] = useState<eventType[]>([])
  const [statusAndAlerts, setStatusAndAlerts] = useState<alertType[] & historyType[]>([])
  const [allStatus, setAllStatus] = useState<historyType[]>([])
  const [allAlerts, setAllAlerts] = useState<alertType[]>([])
  const [data, setData] = useState<alertType & SubscriptionType>({})
  const [chartData, setChartData] = useState<any>({ datasets: [{}], labels: [''] })
  const [reportedStatus, setReportedStatus] = useState({ name: 'Not responding' })
  const [modalChartOptions, setModalChartOptions] = useState({})
  const [selectedLog, setSelectedLog] = useState(-1)
  const [editLog, setEditLog] = useState(false)
  const [editedLogStatus, setEditedLogStatus] = useState('DOWN')
  const [editedLogMessage, setEditedLogMessage] = useState('')
  const [versionDate, setVersionDate] = useState('')
  const [countdownKey, setCountdownKey] = useState(0)
  const [systemLogos, setSystemLogos] = useState<dataObj>({})
  const [systemRaw, setSystemRaw] = useState<dataObj>({})
  const { darkMode, setHeaderLoading, isMobile, isLoggedIn, isSuper } = useContext(AppContext)

  const chartHeight = '30vh'
  const chartWidth = '80vw'

  const issueOptions = [
    { name: `Not responding` },
    { name: 'Unable to access' },
    { name: 'Slow loading' },
    { name: 'Unstable' },
    { name: 'Throwing errors' },
    { name: 'Other (explain)' },
  ]

  const loadData = useMemo(() => {
    return () => {
      setLoading(true)
      getSystems()
      getAllStatus()
      getAllDownTimes()
      getTooltipVersionDate()
      setLoading(false)
      getLogosAndRaw()
    }
  }, [])

  useEffect(() => {
    setHeaderLoading(true)
    loadData()
    const intervalId = setInterval(() => {
      setCountdownKey(prev => prev + 1)
      setAllSystems([])
      loadData()
    }, 1 * 60 * 1000)
    return () => clearInterval(intervalId)
  }, [loadData])

  useEffect(() => {
    if (selected || report || subscription) {
      document.body.style.overflow = 'hidden'
      if (allStatus.length) getStatusAndAlerts()
    } else document.body.style.overflow = 'auto'
  }, [selected, report, subscription])

  useEffect(() => {
    if (selectedLog !== -1) {
      const selectedHistory = statusAndAlerts[selectedLog]
      setEditedLogStatus(selectedHistory.userAlert ? 'DOWN' : selectedHistory.status ? 'UP' : 'DOWN')
      setEditedLogMessage(selectedHistory.message || '')
    } else {
      setEditedLogMessage('')
      setEditedLogStatus('DOWN')
    }
  }, [selectedLog])

  const getLogosAndRaw = async () => {
    try {
      const systemLogos = await getSystemDataSelect('logo')
      if (systemLogos && Array.isArray(systemLogos)) {
        const logMap: dataObj = {}
        systemLogos.forEach(system => {
          logMap[system._id] = system.logo
        })
        setSystemLogos(logMap)
      }

      const systemRaw = await getSystemDataSelect('raw')
      if (systemRaw && Array.isArray(systemRaw)) {
        const rawMap: dataObj = {}
        systemRaw.forEach(system => {
          rawMap[system._id] = system.raw
        })
        setSystemRaw(rawMap)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const getStatusAndAlerts = () => {
    const statusAndAlertsByID = sortArray(allStatus.filter((status: eventType) => status.systemId === selected)
      .concat(allAlerts.filter((alert: alertType) => alert.systemId === selected)), 'createdAt', true)
      .reverse()
      .map((item, i, arr) => {
        if (!item.status) {
          const currentStatus = item.status
          const currentTime = new Date(item.createdAt || new Date()).getTime()
          const nextTime = arr[i + 1] ? new Date(arr[i + 1].createdAt || new Date()).getTime() : null
          const nextStatus = arr[i + 1] ? arr[i + 1].status : currentStatus
          const isBusy = new Date().getTime() - currentTime < 120000
          const isAlert = (item as alertType).userAlert
          // We check if less than 2 minutes passed between peaks to spot BUSY states (unlike DOWN states)
          if (!isAlert && (isBusy || (nextStatus && nextStatus !== currentStatus && nextTime && nextTime - currentTime < 120000))) {
            item.status = 'BUSY'
            item.busy = true
          }
        }
        return item
      })
      .reverse()

    setStatusAndAlerts(statusAndAlertsByID)
  }

  const getAllDownTimes = async () => {
    try {
      let events = await getAllEvents()
      if (events && Array.isArray(events)) {
        setAllEvents(events)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const getSystems = async () => {
    try {
      let systems = await getActiveSystems()
      if (systems && Array.isArray(systems)) {
        setAllSystems(sortArray(systems, 'order'))
      }
    } catch (error) {
      console.error(error)
    }
  }

  const getAllStatus = async () => {
    try {
      let history = await getAllHistory()
      if (history && Array.isArray(history)) {
        setAllStatus(history)
        let alerts = await getAllAlerts()
        if (alerts && Array.isArray(alerts)) {
          setAllAlerts(alerts)
        }
      } else setTimeout(loadData, 1500)
    } catch (error) {
      console.error(error)
    }
  }

  const getCurrentStatus = (system: systemType) => {
    const lastHistories: historyType[] | null = allStatus && Array.isArray(allStatus) ?
      sortArray(allStatus.filter(h => h.systemId === system._id), 'createdAt', true) : null
    const current = lastHistories ? { ...lastHistories[0] } : null

    if (current && !current.status) {
      const currentStatus = current.status
      const currentTime = new Date(current.createdAt || new Date()).getTime()
      const isBusy = new Date().getTime() - currentTime < 120000
      current.status = isBusy ? 'BUSY' : currentStatus
    }
    return current ? current.status : null
  }

  const getLastCheck = (system: systemType) => {
    const history: historyType | null = allStatus.find((status: eventType) => status.systemId === system._id) || null
    if (!allStatus || !allStatus.length || history?.status) return 0
    const now = new Date().getTime()
    const historyDate = new Date(history?.createdAt || new Date()).getTime()
    const minutesPassed = (now - historyDate) / 60000
    let timePassed
    if (minutesPassed >= 60) {
      if (minutesPassed >= 1440) {
        const days = (minutesPassed / 60 / 24).toFixed(0)
        timePassed = `${days} day${Number(days) > 1 ? 's' : ''}`
      }
      else {
        const hours = (minutesPassed / 60).toFixed(0)
        timePassed = `${hours} hour${Number(hours) > 1 ? 's' : ''}`
      }
    } else timePassed = `${minutesPassed.toFixed(0)} min${Number(minutesPassed.toFixed(0)) > 1 ? 's' : ''}`
    return `For ${timePassed}`
  }

  const getSystemData = (id: string, type: string) => {
    if (allSystems.length) {
      const found = allSystems.find(system => system._id === id)
      return found ? found[type as keyof systemType] || null : null
    }
    return ''
  }

  const sendReport = async () => {
    try {
      setLoading(true)
      const user = getUser()
      let nav: dataObj = {}
      for (let i in navigator) nav[i] = (navigator as any)[i]
      let geoLocation = ''
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => geoLocation = JSON.stringify(pos),
          (err) => geoLocation = err.message
        )
      }

      const reportData = {
        ...data,
        name: String(getSystemData(report, 'name') || 'System'),
        geoLocation,
        navigator: JSON.stringify(nav),
        type: reportedStatus.name,
        systemId: report,
        url: getSystemData(report, 'url'),
        message: `${reportedStatus.name}${data.message ? ': ' + data.message : ''}`,
        createdBy: user.username || `${toHex(JSON.stringify(nav)).slice(0, 30)}`
      }

      const sent = await createUserAlert(reportData)
      if (sent && sent._id) {
        toast.success('Report sent successfully')
        setSelected('')
        setReport('')
        setSubscription('')
        setData({})
        loadData()
      } else toast.success('Error sending report. Try again later.')
      setLoading(false)
    } catch (error) {
      toast.success('Error sending report. Try again later.')
      setLoading(false)
    }
  }

  const checkSubscription = () => {
    const email = data.subscriberEmail
    if (!email) return false
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailPattern.test(email)
  }

  const subscribeForUpdates = async () => {
    try {
      if (!checkSubscription()) return toast.error('Enter a valid email')
      setLoading(true)
      let nav: dataObj = {}
      for (let i in navigator) nav[i] = (navigator as any)[i]
      let geoLocation = ''
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => geoLocation = JSON.stringify(pos),
          (err) => geoLocation = err.message
        )
      }

      const subscriptionData = {
        ...data,
        name: String(getSystemData(subscription, 'name') || 'System'),
        geoLocation,
        navigator: JSON.stringify(nav),
        systemId: subscription,
        email: data.subscriberEmail,
        username: (data.subscriberEmail?.split('@')[0]) || ''
      }

      const subscribed = await createSubscription(subscriptionData)
      if (subscribed && subscribed._id) {
        toast.success('Subscribed successfully')
        setSelected('')
        setReport('')
        setSubscription('')
        setData({})
        loadData()
      } else toast.error('Subscription error. Please Try again.')
      setLoading(false)
    } catch (error) {
      toast.error('Subscription error. Please Try again.')
      setLoading(false)
    }
  }

  const getAlertsBySystem = (system: systemType) => {
    return allAlerts.filter((alert: alertType) => alert.systemId === system._id)
  }

  const getHistoryBySystem = (system: systemType) => {
    return allStatus.filter((history: historyType) => history.systemId === system._id)
  }

  const updateData = (key: string, e: onChangeEventType) => {
    const value = e.target.value
    setData({ ...data, [key]: value })
  }

  const isComingEvent = (event: eventType) => {
    if (event && event.end) {
      const now = new Date().getTime()
      const eventEnd = new Date(event.end || new Date()).getTime()
      if (eventEnd - now > 0) return true
    }
    return false
  }

  const getComingEvent = (events: eventType[]) => {
    let lastEvent: eventType = events[0]
    events.forEach(event => {
      const lastEventStart = new Date(lastEvent.start || new Date()).getTime()
      const currentEventStart = new Date(event.start || new Date()).getTime()
      if (isComingEvent(event) && currentEventStart < lastEventStart) lastEvent = event
    })
    return lastEvent
  }

  const getDownTime = (system: systemType) => {
    return sortArray(
      allEvents.filter((event: eventType) => {
        if (event.systemId === system._id &&
          new Date(event.end || '').getTime() > new Date().getTime()) return event
      }),
      'start'
    )
  }

  const getSelectedSystem = () => {
    return allSystems.find(system => system._id === selected) || {}
  }

  const getDowntimeString = () => {
    const system = getSelectedSystem()
    const event = getComingEvent(getDownTime(system || {}))
    if (event && event.start && event.end) {
      return (<span>
        <span className={`systemcard__event-time${darkMode ? '--dark' : ''}`}>{getDate(event.start)}</span>
        {getSystemData(selected, 'name') === 'GitLab' ? '' : <span style={{ fontWeight: 'normal' }}> ➜ </span>}
        {getSystemData(selected, 'name') === 'GitLab' ? '' : <span className={`systemcard__event-time${darkMode ? '--dark' : ''}`}>{getDate(event.end)}</span>}
        <div className={`systemcard__event-note${darkMode ? '--dark' : ''}`} dangerouslySetInnerHTML={{ __html: event.note || '' }} />
      </span>
      )
    }
    else return ''
  }

  const isLiveDowntime = () => {
    const system = getSelectedSystem()
    const downtime = getComingEvent(getDownTime(system || {}))
    if (downtime && downtime.start) {
      const now = new Date().getTime()
      const start = new Date(downtime.start || new Date()).getTime()
      const end = new Date(downtime.end || new Date()).getTime()
      if (now - start > 0 && now - end < 0) return true
    }
    return false
  }

  const getDowntimeDate = (date: Date | string) => {
    return `${new Date(date).toDateString()}, ${new Date(date).toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' })}`
  }

  const removeSelectedLog = async () => {
    try {
      setLoading(true)
      const selectedHistory = statusAndAlerts[selectedLog]
      const removed = selectedHistory.userAlert ?
        await deleteUserAlert(selectedHistory) :
        await deleteHistory(selectedHistory)
      if (removed) toast.success('Log removed successfully')
      else return toast.error('Error removing Log. Please try again')
      setSelectedLog(-1)
      setEditLog(false)
      setEditedLogStatus('')
      setEditedLogMessage('')
      setStatusAndAlerts(prev => {
        let newStatus = [...prev]
        newStatus.splice(selectedLog, 1)
        return newStatus
      })
      loadData()
      setLoading(false)
    } catch (error) {
      setLoading(false)
      toast.error('Error removing Log. Please try again')
      console.error(error)
    }
  }

  const saveSelectedLog = async () => {
    try {
      setLoading(true)
      const selectedHistory = selectedLog !== -1 ? statusAndAlerts[selectedLog] : {}
      if (editedLogStatus) selectedHistory.status = editedLogStatus === 'UP' ? true : false
      if (editedLogMessage) selectedHistory.message = editedLogMessage
      const saved = selectedLog === -1 ? await createHistory({ ...selectedHistory, systemId: selected })
        : selectedHistory.userAlert ?
          await updateUserAlert(selectedHistory) :
          await updateHistory(selectedHistory)
      if (saved) toast.success('Log updated successfully')
      else return toast.error('Error updating Log. Please try again')
      setSelectedLog(-1)
      setEditLog(false)
      setEditedLogStatus('')
      setEditedLogMessage('')
      setStatusAndAlerts(prev => {
        let newStatus = [...prev]
        newStatus[selectedLog] = selectedHistory
        return newStatus
      })
      loadData()
      setLoading(false)
    } catch (error) {
      setLoading(false)
      toast.error('Error updating Log. Please try again')
      console.error(error)
    }
  }

  const discardChanges = () => {
    setSelected('')
    setSelectedLog(-1)
    setShowDowntime(null)
    setEditLog(false)
    setEditedLogStatus('')
    setEditedLogMessage('')
    setReport('')
    setSubscription('')
    setData({})
    setReportedStatus({ name: 'Not responding' })
  }

  const discardLogEdit = () => {
    setEditLog(false)
    setEditedLogStatus('')
    setEditedLogMessage('')
  }

  const getTooltipVersionDate = async () => {
    try {
      const vDate = await getVersionDate()
      if (vDate) setVersionDate(vDate)
    } catch (error) {
      console.error(error)
    }
  }

  const renderReportModal = () => {
    return (
      <Modal
        title={`Report an issue in ${String(getSystemData(report, 'name') || 'System')}`}
        onClose={discardChanges}>
        <div className="home__modal-issue-col">
          <Dropdown
            label='Type of issue'
            options={issueOptions}
            value={reportedStatus.name}
            selected={reportedStatus}
            setSelected={setReportedStatus}
            maxHeight='20vh'
            objKey='name'
          />
          <InputField
            label='Details (Optional)'
            name='message'
            value={data.message}
            updateData={updateData}
            type='textarea'
            placeholder='Describe the issue...'
            rows={5}
          />
        </div>
        <div className="home__modal-issue-btns">
          <Button
            label='Cancel'
            handleClick={discardChanges}
            bgColor={darkMode ? APP_COLORS.GRAY_ONE : APP_COLORS.GRAY_ONE}
            textColor='white'
            disabled={loading}
            style={{ width: '45%' }}
          />
          <Button
            label='Send Report'
            handleClick={sendReport}
            disabled={loading}
            bgColor={APP_COLORS.BLUE_TWO}
            textColor='white'
            style={{ width: '45%' }}
          />
        </div>
      </Modal>
    )
  }


  const renderSubscribeModal = () => {
    return (
      <Modal
        title={`Subscribe for updates in ${String(getSystemData(subscription, 'name') || 'this system')}`}
        onClose={discardChanges}>
        <div className="home__modal-issue-col">
          <InputField
            name='subscriberEmail'
            value={data.subscriberEmail}
            updateData={updateData}
            type='email'
            placeholder='your@email.com'
          />
        </div>
        <div className="home__modal-issue-btns">
          <Button
            label='Cancel'
            handleClick={discardChanges}
            bgColor={darkMode ? APP_COLORS.GRAY_ONE : APP_COLORS.GRAY_ONE}
            textColor='white'
            disabled={loading}
            style={{ width: '45%' }}
          />
          <Button
            label='Subscribe'
            handleClick={subscribeForUpdates}
            disabled={loading}
            bgColor={APP_COLORS.BLUE_TWO}
            textColor='white'
            style={{ width: '45%' }}
          />
        </div>
      </Modal>
    )
  }

  const openDownTimeModal = () => {
    setShowDowntime({
      ...getComingEvent(getDownTime(getSelectedSystem() || {})),
      ...getSelectedSystem(),
      index: 0
    })
  }

  const parseLink = (link: string) => {
    const [scheme, _, url] = link.split('/')
    if (!url) return ''
    return scheme + '//' + url + '/'
  }

  const renderSystemDetailsModal = () => {
    return (
      <Modal
        title={String(getSystemData(selected, 'name'))}
        logo={systemLogos[selected] || ''}
        showLogo
        onClose={discardChanges}
        linkTitle={parseLink(String(getSystemData(selected, 'url') || ''))}
        style={{ width: isMobile ? '' : '50vw' }}>
        {getDowntimeString() ?
          <div
            className={`home__modal-downtime${darkMode ? '--dark' : ''}`}
            onClick={openDownTimeModal}
            style={{
              backgroundColor: isLiveDowntime() ? darkMode ?
                'transparent' : '#ffdada' : darkMode ?
                'transparent' : '#f1f1f1',
              border: isLiveDowntime() || getSystemData(selected, 'name') === 'GitLab' ? '1px solid red' : darkMode ? '1px solid orange' : '1px solid transparent'
            }}>
            <p className='home__modal-downtime-text'>{getSystemData(selected, 'name') === 'GitLab' ? 'Decommission' : 'Planned downtime:'}</p>
            <p className='home__modal-downtime-text'>{getDowntimeString()}</p>
          </div>
          : ''}
        <div className="home__modal-downtime-row">
          <p className="home__modal-hours">Last two weeks</p>
        </div>
        <div className="home__modal-graph-wrapper">
          <div className='home__modal-graph'>
            <Line data={chartData} height={chartHeight} width={chartWidth} options={modalChartOptions} />
          </div>
        </div>
        {editLog ?
          <div className="home__modal-row" style={{ flexDirection: isMobile ? 'column' : 'row' }}>
            <Dropdown
              label='Status'
              options={['UP', 'DOWN']}
              value={editedLogStatus}
              selected={editedLogStatus}
              setSelected={setEditedLogStatus}
              maxHeight='20vh'
              style={{ minWidth: '7rem', width: isMobile ? '100%' : '' }}
            />
            <InputField
              label='Message'
              name='message'
              value={editedLogMessage}
              updateData={(_, e) => setEditedLogMessage(e.target.value)}
            />
            <Button
              label='Save Changes'
              handleClick={saveSelectedLog}
              bgColor={APP_COLORS.BLUE_TWO}
              textColor='white'
              style={{ width: isMobile ? '100%' : '45%' }}
              disabled={loading}
            />
            <Button
              label='Cancel'
              handleClick={discardLogEdit}
              bgColor={APP_COLORS.GRAY_ONE}
              textColor='white'
              style={{ width: isMobile ? '100%' : '45%' }}
              disabled={loading}
            />
          </div>
          :
          selectedLog !== -1 ?
            <div className="home__modal-row" style={{ justifyContent: 'flex-start' }}>
              <Button
                label='Edit Log'
                handleClick={() => setEditLog(true)}
                bgColor={APP_COLORS.ORANGE_ONE}
                textColor='white'
              // style={{ width: '45%' }}
              />
              <Button
                label='Remove Log'
                handleClick={removeSelectedLog}
                bgColor={APP_COLORS.RED_TWO}
                textColor='white'
              // style={{ width: '45%' }}
              />
            </div>
            : isSuper ?
              <Button
                label='Add Log'
                handleClick={() => setEditLog(true)}
                bgColor={APP_COLORS.BLUE_TWO}
                textColor='white'
                style={{ width: '2.5rem' }}
              /> : ''}
        <div className="home__modal-table" style={{ marginTop: '1rem' }}>
          <DataTable
            title={`Latest system logs (${statusAndAlerts.length})`}
            tableData={statusAndAlerts}
            setTableData={setStatusAndAlerts}
            tableHeaders={systemHisrotyHeaders}
            name='logs'
            loading={loading}
            max={getDowntimeString() ? 3 : 6}
            orderDataBy={hisrotyHeaders[0]}
            style={{ width: isMobile ? '80vw' : '100%' }}
            setSelected={isSuper ? setSelectedLog : undefined}
            selected={selectedLog}
          />
        </div>
        <div className="home__modal-footer">
          <h2
            className="systemcard__status"
            style={{
              color: getSystemData(selected, 'reportedlyDown')
                || getCurrentStatus(getSelectedSystem()) === 'BUSY' ? 'orange'
                : getCurrentStatus(getSelectedSystem()) ? darkMode ? '#00b000' : 'green' : 'red'
            }}>
            <img
              style={{
                filter: getSystemData(selected, 'reportedlyDown') || getCurrentStatus(getSelectedSystem()) === 'BUSY' ?
                  'invert(64%) sepia(97%) saturate(1746%) hue-rotate(359deg) brightness(101%) contrast(106%)'
                  : getCurrentStatus(getSelectedSystem()) ?
                    'invert(24%) sepia(100%) saturate(1811%) hue-rotate(97deg) brightness(93%) contrast(105%)' :
                    'invert(19%) sepia(87%) saturate(7117%) hue-rotate(358deg) brightness(97%) contrast(117%)'
              }}
              src={LiveIcon}
              alt="Live"
              className="systemcard__status-live" />&nbsp;&nbsp;Current status:&nbsp;<strong>
              {getSystemData(selected, 'reportedlyDown') ? 'Problem'
                : getCurrentStatus(getSelectedSystem()) === 'BUSY' ? 'BUSY'
                  : getCurrentStatus(getSelectedSystem()) ? 'UP' : 'DOWN'}
            </strong>
          </h2>
          {getLastCheck(getSelectedSystem()) ?
            <p
              style={{ color: darkMode ? 'lightgray' : 'gray' }}
              className="systemcard__status-caption">
              {getLastCheck(getSelectedSystem())}
            </p>
            :
            <div className='systemcard__buttons'>
              <Button
                handleClick={() => setSubscription(selected || '')}
                bgColor={darkMode ? '#353535' : '#dcdcdc'}
                textColor={darkMode ? 'lightgray' : '#323232'}
                svg={Subscribe}
                label={isMobile ? '' : 'Subscribe for updates'}
              />
              <Button
                handleClick={() => setReport(selected || '')}
                bgColor={darkMode ? '#353535' : '#dcdcdc'}
                textColor={darkMode ? 'lightgray' : '#323232'}
                svg={Report}
                label={isMobile ? '' : 'Report Issue'}
              />
            </div>
          }
        </div>
      </Modal>
    )
  }

  const renderDowntimeModal = () => {
    if (showDowntime) {
      const { system, start, end, note, index } = showDowntime

      return (
        <Modal
          title={(system?.name || getSystemData(selected, 'name')) === 'GitLab' ? 'Decommission' : 'Planned downtime:'}
          subtitle={system?.name || String(getSystemData(selected, 'name'))}
          onClose={discardChanges}>
          <div className="home__modal-col" style={{ margin: '1rem 0' }}>
            {(system?.name || getSystemData(selected, 'name')) === 'GitLab' ? '' :
              <p className={`home__modal-downtime-note${darkMode ? '--dark' : ''}`}>
                The system will probably be down between <strong>{getDate(start || '')}</strong> and <strong>{getDate(end || '')}</strong>.
              </p>}
            {note ?
              <>
                <strong>Reason</strong>
                <div className={`home__modal-downtime-note${darkMode ? '--dark' : ''}`} dangerouslySetInnerHTML={{ __html: note || '' }} />
              </>
              : ''}
          </div>
          <Button
            label='System Details'
            handleClick={() => {
              setShowDowntime(null)
              const systemCard = Array.from(document.querySelectorAll('.systemcard__graph'))[index || 0] as HTMLElement
              systemCard.click()
            }}
            textColor='white'
          />
        </Modal>
      )
    }
  }

  const renderSystemList = () => {
    return allSystems.length ?
      allSystems.map((system: systemType, i: number) =>
        system.name === 'TEST' ? '' :
          <SystemCard
            key={system._id || i}
            index={i}
            system={system}
            selected={selected}
            report={report}
            logo={systemLogos[system._id || '']}
            raw={systemRaw[system._id || '']}
            subscription={subscription}
            showDowntime={showDowntime}
            reportIssue={setReport}
            subscribe={setSubscription}
            history={getHistoryBySystem(system)}
            alerts={getAlertsBySystem(system)}
            setSelected={setSelected}
            setSelectedData={setChartData}
            setModalChartOptions={setModalChartOptions}
            downtime={getDownTime(system)}
            lastCheck={getLastCheck(system)}
            delay={String(i ? i / 10 : 0) + 's'}
            setShowDowntime={setShowDowntime}
          />)
      :
      Array.from({ length: 19 }).map((_, i) => <SystemCardPlaceholder key={i} delay={String(i ? i / 10 : 0) + 's'} />)
  }

  return (
    <div
      className={`home__container${darkMode ? '--dark' : ''}`}
      style={{ width: isLoggedIn ? '90vw' : '' }}>
      {showDowntime ? renderDowntimeModal()
        : report ? renderReportModal()
          : subscription ? renderSubscribeModal()
            : selected ? renderSystemDetailsModal() : ''}
      <div
        className="home__system-list"
        style={{ filter: subscription || showDowntime || report || selected ? 'blur(6px)' : '' }}>
        {renderSystemList()}
        <div className="home__system-list-separator"></div>
      </div>
      <div
        style={{
          filter: subscription || showDowntime || report || selected ? 'blur(6px)' : '',
          animation: subscription || showDowntime || report || selected ? 'none' : '',
          right: isLoggedIn ? '1rem' : 'unset',
          left: isLoggedIn ? 'unset' : '1rem'
        }}
        className="home__countdown">
        <CountdownCircleTimer
          key={countdownKey}
          isPlaying
          duration={60}
          colors={['#004777', '#F7B801', '#A30000', '#A30000']}
          colorsTime={[60, 15, 5, 0]}
          size={25}
          strokeWidth={2}
          onComplete={() => setCountdownKey(prev => prev + 1)}
        >
          {({ remainingTime }) => <p style={{ fontSize: '.8rem' }}>{remainingTime}</p>}
        </CountdownCircleTimer>
      </div>
      {!isLoggedIn && !isMobile ?
        <div className="home__app-version-container" style={{ filter: subscription || showDowntime || report || selected ? 'blur(6px)' : '' }}>
          <Tooltip tooltip={versionDate} boxStyle={{ marginRight: '1rem' }}>
            <p className="home__app-version">{APP_VERSION}</p>
          </Tooltip>
        </div>
        : ''}
    </div >
  )
}

export default React.memo(Home)