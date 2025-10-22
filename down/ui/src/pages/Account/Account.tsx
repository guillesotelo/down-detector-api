import React, { useContext, useEffect, useState } from 'react'
import { AppContextType, onChangeEventType, systemType, userType } from '../../types'
import InputField from '../../components/InputField/InputField'
import Button from '../../components/Button/Button'
import { toast } from 'react-toastify'
import { updateUser } from '../../services'
import UserIcon from '../../assets/icons/user-icon.svg'
import MoonLoader from "react-spinners/MoonLoader"
import { useHistory } from 'react-router-dom'
import { AppContext, AppProvider } from '../../AppContext'
import TextData from '../../components/TextData/TextData'
import { APP_COLORS } from '../../constants/app'
import { getUser } from '../../helpers'

type Props = {}

export default function Account({ }: Props) {
  const [data, setData] = useState<userType>({})
  const [loading, setLoading] = useState(false)
  const [loggedOut, setLoggedOut] = useState(false)
  const [dataIsUpdated, setDataIsUpdated] = useState(false)
  const [edit, setEdit] = useState(false)
  const { isLoggedIn, setIsLoggedIn, darkMode, setIsSuper, isMobile } = useContext(AppContext) as AppContextType
  const history = useHistory()

  useEffect(() => {
    getUserData()
  }, [])

  useEffect(() => {
    if (isLoggedIn !== null && !isLoggedIn) return history.push('/')
  }, [isLoggedIn])

  const getUserData = () => {
    const user = getUser()
    if (user._id) {
      delete user.password
      setData(user)
    }
  }

  const updateData = (key: string, e: onChangeEventType) => {
    const value = e.target.value
    setData({ ...data, [key]: value })
    setDataIsUpdated(true)
  }

  const discardChanges = () => {
    history.go(0)
  }

  const checkErrors = () => {
    let errors: string[] = []
    if (!data.username || !data.username.trim().includes(' ')) errors.push('Enter your full name')
    if (!data.email || !data.email.includes('@') || !data.email.includes('.')) errors.push('Enter a valid email')
    if (!data.password || data.password.length < 6) errors.push('Password must contain at least 6 characters')
    if (!data.password2 || data.password2 !== data.password) errors.push(`Passwords don't match`)
    return errors
  }

  const saveChanges = async () => {
    if (checkErrors().length) return checkErrors().map((error: string) => toast.error(error))
    setLoading(true)
    try {
      const newData = { ...data }
      delete newData._id

      const updated = await updateUser({ _id: data._id, newData })
      if (updated && updated._id) {
        toast.success('User updated successfully')
        getUserData()
      }
      else toast.error('Error updating system. Try again later')
      setLoading(false)
    } catch (err) {
      toast.error('Error updating system. Try again later')
      console.error(err)
      setLoading(false)
    }
  }

  const logout = () => {
    setLoggedOut(true)
    toast.info('See you later!')
    setTimeout(() => {
      setIsLoggedIn(false)
      setIsSuper(false)
      const mode = localStorage.getItem('preferredMode')
      localStorage.clear()
      localStorage.setItem('preferredMode', mode || 'true')
      history.push('/')
    }, 1500)
  }

  const getOwnedSystemNames = () => {
    const { systems } = getUser()
    return systems && systems.length && typeof systems[0] !== 'string' ?
      systems.map((system: systemType) => system.name).join(', ')
      : 'No systems owned'
  }

  return (
    <div className="account__container">
      {loading ? <MoonLoader color='#0057ad' size={50} />
        :
        <div className={`account__details${darkMode ? '--dark' : ''}`}>
          <h2 className='account__details-title'>Account Information</h2>
          {!isMobile ? <img src={UserIcon} alt="User Profile" className={`account__details-icon${darkMode ? '--dark' : ''}`} draggable={false} /> : ''}
          {edit ?
            <>
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
              />
              <InputField
                label='Repeat passowrd'
                name='password2'
                updateData={updateData}
                value={data.password2}
                type='password'
              />
              <div
                className="account__details-row"
                style={{
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '.5rem' : ''
                }}
              >
                <Button
                  label='Discard Changes'
                  handleClick={discardChanges}
                  bgColor={APP_COLORS.GRAY_ONE}
                  textColor='white'
                  style={{ width: isMobile ? '100%' : '45%' }}
                />
                <Button
                  label='Save Changes'
                  handleClick={saveChanges}
                  bgColor={APP_COLORS.ORANGE_ONE}
                  textColor='white'
                  style={{ width: isMobile ? '100%' : '45%' }}
                  disabled={!dataIsUpdated}
                />
              </div>
            </>
            :
            <>
              <TextData label='Full Name' value={data.username} />
              <TextData label='Email' value={data.email} />
              <TextData label='User Type' value={data.isSuper ? 'Super' : 'System Owner'} />
              <TextData label='Owned Systems' value={getOwnedSystemNames()} />
            </>
          }

          {edit ?
            <Button
              label='Logout'
              handleClick={logout}
              disabled={loggedOut}
              bgColor={APP_COLORS.BLUE_TWO}
              textColor='white'
              style={{ width: '100%' }}
            />
            :
            <div className="account__details-row">
              <Button
                label='Edit Details'
                handleClick={() => setEdit(true)}
                bgColor={APP_COLORS.ORANGE_ONE}
                textColor='white'
                style={{ width: '45%' }}
                disabled={loggedOut}
              />
              <Button
                label='Logout'
                handleClick={logout}
                disabled={loggedOut}
                bgColor={APP_COLORS.BLUE_TWO}
                textColor='white'
                style={{ width: '45%' }}
              />
            </div>}
        </div>
      }
    </div>
  )
}