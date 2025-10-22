import axios from 'axios';
import { alertType } from '../types';
import { getUser } from '../helpers';

const API_URL = process.env.REACT_APP_API_URL || ''

const getHeaders = () => {
    return { authorization: `Bearer ${getUser().token}` }
}

const getConfig = () => {
    return { headers: { authorization: `Bearer ${getUser().token}` } }
}

const getAllAlerts = async (systemId?: string) => {
    try {
        const userAlert = await axios.get(`${API_URL}/api/userAlert/getAll`, { params: { systemId }, headers: getHeaders() })
        return userAlert.data
    } catch (err) { console.log(err) }
}

const getUserAlertBySystemId = async (_id: string) => {
    try {
        const userAlert = await axios.get(`${API_URL}/api/userAlert/getBySystemId`, { params: { _id }, headers: getHeaders() })
        return userAlert.data
    } catch (err) { console.log(err) }
}

const getUserAlertById = async (_id: string) => {
    try {
        const userAlert = await axios.get(`${API_URL}/api/userAlert/getById`, { params: { _id }, headers: getHeaders() })
        return userAlert.data
    } catch (err) { console.log(err) }
}

const createUserAlert = async (data: alertType) => {
    try {
        const userAlert = await axios.post(`${API_URL}/api/userAlert/create`, { ...data, user: getUser() }, getConfig())
        return userAlert.data
    } catch (err) { console.log(err) }
}

const updateUserAlert = async (data: alertType) => {
    try {
        const userAlert = await axios.post(`${API_URL}/api/userAlert/update`, { ...data, user: getUser() }, getConfig())
        return userAlert.data
    } catch (err) { console.log(err) }
}

const deleteUserAlert = async (data: alertType) => {
    try {
        const deleted = await axios.post(`${API_URL}/api/userAlert/remove`, { ...data, user: getUser() }, getConfig())
        return deleted
    } catch (err) { console.log(err) }
}

export {
    getAllAlerts,
    createUserAlert,
    getUserAlertBySystemId,
    getUserAlertById,
    updateUserAlert,
    deleteUserAlert,
}