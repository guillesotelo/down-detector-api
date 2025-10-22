import axios from 'axios';
import { dataObj } from '../types';
import { getUser } from '../helpers';

const API_URL = process.env.REACT_APP_API_URL || ''

const getHeaders = () => {
    return { authorization: `Bearer ${getUser().token}` }
}

const getConfig = () => {
    return { headers: { authorization: `Bearer ${getUser().token}` } }
}

const getAllBuildLogs = async () => {
    try {
        const buildLogs = await axios.get(`${API_URL}/api/builds/getAll`, { headers: getHeaders() })
        return buildLogs.data
    } catch (err) { console.log(err) }
}

const getBuildLogById = async (_id: string) => {
    try {
        const buildLog = await axios.get(`${API_URL}/api/builds/getById`, { params: { _id }, headers: getHeaders() })
        return buildLog.data
    } catch (err) { console.log(err) }
}

const createBuildLog = async (data: dataObj) => {
    try {
        const buildLog = await axios.post(`${API_URL}/api/builds/create`, { ...data, user: getUser() }, getConfig())
        return buildLog.data
    } catch (err) { console.log(err) }
}

const updateBuildLog = async (data: dataObj) => {
    try {
        const buildLog = await axios.post(`${API_URL}/api/builds/update`, { ...data, user: getUser() }, getConfig())
        return buildLog.data
    } catch (err) { console.log(err) }
}

const deleteBuildLog = async (data: dataObj) => {
    try {
        const deleted = await axios.post(`${API_URL}/api/builds/remove`, { ...data, user: getUser() }, getConfig())
        return deleted.data
    } catch (err) { console.log(err) }
}

export {
    getAllBuildLogs,
    createBuildLog,
    getBuildLogById,
    updateBuildLog,
    deleteBuildLog,
}