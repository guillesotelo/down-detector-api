import BuildOk from '../../assets/icons/build-ok.svg'
import BuildPending from '../../assets/icons/build-pending.svg'
import BuildFail from '../../assets/icons/build-fail.svg'
import BuildUnknown from '../../assets/icons/build-unknown.svg'
import { useContext, useEffect, useState } from 'react'
import { getBuildStatus, getDate, getModuleArray, whenDateIs } from '../../helpers'
import { Build, dataObj } from '../../types'
import { AppContext } from '../../AppContext'
import ProgressBar from '../ProgressBar/ProgressBar'

type Props = {
    build: Build
    setOpenModal: (value: string) => void
    delay?: string
}

export default function BuildCard(props: Props) {
    const [statusIcon, setStatusIcon] = useState(BuildUnknown)
    const { darkMode } = useContext(AppContext)

    const {
        build,
        setOpenModal,
        delay
    } = props

    const {
        id,
        name,
        classifier,
        date,
        createdAt,
        target_branch,
        modules,
        tags,
    } = build

    useEffect(() => {
        setStatusIcon(getStatusIcon())
    }, [modules])

    const getStatusIcon = () => {
        const status = getBuildStatus(build)
        console.log(status)
        return status === 'success' ? BuildOk
            : status === 'unknown' ? BuildUnknown : BuildFail
    }

    const getStatusLabel = () => {
        const status = getBuildStatus(build)
        const labels: { [value: string]: string } = {
            'unknown': 'Insufficient data',
            'failure': 'Build failed',
            'success': 'Successfully built'
        }
        return labels[status]
    }

    const getStatusBG = () => {
        const status = getBuildStatus(build)
        const colors: { [value: string]: string } = {
            'unknown': '#80808026',
            'failure': '#ff000014',
            'success': '#00800017'
        }
        return colors[status] || "#80808026"
    }

    return (
        <div
            className={`buildcard__container${darkMode ? '--dark' : ''}`}
            onClick={() => setOpenModal(id || build.classifier + '__' + build.target_branch)}
            style={{
                backgroundImage: `linear-gradient(to right bottom, ${darkMode ? 'black' : 'white'}, ${getStatusBG()})`,
                animationDelay: `${delay || '0'}`
            }}>
            <div className="buildcard__wrapper">
                <div className="buildcard__header">
                    <div className="buildcard__header-row">
                        <p className="buildcard__header-name">{name}</p>
                        <img src={statusIcon} alt="Icon Status" className="buildcard__header-icon" />
                    </div>
                    <div className="buildcard__header-row">
                        <p className="buildcard__header-branch">{target_branch}</p>
                        <p className="buildcard__header-classifier">{classifier}</p>
                    </div>
                </div>
                <p className={`buildcard__status-${getBuildStatus(build) || 'unknown'}`}>{getStatusLabel()}</p>
                {/* <div className="buildcard__tags">
                    {tags?.map((tag: dataObj, i: number) => <p key={i} className={`buildcard__tag-${tag.color || 'default'}`}>{tag.value}</p>)}
                </div> */}
                <ProgressBar
                    label="Score"
                    arrData={getModuleArray(modules)}
                    colors={{ "success": "#00b500", "failure": "#e70000" }}
                    objKey="status"
                    percentageFor='success'
                    style={{ margin: '.5rem 0' }}
                />
                <div className="buildcard__footer">
                    <p className="buildcard__footer-date">{getDate(date || createdAt)}</p>
                    <p className="buildcard__footer-when">{whenDateIs(date || createdAt)}</p>
                </div>
            </div>
        </div>
    )
}