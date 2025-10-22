import { useContext, useEffect, useState } from 'react'
import InputField from '../../components/InputField/InputField'
import Button from '../../components/Button/Button'
import { loginUser } from '../../services'
import { toast } from 'react-toastify'
import { useHistory } from 'react-router-dom'
import { AppContext } from '../../AppContext'
import { APP_COLORS } from '../../constants/app'
import { onChangeEventType } from '../../types'

type Props = {}

export default function Login({ }: Props) {
    const [data, setData] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [dataOk, setDataOk] = useState(false)
    const [logged, setLogged] = useState(false)
    const history = useHistory()
    const { setIsLoggedIn, setIsSuper, darkMode } = useContext(AppContext)

    useEffect(() => {
        setDataOk(checkData())
    }, [data])

    const updateData = (key: string, e: onChangeEventType) => {
        const value = e.target.value
        setData({ ...data, [key]: value })
    }

    const login = async () => {
        try {
            const logged = await loginUser(data)
            if (logged) {
                setLogged(true)
                toast.success(`Welcome back, ${logged.username ? logged.username.split(' ')[0] : 'admin'}`)
                setTimeout(() => {
                    setIsLoggedIn(true)
                    setIsSuper(logged.isSuper)
                    history.push('/')
                }, 2000)
            }
            else toast.error('Check your credentials and try again.')
            setLoading(false)
        } catch (err) {
            toast.error('Login Error. Please try again.')
            console.error(err)
            setLoading(false)
        }
    }

    const checkData = () => {
        if (data.email &&
            data.password &&
            data.email.includes('@') &&
            data.email.includes('.') &&
            data.password.length > 4) return true
        return false
    }

    return (
        <div className="login__container">
            <div className={`login__box${darkMode ? '--dark' : ''}`}>
                <h2 className='account__details-title'>Sign In</h2>
                <InputField
                    label="Email"
                    name='email'
                    value={data.email}
                    updateData={updateData}
                    placeholder='your.email@company.com'
                />
                <InputField
                    label="Password"
                    name='password'
                    value={data.password}
                    updateData={updateData}
                    type='password'
                    onSubmit={login}
                />
                <div className="login__btns">
                    <Button
                        label='Cancel'
                        handleClick={() => history.push('/')}
                        bgColor={APP_COLORS.GRAY_ONE}
                        style={{ width: '45%' }}
                        disabled={logged}
                        textColor='white'
                    />
                    <Button
                        label={loading ? 'Loggin in...' : 'Login'}
                        handleClick={login}
                        disabled={!dataOk || logged}
                        bgColor={APP_COLORS.BLUE_TWO}
                        textColor='white'
                        style={{ width: '45%' }}
                    />
                </div>
            </div>
        </div>
    )
}