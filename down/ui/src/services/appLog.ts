import axios from 'axios';
import { logType } from '../types';
import { getUser } from '../helpers';

const API_URL = process.env.REACT_APP_API_URL || ''

const getHeaders = () => {
    return { authorization: `Bearer ${getUser().token}` }
}

const getConfig = () => {
    return { headers: { authorization: `Bearer ${getUser().token}` } }
}

const getAllLogs = async () => {
    try {
        const appLogs = await axios.get(`${API_URL}/api/appLog/getAll`, { headers: getHeaders() })
        return appLogs.data
    } catch (err) { console.log(err) }
}

const getLogById = async (_id: string) => {
    try {
        const appLog = await axios.get(`${API_URL}/api/appLog/getById`, { params: { _id }, headers: getHeaders() })
        return appLog.data
    } catch (err) { console.log(err) }
}

const createLog = async (data: logType) => {
    try {
        const appLog = await axios.post(`${API_URL}/api/appLog/create`, { ...data, user: getUser() }, getConfig())
        return appLog.data
    } catch (err) { console.log(err) }
}

const updateLog = async (data: logType) => {
    try {
        const appLog = await axios.post(`${API_URL}/api/appLog/update`, { ...data, user: getUser() }, getConfig())
        return appLog.data
    } catch (err) { console.log(err) }
}

const deleteLog = async (data: logType) => {
    try {
        const deleted = await axios.post(`${API_URL}/api/appLog/remove`, { ...data, user: getUser() }, getConfig())
        return deleted.data
    } catch (err) { console.log(err) }
}

export {
    getAllLogs,
    createLog,
    getLogById,
    updateLog,
    deleteLog,
}