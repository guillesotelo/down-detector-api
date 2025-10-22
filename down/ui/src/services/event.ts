import axios from 'axios';
import { eventType } from '../types';
import { getUser } from '../helpers';

const API_URL = process.env.REACT_APP_API_URL || ''

const getHeaders = () => {
    return { authorization: `Bearer ${getUser().token}` }
}

const getConfig = () => {
    return { headers: { authorization: `Bearer ${getUser().token}` } }
}

const getAllEvents = async () => {
    try {
        const events = await axios.get(`${API_URL}/api/event/getAll`, { headers: getHeaders() })
        return events.data
    } catch (err) { console.log(err) }
}

const getEventById = async (_id: string) => {
    try {
        const event = await axios.get(`${API_URL}/api/event/getById`, { params: { _id }, headers: getHeaders() })
        return event.data
    } catch (err) { console.log(err) }
}

const createEvent = async (data: eventType) => {
    try {
        const event = await axios.post(`${API_URL}/api/event/create`, { ...data, user: getUser() }, getConfig())
        return event.data
    } catch (err) { console.log(err) }
}

const updateEvent = async (data: eventType) => {
    try {
        const event = await axios.post(`${API_URL}/api/event/update`, { ...data, user: getUser() }, getConfig())
        return event.data
    } catch (err) { console.log(err) }
}

const deleteEvent = async (data: eventType) => {
    try {
        const deleted = await axios.post(`${API_URL}/api/event/remove`, { ...data, user: getUser() }, getConfig())
        return deleted.data
    } catch (err) { console.log(err) }
}

export {
    getAllEvents,
    createEvent,
    getEventById,
    updateEvent,
    deleteEvent,
}