import axios from 'axios';
import { userType } from '../types';
import { getUser } from '../helpers';

const API_URL = process.env.REACT_APP_API_URL || ''

const getHeaders = () => {
    return { authorization: `Bearer ${getUser().token}` }
}

const getConfig = () => {
    return { headers: { authorization: `Bearer ${getUser().token}` } }
}

const loginUser = async (user: userType) => {
    try {
        const res = await axios.post(`${API_URL}/api/user/login`, user)
        const finalUser = res.data
        localStorage.setItem('user', JSON.stringify({
            ...finalUser,
            app: '{process.env.APP_NAME}',
            login: new Date()
        }))
        return finalUser
    } catch (error) { console.log(error) }
}

const verifyToken = async () => {
    try {
        const loggedUser = getUser()
        if (loggedUser.email) {
            const verify = await axios.post(`${API_URL}/api/user/verify`, loggedUser, getConfig())
            return verify.data
        }
        return null
    } catch (err) { }
}

const registerUser = async (data: userType) => {
    try {
        const newUser = await axios.post(`${API_URL}/api/user/create`, { ...data, user: getUser() }, getConfig())
        return newUser.data
    } catch (err) { console.error(err) }
}

const getAllUsers = async () => {
    try {
        const users = await axios.get(`${API_URL}/api/user/getAll`, { headers: getHeaders() })
        return users.data
    } catch (err) { console.log(err) }
}

const updateUser = async (data: userType) => {
    try {
        const updated = await axios.post(`${API_URL}/api/user/update`, { ...data, user: getUser() }, getConfig())
        const localUser = JSON.parse(localStorage.getItem('user') || '{}')
        if (updated.data._id === localUser._id) {
            localStorage.setItem('user', JSON.stringify({
                ...localUser,
                ...updated.data
            }))
        }
        return updated.data
    } catch (err) { console.error(err) }
}

const deleteUser = async (data: userType) => {
    try {
        const deleted = await axios.post(`${API_URL}/api/user/remove`, { ...data, user: getUser() }, getConfig())
        return deleted.data
    } catch (err) { console.log(err) }
}

export {
    loginUser,
    verifyToken,
    registerUser,
    updateUser,
    getAllUsers,
    deleteUser
}