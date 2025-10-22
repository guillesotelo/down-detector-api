import { useContext, useEffect, useState } from "react"
import BuildCard from "../../components/BuildCard/BuildCard"
import Modal from "../../components/Modal/Modal"
import { Build, dataObj, ModuleInfo, onChangeEventType } from "../../types"
import { AppContext } from "../../AppContext"
import ModulesTable from "../../components/ModulesTable/ModulesTable"
import { moduleHeaders } from "../../constants/tableHeaders"
import { capitalizeFirstLetter, getBuildName, getDate, getModuleArray, randomColors } from "../../helpers"
import BuildTrackerHeader from "../../components/BuildTrackerHeader/BuildTrackerHeader"
import ProgressBar from "../../components/ProgressBar/ProgressBar"
import SearchBar from "../../components/SearchBar/SearchBar"
import DoughnutChart from "../../components/DoughnutChart/DoughnutChart"
import TextData from "../../components/TextData/TextData"
import { COLOR_PALETTE, DARK_MODE_COLOR_PALETTE } from "../../constants/app"
import { generateBuildSamples } from "../../helpers/buildSamples"
import DataTable from "../../components/DataTable/DataTable"
import { getAllBuildLogs } from "../../services/buildtracker"
import BuildCardPlaceholder from "../../components/BuildCard/BuildCardPlaceholder"

