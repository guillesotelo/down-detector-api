import { useEffect, useState } from 'react'
import { deleteBuildLog, getAllBuildLogs, updateBuildLog } from '../../services/buildtracker'
import { dataObj, ModuleInfo } from '../../types'
import DataTable from '../../components/DataTable/DataTable'
import { buildLogHeaders } from '../../constants/tableHeaders'
import BuildTrackerHeader from '../../components/BuildTrackerHeader/BuildTrackerHeader'
import Modal from '../../components/Modal/Modal'
import { JsonView } from 'react-json-view-lite';
import { getBuildName, getBuildStatus, getBuildSuccessRate, getDate } from '../../helpers'
import 'react-json-view-lite/dist/index.css';
import Switch from '../../components/Switch/Swith'
import Button from '../../components/Button/Button'
import { toast } from 'react-toastify'
import InputField from '../../components/InputField/InputField'

type Props = {}

export default function BuildTrackerPanel({ }: Props) {
    const [buildLogs, setBuildLogs] = useState<null | dataObj[]>(null)
    const [selected, setSelected] = useState<null | dataObj>(null)
    const [openModal, setOpenModal] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        getBuildLogs()
    }, [])

    useEffect(() => {
        setOpenModal(selected ? true : false)
    }, [selected])

    const getBuildLogs = async () => {
        try {
            setLoading(true)
            const _buildLogs = await getAllBuildLogs()
            if (_buildLogs && Array.isArray(_buildLogs)) {
                setBuildLogs(_buildLogs.map(b => {
                    const modules = JSON.parse(b.modules || '{}')
                    return {
                        ...b,
                        modules,
                        status: getBuildStatus({ ...b, modules: JSON.parse(b.modules || '{}') }),
                        successRate: getBuildSuccessRate(b),
                        name: getBuildName(b)
                    }
                }))
            }
            setLoading(false)
        } catch (error) {
            setLoading(false)
            console.error(error)
        }
    }

    const cancel = () => {
        setSelected(null)
    }

    const save = async () => {
        try {
            setLoading(true)
            if (!selected) return
            const saved = await updateBuildLog(selected)

            if (saved) {
                toast.success('Build activity saved!')
                getBuildLogs()
                setSelected(null)
            }
            else toast.error('An error occurred while saving. Please try again.')
            setLoading(false)
        } catch (error) {
            setLoading(false)
            toast.error('An error occurred while saving. Please try again.')
            console.error(error)
        }
    }

    const removeBuildLog = async () => {
        try {
            setLoading(true)
            if (!selected) return
            const deleted = await deleteBuildLog(selected)
            if (deleted) {
                toast.success('Build activity deleted!')
                getBuildLogs()
                setSelected(null)
            }
            else toast.error('An error occurred while deleting build activity. Please try again.')
            setLoading(false)
        } catch (error) {
            setLoading(false)
            toast.error('An error occurred while deleting activity. Please try again.')
            console.error(error)
        }
    }

    const renderBuildModal = () => {
        return (
            <Modal
                title={getDate(selected?.createdAt)}
                onClose={() => setSelected(null)}>
                <div className="buildtracker__buildmodal">
                    <p className='buildtracker__buildmodal-json-title'>JSON</p>
                    <div className="buildtracker__buildmodal-json">
                        <JsonView data={selected || {}} />
                    </div>
                    <div className="buildtracker__buildmodal-row">
                        <InputField
                            label='Name'
                            value={selected?.name}
                            name='name'
                            placeholder='Custom build name...'
                            updateData={(key, e) => setSelected(prev => ({ ...prev, [key]: e.target.value }))}
                            style={{ width: '80%' }}
                            disabled={loading}
                        />
                        <Switch
                            label='Active'
                            on='Yes'
                            off='No'
                            value={selected?.active}
                            setValue={newVal => setSelected(prev => ({ ...prev, active: newVal }))}
                        />
                    </div>
                    <div className="buildtracker__buildmodal-buttons">
                        <Button
                            label='Cancel'
                            handleClick={cancel}
                            bgColor='lightgray'
                            style={{ width: '45%' }}
                            disabled={loading}
                        />
                        <Button
                            label='Save'
                            handleClick={save}
                            bgColor='#005585a3'
                            textColor='#fff'
                            style={{ width: '45%' }}
                            disabled={loading}
                        />
                    </div>
                    {/* Just used for admins */}
                    {/* <Button
                        label='Delete'
                        handleClick={removeBuildLog}
                        bgColor='#e5a8a8'
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={loading}
                    /> */}
                </div>
            </Modal>
        )
    }

    return (
        <div className="buildtracker__container">
            <BuildTrackerHeader style={{ filter: openModal ? 'blur(5px)' : '' }} />
            {openModal && renderBuildModal()}
            <h1 style={{ alignSelf: 'flex-start', margin: 0, filter: openModal ? 'blur(5px)' : '' }}>Control Panel</h1>
            <DataTable
                title='Build Logs (raw JSON files)'
                tableData={buildLogs || []}
                setTableData={setBuildLogs}
                tableHeaders={buildLogHeaders}
                setSelected={index => setSelected(buildLogs ? buildLogs[index] : null)}
                style={{ filter: openModal ? 'blur(5px)' : '' }}
                max={20}
                loading={loading}
            />
        </div>
    )
}