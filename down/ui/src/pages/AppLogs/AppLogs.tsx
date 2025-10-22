import React, { useContext, useEffect, useState, useTransition } from 'react'
import DataTable from '../../components/DataTable/DataTable'
import { getAllLogs, verifyToken } from '../../services'
import { logHeaders } from '../../constants/tableHeaders'
import { logType, onChangeEventType } from '../../types'
import SearchBar from '../../components/SearchBar/SearchBar'
import { useHistory } from 'react-router-dom'
import { AppContext } from '../../AppContext'
import Dropdown from '../../components/Dropdown/Dropdown'

type Props = {}

export default function AppLogs({ }: Props) {
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(-1)
  const [tableData, setTableData] = useState<logType[]>([])
  const [filteredData, setFilteredData] = useState<logType[]>([])
  const [allModules, setAllModules] = useState<string[]>([])
  const [selectedModule, setSelectedModule] = useState('All')
  const [pending, startTransition] = useTransition()
  const { isLoggedIn, isSuper } = useContext(AppContext)
  const history = useHistory()

  useEffect(() => {
    getLogs()
  }, [])

  useEffect(() => {
    if (isLoggedIn !== null && !isLoggedIn && !isSuper) return history.push('/')
  }, [isLoggedIn])

  useEffect(() => {
    if (selectedModule !== 'All') setFilteredData(tableData.filter((log: logType) => log.module === selectedModule))
    else setFilteredData(tableData)
  }, [selectedModule])

  const getLogs = async () => {
    try {
      const logs = await getAllLogs()
      if (logs && logs.length) {
        setTableData(logs)
        setFilteredData(logs)
        let modules = logs.map((log: logType) => log.module)
        setAllModules(['All'].concat([...new Set(modules) as any]))
      }
    } catch (error) {
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
          .filter((log: logType) =>
            JSON.stringify(log).toLocaleLowerCase().includes(searchString.trim().toLocaleLowerCase())
          ))
      })
    } else setFilteredData(tableData)
  }

  return (
    <div className="applogs__container">
      <div className="applogs__row">
        <div className="applogs__col">
          <Dropdown
            label='Module'
            options={allModules}
            value={selectedModule}
            selected={selectedModule}
            setSelected={setSelectedModule}
            maxHeight='20vh'
            style={{ width: '12rem', marginRight: '1rem' }}
            loading={loading}
          />
        </div>
        <div className="applogs__col">
          <SearchBar
            handleChange={onChangeSearch}
            triggerSearch={triggerSearch}
            value={search}
            placeholder='Search logs...'
          />
        </div>
        <div className="applogs__col">
        </div>
      </div>
      <div className="applogs__col">
        <DataTable
          title='App Logs'
          tableData={filteredData}
          tableHeaders={logHeaders}
          name='logs'
          loading={loading || pending}
          max={18}
        />
      </div>
    </div>
  )
}