export default function BuildTracker() {
    const [builds, setBuilds] = useState<null | Build[]>(null)
    const [copyBuilds, setCopyBuilds] = useState<null | Build[]>(null)
    const [openModal, setOpenModal] = useState<null | string>(null)
    const [build, setBuild] = useState<null | Build>(null)
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [searchModules, setSearchModules] = useState('')
    const [moduleArray, setModuleArray] = useState<ModuleInfo[]>([])
    const [copyModuleArray, setCopyModuleArray] = useState<ModuleInfo[]>([])
    const [selectedModule, setSelectedModule] = useState(-1)
    const [artsChartData, setArtsChartData] = useState<dataObj>([])
    const { darkMode } = useContext(AppContext)
    const buildSamples = generateBuildSamples()
    const CSDOX_URL = process.env.REACT_APP_CSDOX_URL

    useEffect(() => {
        getBuilds()
    }, [])

    useEffect(() => {
        if (openModal && builds) {
            const selected = builds.find(b => b.id === openModal) || null
            if (selected) {
                setBuild(selected)
                setModuleArray(getModuleArray(selected.modules))
                setCopyModuleArray(getModuleArray(selected.modules))
            }
        } else {
            setBuild(null)
            setModuleArray([])
            setCopyModuleArray([])
        }
    }, [openModal, builds])

    useEffect(() => {
        if (search.trim() && copyBuilds) {
            setBuilds(copyBuilds.filter(b =>
                JSON.stringify(Object.values(b)).toLocaleLowerCase()
                    .includes(search.toLocaleLowerCase().trim())
            ))
        } else setBuilds(copyBuilds)
    }, [search, copyBuilds])

    useEffect(() => {
        if (searchModules.trim() && copyModuleArray) {
            setModuleArray(copyModuleArray.filter(b => {
                b.date = ''
                return JSON.stringify(Object.values(b)).toLocaleLowerCase()
                    .includes(searchModules.toLocaleLowerCase().trim())
            }))
        } else setModuleArray(copyModuleArray)

        if (!searchModules) setArtsChartData(getArtsChartData())
    }, [searchModules, copyModuleArray])

    const getBuilds = async () => {
        try {
            setLoading(true)
            const _buildLogs = await getAllBuildLogs()

            let _builds = _buildLogs
                .filter((b: Build) => b.active)
                .map((b: Build, i: number) => {
                    return {
                        ...b,
                        name: getBuildName(b, i),
                        id: getBuildId(b),
                        modules: JSON.parse(typeof b.modules === 'string' ? b.modules : '{}')
                    }
                })
            setBuilds(_builds)
            setCopyBuilds(_builds)
            setLoading(false)
        } catch (error) {
            setLoading(false)
            console.error(error)
        }
    }

    const getBuildId = (build: Build) => {
        return `${build.classifier}__${build.target_branch}`
    }

    const onChangeSearch = (e: onChangeEventType) => {
        const { value } = e.target || {}
        setSearch(value)
    }

    const onChangeSearchModules = (e: onChangeEventType) => {
        const { value } = e.target || {}
        setSearchModules(value.trim())
    }

    const chartCalculator = (arrData: dataObj[], key: string, value: any) => {
        let sum = 0
        arrData.forEach(data => {
            if (value === 'failure' && data[key] && data[key] !== 'success') sum += 1
            else if (data[key] && data[key] === value) sum += 1
        })
        return sum
    }

    const getArtsChartData = () => {
        const labels = Array.from(new Set(copyModuleArray.map(data => data.art)))
        return {
            labels,
            datasets: [{
                data: labels.map(item => chartCalculator(copyModuleArray, 'art', item)),
                backgroundColor: randomColors(darkMode ? DARK_MODE_COLOR_PALETTE : COLOR_PALETTE).slice(0, copyModuleArray.length)
            }]
        }
    }

    const renderModuleDetails = () => {
        const module = moduleArray[selectedModule] || null
        if (!module) return null

        const {
            name,
            status,
            date,
            art,
            solution,
            version
        } = module

        return (
            <div className="buildtracker__module">
                <button onClick={() => setSelectedModule(-1)} className="buildtracker__module-back">Module list</button>
                <div className={`buildtracker__module-wrapper${darkMode ? '--dark' : ''}`}>
                    <p className={`buildtracker__module-title${darkMode ? '--dark' : ''}`}>{name}</p>
                    <div className="buildtracker__module-row">
                        <div className="buildtracker__module-body">
                            <TextData label="Status" value={status} inline color={status === 'success' ? 'green' : 'red'} />
                            <TextData label="Date" value={getDate(date)} inline />
                            <TextData label="ART" value={art} inline />
                            <TextData label="Solution" value={solution} inline />
                            <TextData label="Version" value={version} inline />
                            <a
                                href={`${CSDOX_URL}/products/spa2_ad_hpb/branches/${build?.target_branch}/modules/${name}`}
                                target="_blank"
                            >View in cs-dox</a>
                        </div>
                        <DataTable
                            title="Presence in other builds"
                            tableData={builds || []}
                            tableHeaders={[{ name: 'Module', value: 'name' }]}
                            max={4}
                            style={{ width: '18rem', margin: '.5rem 1rem 1rem', maxHeight: '15rem', overflow: 'auto' }}
                            setSelected={i => {
                                const selected = (builds || [])[i < 0 ? 0 : i]
                                setBuild(selected)
                                setModuleArray(getModuleArray(selected.modules))
                                setCopyModuleArray(getModuleArray(selected.modules))
                                setSelectedModule(getModuleArray(selected.modules).findIndex(m => m.name === module.name))
                                setOpenModal(selected.id || null)
                            }}
                            selected={builds?.findIndex(b => b.id === openModal)}
                        />
                    </div>
                </div>
            </div>
        )
    }

    const closeModal = () => {
        setOpenModal(null)
        setSelectedModule(-1)
    }

    const renderBuildModal = () => {
        if (!build) return ''
        return (
            <Modal
                title={build.name}
                subtitle={getDate(build.date)}
                onClose={closeModal}
                style={{ maxHeight: '85vh', width: '50rem' }}
                contentStyle={{ overflow: 'hidden' }}>
                <div className="buildtracker__modal">
                    <div className="buildtracker__modal-row" style={{ alignItems: 'center', justifyContent: 'space-evenly' }}>
                        <div className="buildtracker__modal-col">
                            <TextData label="Target branch" value={build.target_branch} style={{ marginBottom: '.7rem' }} />
                            <TextData label="Classifier" value={build.classifier} style={{ marginBottom: '.7rem' }} />
                            <TextData label="Module count" value={copyModuleArray.length} />
                        </div>
                        <DoughnutChart
                            label="ARTs involved"
                            chartData={artsChartData}
                            style={{ width: '7rem', textAlign: 'center' }}
                            chartOptions={{
                                plugins: {
                                    legend: {
                                        display: false
                                    }
                                },
                                borderColor: 'transparent',
                            }}
                        />
                    </div>

                    {selectedModule !== -1 ?
                        renderModuleDetails()
                        :
                        <>
                            <p className="buildtracker__modal-modules">Modules</p>
                            <div className="buildtracker__modal-row" style={{ margin: '1.5rem 0 0' }}>
                                <div className="buildtracker__modal-col" style={{ width: '45%' }}>
                                    <ProgressBar
                                        label="Score"
                                        arrData={copyModuleArray}
                                        colors={{ "success": "#00b500", "failure": "#e70000" }}
                                        objKey="status"
                                        percentageFor='success'
                                    />
                                    <div className="buildtracker__modal-table">
                                        <div className="buildtracker__modal-table-container">
                                            <div className="buildtracker__modal-table-row">
                                                <p className="buildtracker__modal-table-text">Built</p>
                                                <p className="buildtracker__modal-table-value" style={{ color: 'green' }}>
                                                    {copyModuleArray.filter(m => m.status === 'success').length}
                                                </p>
                                            </div>
                                            <div className="buildtracker__modal-table-row">
                                                <p className="buildtracker__modal-table-text">Not built</p>
                                                <p className="buildtracker__modal-table-value" style={{ color: 'red' }}>
                                                    {copyModuleArray.filter(m => m.status !== 'success').length}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {moduleArray.length ?
                                    <SearchBar
                                        handleChange={onChangeSearchModules}
                                        value={searchModules}
                                        placeholder='Search modules...'
                                        style={{ width: '30%', alignSelf: 'flex-start' }}
                                    /> : ''}
                            </div>

                            <ModulesTable
                                title={`${searchModules ? 'Module search results' : 'Module list'} (${moduleArray.length})`}
                                tableData={moduleArray}
                                setTableData={setModuleArray}
                                tableHeaders={moduleHeaders}
                                orderDataBy={moduleHeaders[4]}
                                style={{ maxHeight: '40vh', marginTop: '2rem', overflow: 'auto' }}
                                selected={selectedModule}
                                setSelected={setSelectedModule}
                                name="modules"
                            />
                        </>
                    }
                </div>
            </Modal>
        )
    }

    return (
        <div className="buildtracker__container">
            <BuildTrackerHeader
                search={search}
                setSearch={setSearch}
                onChangeSearch={onChangeSearch}
                style={{ filter: openModal ? 'blur(7px)' : '' }}
            />
            {openModal && renderBuildModal()}
            <div className="buildtracker__pageview">
                {/* <h1 className="buildtracker__title" style={{ filter: openModal ? 'blur(7px)' : '' }}>Build activity</h1> */}
                <div className="buildtracker__list" style={{ filter: openModal ? 'blur(7px)' : '' }}>
                    {loading ?
                        // <div className="buildtracker__loading"><HashLoader size={30} color={darkMode ? '#fff' : undefined} /><p>Loading builds activity...</p></div>
                        Array.from({ length: 15 }).map((_, i) => <BuildCardPlaceholder />)
                        : builds && builds.length ? builds.map((b, i) =>
                            <BuildCard
                                key={i}
                                build={b}
                                setOpenModal={setOpenModal}
                                delay={String(i ? i / 20 : 0) + 's'}
                            />
                        )
                            : <p style={{ textAlign: 'center', width: '100%' }}>No active build activity found.</p>
                    }
                </div>
            </div>
        </div>
    )
}