import axios from 'axios';
import { systemType } from '../types';
import { getUser } from '../helpers';

const API_URL = process.env.REACT_APP_API_URL || ''

const getHeaders = () => {
    return { authorization: `Bearer ${getUser().token}` }
}

const getConfig = () => {
    return { headers: { authorization: `Bearer ${getUser().token}` } }
}

const getActiveSystems = async () => {
    try {
        const systems = await axios.get(`${API_URL}/api/system/getActive`, { params: { _id: getUser()._id }, headers: getHeaders() })
        return systems.data
    } catch (err) { console.log(err) }
}

const getAllSystems = async () => {
    try {
        const systems = await axios.get(`${API_URL}/api/system/getAll`, { params: { _id: getUser()._id }, headers: getHeaders() })
        return systems.data
    } catch (err) { console.log(err) }
}

const getSystemsByOwnerId = async (_id: string) => {
    try {
        const systems = await axios.get(`${API_URL}/api/system/getAllByOwnerId`, { params: { _id }, headers: getHeaders() })
        return systems.data
    } catch (err) { console.log(err) }
}

const getSystemById = async (_id: string) => {
    try {
        const system = await axios.get(`${API_URL}/api/system/getById`, { params: { _id }, headers: getHeaders() })
        return system.data
    } catch (err) { console.log(err) }
}

const getSystemDataSelect = async (dataSelect: string) => {
    try {
        const systemData = await axios.get(`${API_URL}/api/system/getData`, { params: { _id: getUser()._id, dataSelect }, headers: getHeaders() })
        return systemData.data
    } catch (err) { console.log(err) }
}

const createSystem = async (data: systemType) => {
    try {
        const system = await axios.post(`${API_URL}/api/system/create`, { ...data, user: getUser() }, getConfig())
        return system.data
    } catch (err) { console.log(err) }
}

const updateSystem = async (data: systemType) => {
    try {
        const system = await axios.post(`${API_URL}/api/system/update`, { ...data, user: getUser() }, getConfig())
        return system.data
    } catch (err) { console.log(err) }
}

const updateSystemOrder = async (systems: systemType[]) => {
    try {
        const updatedSystems = await axios.post(`${API_URL}/api/system/updateOrder`, { systems, user: getUser() }, getConfig())
        return updatedSystems.data
    } catch (err) { console.log(err) }
}

const deleteSystem = async (data: systemType) => {
    try {
        const deleted = await axios.post(`${API_URL}/api/system/remove`, { ...data, user: getUser() }, getConfig())
        return deleted.data
    } catch (err) { console.log(err) }
}

export {
    getActiveSystems,
    getAllSystems,
    getSystemsByOwnerId,
    getSystemDataSelect,
    createSystem,
    getSystemById,
    updateSystem,
    updateSystemOrder,
    deleteSystem,
}