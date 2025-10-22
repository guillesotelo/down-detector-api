import { getAllAlerts, getAllHistory } from "../services"
import { Build, dataObj } from "../types"

export const chunkArray = (arr: any[], chunkSize: number) => {
    const result = []
    for (let i = 0; i < arr.length; i += chunkSize) {
        result.push(arr.slice(i, i + chunkSize))
    }
    return result
}

export const sortArray = (arr: any[], key: string | number, order?: boolean) => {
    return arr.slice().sort((a: any, b: any) => {
        const aValue = a[key]
        const bValue = b[key]
        if (typeof aValue !== 'number' && !aValue) return 1
        if (typeof bValue !== 'number' && !bValue) return -1
        return order ? aValue < bValue ? 1 : -1 : aValue < bValue ? -1 : 1
    })
}

export const filterArray = (arr: any[], key: string | number, filter: string) => {
    if (key === 'name') return arr.filter(element => element.name?.toLocaleLowerCase().includes(filter))
    if (key === 'office') return arr.filter(element => element.office?.toLocaleLowerCase().includes(filter))
    return arr
}

export const goToUrl = (url: string) => {
    const anchor = document.createElement('a')
    anchor.target = '_blank'
    anchor.href = url
    anchor.click()
}

export const getHistoryAndAlerts = async (systemId?: string, getRaw?: boolean) => {
    try {
        const history = await getAllHistory(systemId, getRaw)
        const userAlerts = await getAllAlerts(systemId)
        if ((history && Array.isArray(history)) || (userAlerts && Array.isArray(userAlerts))) {
            const allHistory = sortArray([...history, ...userAlerts], 'createdAt', true)
            return allHistory
        }
        return []
    } catch (error) {
        console.error(error)
        return []
    }
}

export const getTimeOption = (arr: any[], value: number) => {
    return arr.find(item => item.value === value) || { name: '', value: '' }
}

export const isTooBright = (color: string | undefined) => {
    color = color === 'gray' ? '#808080' :
        color === 'lightgray' ? '#d3d3d3' :
            color === 'black' ? '#000000' :
                color === 'white' ? '#ffffff' : color
    if (!color || !color.includes('#')) return false
    const hexToRgb = (hex: string) =>
        hex.match(/[A-Za-z0-9]{2}/g)?.map((v) => parseInt(v, 16))
    const [r, g, b] = hexToRgb(color) || []
    const luminance = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255)
    const threshold = 0.5
    return luminance > threshold
}

export const getLocation = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => position,
            (error) => {
                console.error("Error getting location:", error)
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser")
    }
}

export const toHex = (str: string) => {
    var result = ''
    for (var i = 0; i < str.length; i++) {
        result += str.charCodeAt(i).toString(16)
    }
    return result
}

export const getUser = () => localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : {}


export const getDate = (dateString: Date | number | string | undefined) => {
    if (dateString) {
        const date = new Date(dateString)
        if (date.getHours() === 24) date.setHours(0)
        return date.toLocaleDateString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    }
}

export const parseDateTime = (time: Date) => {
    const string = time ?
        getDate(time)
        : 'No data'
    return string ? string.split(' ').join(' - ') : ''
}

export const getDateWithGivenHour = (hour: number) => {
    /* Build dates with given hours passed */
    const today = new Date()
    today.setMinutes(0)
    today.setSeconds(0)
    today.setHours(today.getHours() - hour)
    return today.toLocaleString()
}

export const randomColors = (array: any[]) => {
    return array.map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
}

export const getBuildStatus = (build: Build) => {
    const moduleStats = new Map()
    Object.keys(build.modules).forEach(key => {
        if (build.modules[key].status === 'success') moduleStats.set('success', (moduleStats.get('success') || 0) + 1)
        // if (build.modules[key].status === 'pending') moduleStats.set('pending', (moduleStats.get('pending') || 0) + 1)
        if (build.modules[key].status === 'failure') moduleStats.set('failure', (moduleStats.get('failure') || 0) + 1)
    })

    const status = moduleStats.entries() ? Object.keys(build.modules).length === moduleStats.get('success') ? 'success'
        : moduleStats.get('failure') > 0 ? 'failure' : 'unknown' : 'unknown'

    return status
}

export const getBuildSuccessRate = (build: Build) => {
    const modules = typeof build.modules === 'string' ? JSON.parse(build.modules || '{}') : build.modules
    const succeeded = Object.keys(modules).filter(key => modules[key].status === 'success').length
    const total = Object.keys(modules).length
    return succeeded && total ? `${(succeeded * 100 / total).toFixed(1)}%` : ''
}

export const getBuildName = (build: Build, index?: number) => {
    // Removing placeholder for now
    // const placeholder = `Build #${index + 1}`
    const startName = capitalizeFirstLetter(build.target_branch.slice(0, 2))
    const endName = capitalizeFirstLetter(build.classifier.slice(1).slice(-3))
    const placeholder = startName + endName
    return build.name || placeholder
}

export const capitalizeFirstLetter = (str: string) => {
    return String(str).charAt(0).toUpperCase() + String(str).slice(1)
}

export const whenDateIs = (date: Date | string | number | undefined) => {
    if (!date) return ''

    const current = new Date(date)
    const today = new Date().toLocaleDateString()
    const yesterday = new Date(new Date().getTime() - 86400000).toLocaleDateString() // minus 1 day in miliseconds
    const lastWeek = new Date().getTime() - 604800000
    const lastMonth = new Date().getTime() - 2505600000
    const lastYear = new Date().getTime() - 31449600000

    if (today === current.toLocaleDateString()) return 'Today'
    if (yesterday === current.toLocaleDateString()) return 'Yesterday'

    if (current.getTime() >= lastWeek) return 'Last week'
    if (current.getTime() < lastWeek) return 'Last month'
    if (current.getTime() < lastMonth) return 'Months ago'
    if (current.getTime() < lastYear) return 'More than a year ago'
}

export const getModuleArray = (modules: dataObj) => {
    return Object.keys(modules).map(key => {
        return {
            ...modules[key],
            name: key,
            org: null,
            art: modules[key].org.art,
            solution: modules[key].org.solution,
        }
    })
}