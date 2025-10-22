import axios from 'axios';
import { configType } from '../types';
import { getUser } from '../helpers';

const API_URL = process.env.REACT_APP_API_URL || ''

const getHeaders = () => {
    return { authorization: `Bearer ${getUser().token}` }
}

const getConfig = () => {
    return { headers: { authorization: `Bearer ${getUser().token}` } }
}

const getAllConfigs = async () => {
    try {
        const configs = await axios.get(`${API_URL}/api/config/getAll`, { headers: getHeaders() })
        return configs.data
    } catch (err) { console.log(err) }
}

const getConfigById = async (_id: string) => {
    try {
        const config = await axios.get(`${API_URL}/api/config/getById`, { params: { _id }, headers: getHeaders() })
        return config.data
    } catch (err) { console.log(err) }
}

const getVersionDate = async () => {
    try {
        const config = await axios.get(`${API_URL}/api/config/getVersionDate`, { headers: getHeaders() })
        return config.data
    } catch (err) { console.log(err) }
}

const createConfig = async (data: configType) => {
    try {
        const config = await axios.post(`${API_URL}/api/config/create`, { ...data, user: getUser() }, getConfig())
        return config.data
    } catch (err) { console.log(err) }
}

const updateConfig = async (data: configType) => {
    try {
        const config = await axios.post(`${API_URL}/api/config/update`, { ...data, user: getUser() }, getConfig())
        if (config.data && config.data._id) {
            const user = getUser()
            localStorage.setItem('user', { ...user, config: config.data })
        }
        return config.data
    } catch (err) { console.log(err) }
}

const deleteConfig = async (data: configType) => {
    try {
        const deleted = await axios.post(`${API_URL}/api/config/remove`, { ...data, user: getUser() }, getConfig())
        return deleted.data
    } catch (err) { console.log(err) }
}

export {
    getAllConfigs,
    createConfig,
    getVersionDate,
    getConfigById,
    updateConfig,
    deleteConfig,
}