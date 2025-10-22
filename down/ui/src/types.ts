export type dataObj<T = any> = Record<string | number, T>

export type AppContextType = {
    isMobile: boolean
    isLoggedIn: boolean | null
    isSuper: boolean
    setIsLoggedIn: (value: boolean) => void
    setIsSuper: (value: boolean) => void
    item: string
    setItem: (value: string) => void
    darkMode: boolean
    setDarkMode: (value: boolean) => void
    headerLoading: boolean
    setHeaderLoading: (value: boolean) => void
}

export type userType = {
    _id?: string
    username?: string
    email?: string
    password?: string
    password2?: string
    isSuper?: boolean
    newData?: userType
    ownedSystems?: systemType[]
    buildTrackerAccess?: boolean
}

export type systemType = {
    _id?: string
    name?: string
    url?: string
    type?: string
    description?: string
    timeout?: number
    interval?: number
    alertThreshold?: number
    alertsExpiration?: number
    owners?: userType[]
    createdBy?: string
    updatedBy?: string
    lastCheck?: Date
    lastCheckStatus?: boolean
    active?: boolean
    reportedlyDown?: boolean
    createdAt?: Date
    updatedAt?: Date
    downtimeArray?: eventType[]
    newData?: systemType
    customType?: string
    downtimeNote?: string
    raw?: string
    logo?: string
    order?: number
    bannerFlag?: string | Date | null
    broadcastMessages?: string
    firstStatus?: boolean
    unsubscriptions?: string
    subscriberEmail?: string
}

export type eventType = {
    _id?: string
    url?: string
    start?: Date
    end?: Date
    systemId?: string
    node?: string
    createdAt?: Date
    updatedAt?: Date
    note?: string
    newData?: eventType
}

export type historyType = {
    _id?: string
    url?: string
    systemId?: string
    status?: boolean | string
    message?: string
    description?: string
    createdAt?: Date
    updatedAt?: Date
    newData?: historyType
    raw?: string
    busy?: boolean
}

export type alertType = {
    _id?: string
    systemId?: string
    type?: string
    userAlert?: boolean
    message?: string
    createdAt?: Date
    updatedAt?: Date
    newData?: alertType
}

export type SubscriptionType = {
    _id?: string
    systemId?: string
    name?: string
    type?: string
    subscriberEmail?: string
    email?: string
    username?: string
    createdAt?: Date
    updatedAt?: Date
    newData?: alertType
}

export type logType = {
    _id?: string
    username?: string
    email?: string
    details?: string
    module?: string
    newData?: logType
}

export type statusType = {
    time: Date | number
    status: number
    reg?: boolean
    busy?: boolean
    isDown?: boolean
    unknown?: boolean
}

export type onChangeEventType = React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>

export type downtimeModalType = {
    system?: systemType,
    index?: number,
    start?: Date,
    end?: Date,
    note?: string
} | null

export type configType = {
    _id?: string
    name?: string
    creator?: string
    maintainer?: string
    license?: string
    server?: string
    repo?: string
    version?: string
    createdAt?: Date
    updatedAt?: Date
}

type ModuleStatus = "success" | "failure";

export interface OrgInfo {
    art: string;
    solution: string;
}

export interface ModuleInfo {
    status: ModuleStatus;
    name?: string;
    date: string;
    org: OrgInfo;
    version: string;
    art?: string
    solution?: string;
}

export interface Build {
    classifier: string;
    date: string;
    target_branch: string;
    modules: Record<string, ModuleInfo>;
    id?: string
    name?: string
    tags?: dataObj[]
    active?: boolean
    createdAt?: string | Date
    updatedAt?: string | Date
}