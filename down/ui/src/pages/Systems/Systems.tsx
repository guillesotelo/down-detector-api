import { useContext, useEffect, useState } from 'react'
import Button from '../../components/Button/Button'
import DataTable from '../../components/DataTable/DataTable'
import { dataObj, eventType, onChangeEventType, systemType, userType } from '../../types'
import Modal from '../../components/Modal/Modal'
import InputField from '../../components/InputField/InputField'
import Dropdown from '../../components/Dropdown/Dropdown'
import {
  downtimeHeaders,
  systemHeaders,
  systemHeadersMobile,
} from '../../constants/tableHeaders'
import {
  intervalDefaultOptions,
  timeoutDefaultOptions
} from '../../constants/default'
import {
  createSystem,
  getAllSystems,
  updateSystem,
  deleteEvent,
  getAllEvents,
  deleteSystem,
  getAllUsers,
  getSystemsByOwnerId,
  updateSystemOrder,
  createSubscription
} from '../../services'
import { toast } from 'react-toastify'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Separator from '../../components/Separator/Separator'
import { AppContext } from '../../AppContext'
import { APP_COLORS } from '../../constants/app'
import { getDate, getTimeOption, getUser, sortArray } from '../../helpers'
import Switch from '../../components/Switch/Swith'
import { useHistory } from 'react-router-dom'
type Props = {}

