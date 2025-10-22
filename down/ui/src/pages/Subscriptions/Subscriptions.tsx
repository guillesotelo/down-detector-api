import { useContext, useEffect, useState, useTransition } from 'react'
import DataTable from '../../components/DataTable/DataTable'
import { deleteSubscription, getAllSubscriptions } from '../../services'
import { subscriptionHeaders } from '../../constants/tableHeaders'
import { onChangeEventType, SubscriptionType } from '../../types'
import SearchBar from '../../components/SearchBar/SearchBar'
import { useHistory } from 'react-router-dom'
import { AppContext } from '../../AppContext'
import Modal from '../../components/Modal/Modal'
import Button from '../../components/Button/Button'
import { toast } from 'react-toastify'

type Props = {}

export default function Subscriptions({ }: Props) {
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [tableData, setTableData] = useState<SubscriptionType[]>([])
    const [filteredData, setFilteredData] = useState<SubscriptionType[]>([])
    const [selected, setSelected] = useState(-1)
    const [pending, startTransition] = useTransition()
    const { isLoggedIn, isSuper } = useContext(AppContext)
    const history = useHistory()

    useEffect(() => {
        getSubs(true)
    }, [])

    useEffect(() => {
        if (isLoggedIn !== null && !isLoggedIn && !isSuper) return history.push('/')
    }, [isLoggedIn])

    const getSubs = async (load = false) => {
        try {
            setLoading(load)
            const subs = await getAllSubscriptions()
            if (subs && subs.length) {
                setTableData(subs)
                setFilteredData(subs)
            }
            setLoading(false)
        } catch (error) {
            setLoading(false)
            console.error(error)
        }
    }

    const onChangeSearch = (e: onChangeEventType) => {
        const { value } = e.target || {}
        setSearch(value)
        triggerSearch(value)
    }

    const triggerSearch = (searchString?: string) => {
        if (searchString && typeof searchString === 'string') {
            startTransition(() => {
                setFilteredData(tableData
                    .filter((sub: SubscriptionType) =>
                        JSON.stringify(sub).toLocaleLowerCase().includes(searchString.trim().toLocaleLowerCase())
                    ))
            })
        } else setFilteredData(tableData)
    }

    const deleteSub = async () => {
        try {
            setLoading(true)
            const deleted = await deleteSubscription(filteredData[selected])
            if (deleted) {
                toast.success('Subscription deleted successfully')
                setSelected(-1)
                await getSubs()
            }
            else toast.error('Error deleting subscription. Please try again.')
            setLoading(false)
        } catch (error) {
            setLoading(false)
            console.error(error)
        }
    }

    const onClose = () => {
        setSelected(-1)
    }

    return (
        <div className="applogs__container">
            {selected !== -1 ?
                <Modal
                    title={filteredData[selected].email}
                    subtitle={filteredData[selected].name}
                    onClose={onClose}>
                    <Button
                        label='Delete'
                        handleClick={deleteSub}
                        bgColor='brown'
                        textColor='white'
                        style={{ width: '100%' }}
                        disabled={loading} />
                </Modal> : ''}
            <SearchBar
                handleChange={onChangeSearch}
                triggerSearch={triggerSearch}
                value={search}
                placeholder='Search subscriptions...'
                style={{
                    alignSelf: 'flex-start',
                    margin: '0 0 1.5rem',
                    filter: selected !== -1 ? 'blur(5px)' : ''
                }}
            />
            <div className="applogs__col">
                <DataTable
                    title='Subscriptions'
                    tableData={filteredData}
                    tableHeaders={subscriptionHeaders}
                    name='subscriptions'
                    loading={loading || pending}
                    max={18}
                    selected={selected}
                    setSelected={setSelected}
                    style={{ filter: selected !== -1 ? 'blur(5px)' : '' }}
                />
            </div>
        </div>
    )
}