import axios from 'axios';
import { historyType } from '../types';
import { getUser } from '../helpers';

const API_URL = process.env.REACT_APP_API_URL || ''

const getHeaders = () => {
    return { authorization: `Bearer ${getUser().token}` }
}

const getConfig = () => {
    return { headers: { authorization: `Bearer ${getUser().token}` } }
}

const getAllHistory = async (systemId?: string, getRaw?: boolean) => {
    try {
        const history = await axios.get(`${API_URL}/api/history/getAll`, { params: { systemId, getRaw }, headers: getHeaders() })
        return history.data
    } catch (err) { console.log(err) }
}

const getHistoryBySystemId = async (_id: string) => {
    try {
        const history = await axios.get(`${API_URL}/api/history/getBySystemId`, { params: { _id }, headers: getHeaders() })
        return history.data
    } catch (err) { console.log(err) }
}

const getHistoryById = async (_id: string) => {
    try {
        const history = await axios.get(`${API_URL}/api/history/getById`, { params: { _id }, headers: getHeaders() })
        return history.data
    } catch (err) { console.log(err) }
}

const createHistory = async (data: historyType) => {
    try {
        const history = await axios.post(`${API_URL}/api/history/create`, { ...data, user: getUser() }, getConfig())
        return history.data
    } catch (err) { console.log(err) }
}

const updateHistory = async (data: historyType) => {
    try {
        const history = await axios.post(`${API_URL}/api/history/update`, { ...data, user: getUser() }, getConfig())
        return history.data
    } catch (err) { console.log(err) }
}

const deleteHistory = async (data: historyType) => {
    try {
        const deleted = await axios.post(`${API_URL}/api/history/remove`, { ...data, user: getUser() }, getConfig())
        return deleted
    } catch (err) { console.log(err) }
}

export {
    getAllHistory,
    createHistory,
    getHistoryBySystemId,
    getHistoryById,
    updateHistory,
    deleteHistory,
}