export default function Systems({ }: Props) {
  const [data, setData] = useState<systemType>({})
  const [newSystem, setNewSystem] = useState(false)
  const [loading, setLoading] = useState(false)
  const [addDowntime, setAddDowntime] = useState(false)
  const [selected, setSelected] = useState(-1)
  const [selectedDowntime, setSelectedDowntime] = useState(-1)
  const [tableData, setTableData] = useState<systemType[]>([])
  const [typeOptions, setTypeOptions] = useState(['Detection', 'Other'])
  const [intervalOptions, setIntervalOptions] = useState(intervalDefaultOptions)
  const [timeoutOptions, setTimeoutOptions] = useState(timeoutDefaultOptions)
  const [alertsThreshold, setAlertsThreshold] = useState(Array.from({ length: 20 }, (_, i) => i + 1))
  const [alertsExpiration, setAlertsExpiration] = useState(Array.from({ length: 72 }, (_, i) => i + 1))
  const [selectedType, setSelectedType] = useState('')
  const [selectedInterval, setSelectedInterval] = useState({ name: '', value: 120000 })
  const [selectedTimeout, setSelectedTimeout] = useState({ name: '', value: 10000 })
  const [selectedThreshold, setSelectedThreshold] = useState(3)
  const [selectedAlertExpiration, setSelectedAlertExpiration] = useState(2)
  const [start, setStart] = useState<any>(null)
  const [end, setEnd] = useState<any>(null)
  const [openStartCalendar, setOpenStartCalendar] = useState(false)
  const [openEndCalendar, setOpenEndCalendar] = useState(false)
  const [downtimeArray, setDowntimeArray] = useState<any[]>([])
  const [onDeleteSystem, setOnDeleteSystem] = useState(false)
  const [allUsers, setAllUsers] = useState<userType[]>([])
  const [selectedOwners, setSelectedOwners] = useState<userType[]>([])
  const [showResponse, setShowResponse] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [firstStatus, setFirstStatus] = useState(true)
  const [changeOrder, setChangeOrder] = useState(false)
  const { isLoggedIn, isSuper, isMobile } = useContext(AppContext)
  const history = useHistory()
  const user = getUser()

  useEffect(() => {
    if (isLoggedIn !== null && !isLoggedIn) return history.push('/')
  }, [isLoggedIn])

  useEffect(() => {
    getSystems()
    getUsers()
  }, [isSuper])

  useEffect(() => {
    if (start && start.getHours() !== 0 && !end) {
      const newDate = new Date(start)
      newDate.setHours(newDate.getHours() + 1)
      setEnd(newDate)
    }
  }, [start, end])

  useEffect(() => {
    if (selected !== -1 || newSystem) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'auto'

    if (selected !== -1) {
      const select = tableData[selected]

      setData(select)
      getDowntimeData(select)
      if (select.type) setSelectedType(select.type)
      if (select.interval) setSelectedInterval(getTimeOption(intervalDefaultOptions, select.interval))
      if (select.timeout) setSelectedTimeout(getTimeOption(timeoutDefaultOptions, select.timeout))
      if (select.owners) setSelectedOwners(select.owners)
      if (select.alertThreshold) setSelectedThreshold(select.alertThreshold)
      if (select.alertsExpiration) setSelectedAlertExpiration(select.alertsExpiration)
      setIsActive(select.active || false)
      if (select.firstStatus) setFirstStatus(select.firstStatus)
    }
  }, [selected, newSystem])

  const getSystems = async () => {
    try {
      setLoading(true)
      const systems = isSuper ? await getAllSystems() : await getSystemsByOwnerId(user._id)
      if (systems && systems.length) setTableData(sortArray(systems, 'order'))
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.error(error)
    }
  }

  const getUsers = async () => {
    try {
      const users = isSuper ? await getAllUsers() : []
      if (users && users.length) setAllUsers(users)
    } catch (error) {
      setLoading(false)
      console.error(error)
    }
  }

  const getDowntimeData = async (system: systemType) => {
    const allDowntimes = await getAllEvents()
    if (allDowntimes && Array.isArray(allDowntimes) && allDowntimes.length) {
      setDowntimeArray(allDowntimes.filter((downtime: eventType) => downtime.systemId === system._id))
    }
  }

  const updateData = (key: string, e: onChangeEventType) => {
    const value = e.target.value
    setData({ ...data, [key]: value })
  }

  const discardChanges = () => {
    setData({})
    setNewSystem(false)
    setSelected(-1)
    setAddDowntime(false)
    setSelectedType('')
    setSelectedInterval({ name: '', value: 120000 })
    setSelectedTimeout({ name: '', value: 10000 })
    setDowntimeArray([])
    setSelectedDowntime(-1)
    setOnDeleteSystem(false)
    setSelectedOwners([])
    setSelectedThreshold(3)
    setSelectedAlertExpiration(2)
    setShowResponse(false)
    setIsActive(true)
    setFirstStatus(true)
  }

  const saveChanges = async (dtArray?: systemType[]) => {
    setLoading(true)
    const user = getUser()
    try {
      const systemData = {
        ...data,
        type: data.customType || selectedType,
        interval: selectedInterval.value,
        timeout: selectedTimeout.value,
        alertThreshold: selectedThreshold,
        alertsExpiration: selectedAlertExpiration,
        selectedOwners,
        updatedBy: user.username || '',
        downtimeArray: Array.isArray(dtArray) ? dtArray : downtimeArray,
        active: isActive,
        firstStatus
      }
      if (newSystem) {
        const saved = await createSystem(systemData)
        if (saved && saved._id) {
          toast.success('System created successfully')
          discardChanges()
          getSystems()
        }
        else toast.error('Error creating system. Try again later')
      } else {
        const updated = await updateSystem(systemData)
        if (updated && updated._id) {
          toast.success('System updated successfully')
          discardChanges()
          getSystems()
        }
        else toast.error('Error updating system. Try again later')
      }
      setLoading(false)
      localStorage.removeItem('localSystems')
      localStorage.removeItem('localEvents')
    } catch (err) {
      toast.error(`Error ${newSystem ? 'creating' : 'updating'} system. Try again later`)
      console.error(err)
      setLoading(false)
    }
  }

  const checkErrors = () => {
    const errors = []
    if (!start) errors.push('Select start date')
    if (!end) errors.push('Select end date')
    if (new Date(end).getTime() <= new Date().getTime()) errors.push('Wrong end date')
    if (new Date(end).getTime() <= new Date(start).getTime()) errors.push('End date should be after start date')
    return errors
  }

  const saveDowntime = async () => {
    try {
      const errors = checkErrors()
      if (errors.length) return errors.map((error: string) => toast.error(error))

      const user = getUser()
      if (selectedDowntime !== -1) {
        const newArr = [...downtimeArray]
        newArr[selectedDowntime] = {
          ...downtimeArray[selectedDowntime],
          start,
          end,
          updatedBy: user.username || '',
          note: data.downtimeNote,
          url: data.url || ''
        }
        await saveChanges(newArr)
      } else await saveChanges(downtimeArray.concat({
        start,
        end,
        updatedBy: user.username || '',
        note: data.downtimeNote,
        url: data.url || ''
      }))

      setAddDowntime(false)
      setSelectedDowntime(-1)
      setStart(null)
      setEnd(null)
    } catch (error) {
      console.error(error)
    }
  }

  const removeDowntime = async () => {
    try {
      const removed = await deleteEvent(downtimeArray[selectedDowntime])
      if (removed) {
        toast.success('Downtime removed successfully')
        setSelectedDowntime(-1)
        getDowntimeData(data)
        localStorage.removeItem('localSystems')
        localStorage.removeItem('localEvents')
      }
      else toast.error('Error removing downtime')
    } catch (error) {
      toast.error('Error removing downtime')
      console.error(error)
    }
  }

  const editDowntime = () => {
    const downtime = downtimeArray[selectedDowntime]
    setStart(new Date(downtime.start))
    setEnd(new Date(downtime.end))
    setData({ ...data, downtimeNote: downtime.note })
    setAddDowntime(true)
  }

  const removeSystem = async () => {
    setLoading(true)
    try {
      const deleted = await deleteSystem(tableData[selected])
      if (deleted) {
        toast.success('System deleted successfully')
        discardChanges()
        getSystems()
        localStorage.removeItem('localSystems')
        localStorage.removeItem('localEvents')
      }
      else toast.error('Error deleting system. Try again later')
      setLoading(false)
    } catch (err) {
      toast.error('Error deleting system. Try again later')
      console.error(err)
      setLoading(false)
    }
  }

  const saveTableDataOrder = async (items: systemType[]) => {
    try {
      setLoading(true)
      const updatedSystems = await updateSystemOrder(items.map((item, i) => { return { ...item, order: i } }))
      if (updatedSystems && updatedSystems.length) {
        setTableData(updatedSystems)
        toast.success('Order updated successfully')
      }
      else toast.error('Error updating order')
      setLoading(false)
    } catch (error) {
      setLoading(false)
      toast.error('Error updating order')
      console.error(error)
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

      const subscriptionData = {
        ...data,
        systemId: data._id,
        email: data.subscriberEmail,
        username: user.username || (data.subscriberEmail?.split('@')[0]) || '',
        isOwner: true
      }

      const subscribed = await createSubscription(subscriptionData)
      if (subscribed && subscribed._id) {
        toast.success('Subscribed successfully')
        discardChanges()
        getSystems()
      } else toast.error('Subscription error. Please Try again.')
      setLoading(false)
    } catch (error) {
      toast.error('Subscription error. Please Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="systems__container">
      {newSystem || selected !== -1 ? onDeleteSystem ?
        <Modal onClose={discardChanges} title='Delete System'>
          <div className='users__delete-modal'>
            <p>Are you sure you want to delete system <strong>{tableData[selected].name}</strong>?</p>
            <div className="systems__new-row">
              <Button
                label='Cancel'
                handleClick={discardChanges}
                bgColor={APP_COLORS.GRAY_ONE}
                textColor='white'
                style={{ width: '45%' }}
                disabled={loading}
              />
              <Button
                label='Confirm'
                handleClick={removeSystem}
                bgColor={APP_COLORS.BLUE_TWO}
                textColor='white'
                style={{ width: '45%' }}
                disabled={loading}
              />
            </div>
          </div>
        </Modal>
        :
        <Modal
          onClose={discardChanges}
          title={newSystem ? 'New System' : 'System Details'}
          style={{ maxWidth: '50vw' }}
        >
          <div className="systems__new">
            <div className="systems__new-row">
              <InputField
                label='Name'
                name='name'
                updateData={updateData}
                value={data.name}
                disabled={!isSuper}
                placeholder='Write system name...'
              />
              {!isSuper ? '' :
                <InputField
                  label='Logo URL (optional)'
                  name='logo'
                  updateData={updateData}
                  value={data.logo}
                  disabled={!isSuper}
                  placeholder='https://system-logo.png'
                />}
            </div>
            <div className="systems__new-row">
              <InputField
                label='URL'
                name='url'
                updateData={updateData}
                value={data.url}
                disabled={!isSuper}
                placeholder='https://...'
              />
              {isSuper ?
                <Switch
                  label='Active'
                  value={isActive}
                  setValue={setIsActive}
                  on='Yes'
                  off='No'
                /> : ''}
            </div>
            <div className="systems__new-row">
              {isSuper ?
                <Dropdown
                  label='Owner'
                  options={allUsers}
                  value={selectedOwners}
                  selected={selectedOwners}
                  setSelected={setSelectedOwners}
                  maxHeight='20vh'
                  objKey='username'
                  style={{ width: '100%' }}
                  multiselect
                  loading={loading}
                />
                : <InputField
                  label='Owner'
                  name='owner'
                  updateData={updateData}
                  disabled
                  value={user.username}
                />}
              {!isSuper && !data.description ? '' :
                <InputField
                  label={`Description ${isSuper ? '(optional)' : ''}`}
                  name='description'
                  updateData={updateData}
                  value={data.description}
                  disabled={!isSuper}
                  placeholder='Write a description...'
                />}
            </div>
            {isSuper ?
              <div className="systems__new-row">
                <Dropdown
                  label='Type'
                  options={typeOptions}
                  value={selectedType}
                  selected={selectedType}
                  setSelected={setSelectedType}
                  maxHeight='20vh'
                  style={{ width: '100%' }}
                  loading={loading}
                />
                {selectedType === 'Other' ?
                  <InputField
                    label='Describe type'
                    name='customType'
                    updateData={updateData}
                    value={data.customType}
                    placeholder='Write something...'
                  />
                  : ''}
                {/* <Dropdown
                  label='Interval'
                  options={intervalOptions}
                  value={selectedInterval.name}
                  selected={selectedInterval}
                  setSelected={setSelectedInterval}
                  maxHeight='20vh'
                  objKey='name'
                  style={{ width: '100%' }}
                  loading={loading}
                /> */}
                <Dropdown
                  label='Timeout'
                  options={timeoutOptions}
                  value={selectedTimeout.name}
                  selected={selectedTimeout}
                  setSelected={setSelectedTimeout}
                  maxHeight='20vh'
                  objKey='name'
                  style={{ width: '100%' }}
                  loading={loading}
                />
              </div> : ''}
            {isSuper ?
              <div className="systems__new-row">
                <Dropdown
                  label='User Alerts Threshold'
                  options={alertsThreshold}
                  value={selectedThreshold}
                  selected={selectedThreshold}
                  setSelected={setSelectedThreshold}
                  maxHeight='20vh'
                  style={{ width: '100%' }}
                  loading={loading}
                />
                <Dropdown
                  label='User Alerts Expiration (hours)'
                  options={alertsExpiration}
                  value={selectedAlertExpiration}
                  selected={selectedAlertExpiration}
                  setSelected={setSelectedAlertExpiration}
                  maxHeight='20vh'
                  style={{ width: '100%' }}
                  loading={loading}
                />
                <Button
                  label={showResponse ? 'Hide Response' : 'Show Response'}
                  handleClick={() => setShowResponse(!showResponse)}
                  bgColor={showResponse ? APP_COLORS.GRAY_ONE : APP_COLORS.BLUE_TWO}
                  textColor='white'
                  style={{ width: '45%' }}
                  disabled={loading && addDowntime}
                />
                {/* {user.email === 'gsotelo@company.com' ?
                  <Switch
                    label='First Status'
                    value={firstStatus}
                    setValue={setFirstStatus}
                    on='1'
                    off='0'
                  /> : ''} */}
              </div> : ''}
            <div className="systems__new-downtime">
              {showResponse ?
                <InputField
                  label='JSON Response'
                  name='raw'
                  updateData={updateData}
                  value={data.raw}
                  disabled
                  type='textarea'
                  rows={6}
                />
                : !addDowntime ?
                  <DataTable
                    title='Planned downtime'
                    tableData={downtimeArray}
                    setTableData={setDowntimeArray}
                    tableHeaders={downtimeHeaders}
                    name='downtime'
                    selected={selectedDowntime}
                    setSelected={setSelectedDowntime}
                    loading={loading}
                  />
                  : ''}
              {addDowntime ?
                <div>
                  <h4 className="systems__new-downtime-title">{selectedDowntime !== -1 ? 'Edit Downtime' : 'New Downtime'}</h4>
                  <div className="systems__new-row" style={{
                    justifyContent: openStartCalendar ? 'left' : openEndCalendar ? 'right' : ''
                  }}>
                    {openStartCalendar ?
                      <DatePicker
                        selected={start}
                        onChange={setStart}
                        showTimeSelect
                        timeCaption="time"
                        timeFormat="HH:mm"
                        inline
                      />
                      : ''
                    }
                    {openEndCalendar ?
                      <DatePicker
                        selected={end}
                        onChange={setEnd}
                        showTimeSelect
                        timeCaption="time"
                        timeFormat="HH:mm"
                        inline
                      />
                      : ''
                    }
                  </div>
                  <div className="systems__new-row">
                    <Button
                      label={openStartCalendar ? 'Confirm Start' : start ? 'Start: ' + getDate(start) : 'Select Start'}
                      handleClick={() => setOpenStartCalendar(!openStartCalendar)}
                      bgColor={APP_COLORS.ORANGE_ONE}
                      textColor='white'
                      style={{ width: '45%' }}
                      disabled={loading || openEndCalendar}
                    />
                    <Button
                      label={openEndCalendar ? 'Confirm End' : end ? 'End: ' + getDate(end) : 'Select End'}
                      handleClick={() => setOpenEndCalendar(!openEndCalendar)}
                      bgColor={APP_COLORS.ORANGE_ONE}
                      textColor='white'
                      style={{ width: '45%' }}
                      disabled={loading || openStartCalendar}
                    />
                  </div>
                  <InputField
                    label='Note (accepts HTML)'
                    name='downtimeNote'
                    updateData={updateData}
                    value={data.downtimeNote}
                    placeholder='Write the downtime reason...'
                    type='textarea'
                    rows={3}
                  />
                </div>
                : ''}
              {!showResponse ?
                <div className="systems__new-row">
                  <Button
                    label={addDowntime ? 'Discard' : 'New Downtime'}
                    handleClick={() => {
                      setData({ ...data, downtimeNote: '' })
                      setSelectedDowntime(-1)
                      setStart(null)
                      setEnd(null)
                      setAddDowntime(!addDowntime)
                    }}
                    bgColor={addDowntime ? APP_COLORS.GRAY_ONE : APP_COLORS.ORANGE_ONE}
                    textColor='white'
                    style={{ width: '45%' }}
                    disabled={loading}
                  />
                  {addDowntime ?
                    <Button
                      label={selectedDowntime !== -1 ? 'Save Downtime' : 'Add'}
                      handleClick={saveDowntime}
                      bgColor={APP_COLORS.BLUE_TWO}
                      textColor='white'
                      disabled={!start || !end || !data.downtimeNote || loading}
                      style={{ width: '45%' }}
                    /> : ''}
                  {!addDowntime && selectedDowntime !== -1 ?
                    <>
                      <Button
                        label='Edit'
                        handleClick={editDowntime}
                        bgColor={APP_COLORS.BLUE_TWO}
                        textColor='white'
                        style={{ width: '22.5%' }}
                        disabled={loading}
                      />
                      <Button
                        label='Remove'
                        handleClick={removeDowntime}
                        bgColor={APP_COLORS.RED_TWO}
                        textColor='white'
                        style={{ width: '22.5%' }}
                        disabled={loading}
                      />
                    </> : ''}
                </div> : ''}
            </div>
            {!addDowntime && selectedDowntime === -1 ?
              <div className="systems__new-row" style={{ marginTop: '1rem' }}>
                <Button
                  label='Close'
                  handleClick={discardChanges}
                  bgColor={APP_COLORS.GRAY_ONE}
                  textColor='white'
                  style={{ width: '45%' }}
                  disabled={loading}
                />
                {data.unsubscriptions && JSON.parse(data.unsubscriptions || '[]').includes(user.email) ?
                  <Button
                    label='Subscribe for updates'
                    handleClick={subscribeForUpdates}
                    bgColor={APP_COLORS.BLUE_TWO}
                    textColor='white'
                    style={{ width: '45%' }}
                    disabled={loading}
                  /> : ''}
                <Button
                  label='Save Changes'
                  handleClick={saveChanges}
                  bgColor={APP_COLORS.BLUE_TWO}
                  textColor='white'
                  style={{ width: '45%' }}
                  disabled={loading}
                />
              </div>
              : ''}
            {isSuper && !newSystem && !addDowntime && selectedDowntime === -1 ?
              <>
                <Separator />
                <Button
                  label='Delete System'
                  handleClick={() => setOnDeleteSystem(true)}
                  bgColor={APP_COLORS.RED_TWO}
                  textColor='white'
                  disabled={loading}
                />
              </>
              : ''}
          </div>
        </Modal>
        : ''}
      <div className="systems__col" style={{ filter: selected !== -1 || newSystem ? 'blur(10px)' : '' }}>
        <div className='systems__row' style={{ alignItems: 'flex-end' }}>
          {isSuper ?
            <>
              <Button
                label='New System'
                handleClick={() => setNewSystem(true)}
                bgColor={APP_COLORS.BLUE_TWO}
                textColor='white'
                disabled={loading}
              />
              <Switch
                label='Change Order'
                value={changeOrder}
                setValue={setChangeOrder}
                on='Yes'
                off='No'
                style={{ marginLeft: '1rem' }}
              />
            </> : ''}
          {!isMobile && changeOrder && showTooltip && isSuper ? <p className='systems__tooltip'>👇 Drag & Drop systems to set the order in Dashboard</p> : ''}
        </div>
        <div style={{ width: 'inherit' }} onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
          <DataTable
            title='Systems'
            tableData={tableData}
            setTableData={setTableData}
            tableHeaders={isMobile ? systemHeadersMobile : systemHeaders}
            name='systems'
            selected={selected}
            setSelected={setSelected}
            loading={loading}
            max={18}
            draggable={isSuper && changeOrder}
            saveTableDataOrder={saveTableDataOrder}
          />
        </div>
      </div>
    </div>
  )
}