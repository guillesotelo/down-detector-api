import axios from 'axios';
import { SubscriptionType } from '../types';
import { getUser } from '../helpers';

const API_URL = process.env.REACT_APP_API_URL || ''

const getHeaders = () => {
    return { authorization: `Bearer ${getUser().token}` }
}

const getConfig = () => {
    return { headers: { authorization: `Bearer ${getUser().token}` } }
}

const getAllSubscriptions = async (systemId?: string) => {
    try {
        const subscription = await axios.get(`${API_URL}/api/subscription/getAll`, { params: { systemId }, headers: getHeaders() })
        return subscription.data
    } catch (err) { console.log(err) }
}

const getSubscriptionBySystemId = async (_id: string) => {
    try {
        const subscription = await axios.get(`${API_URL}/api/subscription/getBySystemId`, { params: { _id }, headers: getHeaders() })
        return subscription.data
    } catch (err) { console.log(err) }
}

const getSubscriptionById = async (_id: string) => {
    try {
        const subscription = await axios.get(`${API_URL}/api/subscription/getById`, { params: { _id }, headers: getHeaders() })
        return subscription.data
    } catch (err) { console.log(err) }
}

const createSubscription = async (data: SubscriptionType) => {
    try {
        const subscription = await axios.post(`${API_URL}/api/subscription/create`, { ...data, user: getUser() }, getConfig())
        return subscription.data
    } catch (err) { console.log(err) }
}

const updateSubscription = async (data: SubscriptionType) => {
    try {
        const subscription = await axios.post(`${API_URL}/api/subscription/update`, { ...data, user: getUser() }, getConfig())
        return subscription.data
    } catch (err) { console.log(err) }
}

const deleteSubscription = async (data: SubscriptionType) => {
    try {
        const deleted = await axios.post(`${API_URL}/api/subscription/remove`, { ...data, user: getUser() }, getConfig())
        return deleted
    } catch (err) { console.log(err) }
}

export {
    getAllSubscriptions,
    createSubscription,
    getSubscriptionBySystemId,
    getSubscriptionById,
    updateSubscription,
    deleteSubscription,
}