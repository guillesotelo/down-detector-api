import { useContext, useEffect, useState } from 'react'
import DataTable from '../../components/DataTable/DataTable'
import { deleteUser, getAllSystems, getAllUsers, registerUser, updateUser } from '../../services'
import { userHeaders } from '../../constants/tableHeaders'
import { systemType, userType } from '../../types'
import { toast } from 'react-toastify'
import Modal from '../../components/Modal/Modal'
import InputField from '../../components/InputField/InputField'
import Button from '../../components/Button/Button'
import Switch from '../../components/Switch/Swith'
import Separator from '../../components/Separator/Separator'
import { AppContext } from '../../AppContext'
import { APP_COLORS } from '../../constants/app'
import Dropdown from '../../components/Dropdown/Dropdown'
import { useHistory } from 'react-router-dom'

type Props = {}

export default function Users({ }: Props) {
  const [data, setData] = useState<userType>({})
  const [newUser, setNewUser] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIsSuper, setSelectedIsSuper] = useState(false)
  const [onDeleteUser, setOnDeleteUser] = useState(false)
  const [selected, setSelected] = useState(-1)
  const [tableData, setTableData] = useState<userType[]>([])
  const [allSystems, setAllSystems] = useState<systemType[]>([])
  const [ownedSystems, setOwnedSystems] = useState<systemType[]>([])
  const { isLoggedIn, isSuper } = useContext(AppContext)
  const history = useHistory()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (isLoggedIn !== null && !isLoggedIn && !isSuper) return history.push('/')
  }, [isLoggedIn])

  useEffect(() => {
    if (selected !== -1 || newUser) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'auto'

    if (selected !== -1) {
      const select = tableData[selected]
      setData(select)
      setSelectedIsSuper(select.isSuper || false)

      setOwnedSystems(getOwnedSystems(select))
    }
  }, [selected, newUser])

  const loadData = async () => {
    getUsers()
    getSystems()
  }

  const getOwnedSystems = (user: userType) => {
    return allSystems.filter(system => {
      let owned = false
      system.owners?.forEach(owner => {
        if (owner._id === user._id) owned = true
      })
      return owned
    })
  }

  const getUsers = async () => {
    try {
      setLoading(true)
      const users = await getAllUsers()
      if (users && users.length) setTableData(users)
      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const getSystems = async () => {
    try {
      setLoading(true)
      const systems = await getAllSystems()
      if (systems && systems.length) setAllSystems(systems)
      setLoading(false)
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }


  const updateData = (key: string, e: any) => {
    const value = e.target.value
    setData({ ...data, [key]: value })
  }

  const discardChanges = () => {
    setData({})
    setNewUser(false)
    setSelected(-1)
    setSelectedIsSuper(false)
    setOnDeleteUser(false)
    setOwnedSystems([])
  }

  const checkErrors = () => {
    let errors: string[] = []
    if (!data.username || !data.username.trim().includes(' ')) errors.push('Enter your full name')
    if (!data.email || !data.email.includes('@') || !data.email.includes('.')) errors.push('Enter a valid email')
    if (!data.password || data.password.length < 6) errors.push('Password must contain at least 6 characters')
    if (!data.password2 || data.password2 !== data.password) errors.push(`Passwords don't match`)
    return errors
  }

  const removeUser = async () => {
    setLoading(true)
    try {
      const deleted = await deleteUser(tableData[selected])
      if (deleted) {
        toast.success('User deleted successfully')
        discardChanges()
        getUsers()
      }
      else toast.error('Error deleting user. Try again later')
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
      toast.error('Error deleting user. Try again later')
    }
  }

  const saveChanges = async () => {
    if (checkErrors().length) return checkErrors().map((error: string) => toast.error(error))
    setLoading(true)
    try {
      const userData: userType = {
        ...data,
        isSuper: selectedIsSuper,
        ownedSystems
      }
      if (data.password === '') delete data.password
      if (newUser) {
        const saved = await registerUser(userData)
        if (saved && saved._id) {
          toast.success('User created successfully')
          discardChanges()
          loadData()
        }
        else toast.error('Error creating user. Try again later')
      } else {
        if (!userData.password) delete userData.password
        delete userData._id
        const updated = await updateUser({ _id: data._id, newData: userData })
        if (updated && updated._id) {
          toast.success('User updated successfully')
          discardChanges()
          loadData()
        }
        else toast.error('Error updating user. Try again later')
      }
      setLoading(false)
    } catch (err) {
      toast.error('Error creating user. Try again later')
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="users__container">
      {newUser || selected !== -1 ? onDeleteUser ?
        <Modal onClose={discardChanges} title='Delete User'>
          <div className='users__delete-modal'>
            <p>Are you sure you want to delete user <strong>{tableData[selected].username}</strong>?</p>
            <div className="users__new-row">
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
                handleClick={removeUser}
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
          title={newUser ? 'New User' : 'User Details'}
          style={{ maxWidth: '20vw' }}>
          <div className="users__new">
            <InputField
              label='Full Name'
              name='username'
              updateData={updateData}
              value={data.username}
              placeholder='Mikael Bloom'
            />
            <InputField
              label='Email'
              name='email'
              updateData={updateData}
              value={data.email}
              placeholder='mikael.bloom@company.com'
            />
            <InputField
              label='Password'
              name='password'
              updateData={updateData}
              value={data.password}
              type='password'
              placeholder={data.password || data.password2 ? '' : '••••••••••'}
            />
            <InputField
              label='Repeat passowrd'
              name='password2'
              updateData={updateData}
              value={data.password2}
              type='password'
              placeholder={data.password || data.password2 ? '' : '••••••••••'}
            />
            <div className="users__new-row">
              <Switch
                label='Super User'
                value={selectedIsSuper}
                setValue={setSelectedIsSuper}
                on='Yes'
                off='No'
              />
              <Switch
                label='Build Tracker access'
                value={data.buildTrackerAccess || false}
                setValue={newVal => updateData('buildTrackerAccess', { target: { value: newVal } })}
                on='Yes'
                off='No'
              />
              <Dropdown
                label='Owned Systems'
                options={allSystems}
                value={ownedSystems}
                selected={ownedSystems}
                setSelected={setOwnedSystems}
                maxHeight='20vh'
                objKey='name'
                multiselect
                style={{ minWidth: '60%' }}
                loading={loading}
              />
            </div>
            <div className="users__new-row">
              <Button
                label='Close'
                handleClick={discardChanges}
                bgColor={APP_COLORS.GRAY_ONE}
                textColor='white'
                style={{ width: '45%' }}
                disabled={loading}
              />
              <Button
                label='Save Changes'
                handleClick={saveChanges}
                bgColor={APP_COLORS.BLUE_TWO}
                textColor='white'
                style={{ width: '45%' }}
                disabled={loading}
              />
            </div>
            <Separator />
            <Button
              label='Delete User'
              handleClick={() => setOnDeleteUser(true)}
              bgColor={APP_COLORS.RED_TWO}
              textColor='white'
              disabled={loading}
            />
          </div>
        </Modal>
        : ''}
      <div className="users__col" style={{ filter: selected !== -1 || newUser ? 'blur(10px)' : '' }}>
        <Button
          label='New User'
          handleClick={() => setNewUser(true)}
          bgColor={APP_COLORS.BLUE_TWO}
          textColor='white'
          disabled={loading}
        />
        <DataTable
          title='Users'
          tableData={tableData}
          setTableData={setTableData}
          tableHeaders={userHeaders}
          name='users'
          selected={selected}
          setSelected={setSelected}
          loading={loading}
        />
      </div>
    </div>
  )
}