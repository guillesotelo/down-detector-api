import React, { useContext, useEffect, useState } from 'react'
import MoonLoader from "react-spinners/MoonLoader"
import { dataObj } from '../../types'
import { AppContext } from '../../AppContext'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import Tooltip from '../Tooltip/Tooltip';
import { getDate } from '../../helpers';

type Props = {
    tableData: dataObj[]
    setTableData?: (value: dataObj[]) => void
    tableHeaders: dataObj
    title?: string
    name?: string
    loading?: boolean
    selected?: number
    setSelected?: (value: number) => void
    max?: number
    style?: React.CSSProperties
    orderDataBy?: dataObj
    draggable?: boolean
    saveTableDataOrder?: (value: dataObj[]) => void
}

export default function DataTable(props: Props) {
    const {
        tableData,
        setTableData,
        tableHeaders,
        title,
        name,
        loading,
        selected,
        setSelected,
        max,
        style,
        orderDataBy,
        draggable,
        saveTableDataOrder
    } = props

    const [maxItems, setMaxItems] = useState(max || 10)
    const [ordered, setOrdered] = useState({ ...tableHeaders.forEach((h: dataObj) => { return { [h.name]: false } }) })
    const [startTime, setStartTime] = useState(new Date())
    const [loadingTime, setLoadingTime] = useState(0)
    const [dragging, setDragging] = useState(false)
    const { darkMode } = useContext(AppContext)

    useEffect(() => {
        if (orderDataBy) orderBy(orderDataBy)
    }, [])

    useEffect(() => {
        setStartTime(new Date())
        setLoadingTime(0)
    }, [loading])

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date()
            const miliSeconds = now.getTime() - startTime.getTime()
            const elapsedSeconds = Math.floor(miliSeconds / 1000)
            setLoadingTime(elapsedSeconds)
        }, 1000)

        return () => clearInterval(interval)
    }, [startTime])

    const orderBy = (header: dataObj) => {
        const copyData = [...tableData]
        const orderedData = copyData.slice().sort((a, b) => {
            if (ordered[header.name]) {
                if (header.value === 'createdAt' || header.value === 'updatedAt') {
                    if (new Date(a[header.value]).getTime() < new Date(b[header.value]).getTime()) return -1
                    if (new Date(a[header.value]).getTime() > new Date(b[header.value]).getTime()) return 1
                }
                if (a[header.value] && !b[header.value]) return -1
                if (!a[header.value] && b[header.value]) return 1
                if (a[header.value] > b[header.value]) return -1
                if (a[header.value] < b[header.value]) return 1
            } else {
                if (header.value === 'createdAt' || header.value === 'updatedAt') {
                    if (new Date(a[header.value]).getTime() > new Date(b[header.value]).getTime()) return -1
                    if (new Date(a[header.value]).getTime() < new Date(b[header.value]).getTime()) return 1
                }
                if (a[header.value] && !b[header.value]) return 1
                if (!a[header.value] && b[header.value]) return -1
                if (a[header.value] < b[header.value]) return -1
                if (a[header.value] > b[header.value]) return 1
            }
            return 0
        })
        if (setTableData) setTableData(orderedData)
        setOrdered({ [header.name]: !ordered[header.name] })
        if (setSelected) setSelected(-1)
    }

    const loadingText = () => {
        return loadingTime > 3 ? <h4>This is taking a little longer than expected...</h4>
            : <h4>{`Loading ${name || 'table data'}...`}</h4>
    }

    const reorder = (list: dataObj[], startIndex: number, endIndex: number) => {
        const result = Array.from(list)
        const [removed] = result.splice(startIndex, 1)
        result.splice(endIndex, 0, removed)
        return result
    }

    const onDragEnd = (result: DropResult) => {
        setDragging(false)
        if (!result.destination) return

        const items = reorder(
            tableData,
            result.source.index,
            result.destination.index
        )
        if (saveTableDataOrder) saveTableDataOrder(items)
        if (setTableData) setTableData(items)
    }

    const renderLoading = () => {
        return <div className='datatable__loading'>
            <MoonLoader color='#0057ad' size={50} />
            {loadingText()}
        </div>
    }

    const renderNoData = () => {
        return <div className={`datatable__row${darkMode ? '--dark' : ''}`} style={{ height: '2vw', justifyContent: 'center', cursor: 'default' }}>
            {`No ${name || 'data'} to show.`}
        </div>
    }

    const renderHeaders = () => {
        return <div className={`datatable__headers${darkMode ? '--dark' : ''}`}>
            {tableHeaders.map((header: dataObj, i: number) =>
                <h4
                    key={i}
                    className={`datatable__header${darkMode ? '--dark' : ''}`}
                    onClick={() => orderBy(header)}
                    style={{ width: `${100 / tableHeaders.length}%` }}>
                    {header.name} {Object.keys(ordered).includes(header.name) ? ordered[header.name] ? `▼` : `▲` : ''}
                </h4>
            )}
        </div>
    }

    const renderTable = () => {
        return <div className='datatable__data-rows'>
            {tableData.map((row: dataObj, i: number) => i < maxItems &&
                <div
                    key={i}
                    className={selected === i ? `datatable__row-selected${darkMode ? '--dark' : ''}` : `datatable__row${darkMode ? '--dark' : ''}`}
                    onClick={() => setSelected ? i === selected ? setSelected(-1) : setSelected(i) : {}}
                    style={{
                        backgroundColor: !darkMode ? selected === i ? '#d4e1f6' : i % 2 === 0 ? 'white' : '#f5f5f5'
                            : selected === i ? '#5e598b85' : i % 2 === 0 ? '#38383852' : '',
                        animationDelay: `${((i || 1) + (maxItems > 10 ? (max || 10) - maxItems : maxItems)) / 30}s`
                    }}>
                    {tableHeaders.map((header: dataObj, j: number) =>
                        <h4
                            key={j}
                            className={`datatable__row-item datatable__row-${header.value}`}
                            style={{
                                width: `${100 / tableHeaders.length}%`,
                                color: header.value === 'status' && typeof row[header.value] === 'string' ? row[header.value] === 'success' ? 'green' : row[header.value] === 'failure' ? 'red' : 'orange' :
                                    typeof row[header.value] === 'boolean' && header.value != 'userAlert' ?
                                        row[header.value] ? darkMode ? '#00b000' : 'green' : 'red' : ''
                            }}>
                            {(header.value === 'createdAt' || header.value === 'updatedAt' || header.value === 'start' || header.value === 'end')
                                && row[header.value] ? `${getDate(row[header.value])}` :
                                header.value === 'active' || header.value === 'isSuper' ? row[header.value] ? 'Yes' : 'No' :
                                    header.value === 'createdBy' ? row[header.value] ? `User: ${row[header.value]}` : 'App' :
                                        header.value === 'status' ? typeof row[header.value] === 'string' ? row[header.value] : row[header.value] ? 'UP' : 'DOWN' :
                                            header.value === 'message' ? row.userAlert && row[header.value] ? row[header.value] : row['message'] || '--' :
                                                typeof row[header.value] === 'number' ? row[header.value] :
                                                    row && row[header.value] ? String(row[header.value])
                                                        : '--'}
                        </h4>
                    )}
                </div>
            )}
            {
                maxItems < tableData.length ?
                    <button className={`datatable__lazy-btn${darkMode ? '--dark' : ''}`} onClick={() => setMaxItems(maxItems + 10)}>{`Show more ${name ? name : ''} ▼`}</button>
                    : tableData.length && maxItems >= tableData.length && tableData.length > (max || 10) ?
                        <button className={`datatable__lazy-btn${darkMode ? '--dark' : ''}`} onClick={() => setMaxItems(max || 10)}>Show less ▲</button>
                        : ''
            }
        </div >
    }

    const renderDraggableTable = () => {
        return <DragDropContext onDragEnd={onDragEnd} onDragStart={() => setDragging(true)}>
            <Droppable droppableId="droppable">
                {provided =>
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                        <div className='datatable__data-rows'>
                            {tableData.map((row: dataObj, i: number) => i < maxItems &&
                                <Draggable key={i} draggableId={String(i)} index={i}>
                                    {provided =>
                                        <div
                                            key={i}
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}>
                                            <div className={selected === i ? `datatable__row-selected${darkMode ? '--dark' : ''}` : `datatable__row${darkMode ? '--dark' : ''}`}
                                                onClick={() => setSelected ? i === selected ? setSelected(-1) : setSelected(i) : {}}
                                                style={{
                                                    backgroundColor: !darkMode ? selected === i ? '#d4e1f6' : i % 2 === 0 ? 'white' : '#f5f5f5'
                                                        : selected === i ? '#5e598b85' : i % 2 === 0 ? '#38383852' : '',
                                                    animationDelay: `${((i || 1) + (maxItems > 10 ? (max || 10) - maxItems : maxItems)) / 30}s`
                                                }}>
                                                {tableHeaders.map((header: dataObj, j: number) =>
                                                    <h4
                                                        key={j}
                                                        className={`datatable__row-item datatable__row-${header.value}`}
                                                        style={{
                                                            width: `${100 / tableHeaders.length}%`,
                                                            color: header.value === 'status' && typeof row[header.value] === 'string' ? row[header.value] === 'success' ? 'green' : row[header.value] === 'failure' ? 'red' : 'orange' :
                                                                typeof row[header.value] === 'boolean' && header.value != 'userAlert' ?
                                                                    row[header.value] ? darkMode ? '#00b000' : 'green' : 'red' : ''
                                                        }}>
                                                        {(header.value === 'createdAt' || header.value === 'updatedAt' || header.value === 'start' || header.value === 'end')
                                                            && row[header.value] ? `${getDate(row[header.value])}` :
                                                            header.value === 'active' || header.value === 'isSuper' ? row[header.value] ? 'Yes' : 'No' :
                                                                header.value === 'createdBy' ? row[header.value] ? `User: ${row[header.value]}` : 'App' :
                                                                    header.value === 'status' ? row[header.value] ? 'UP' : 'DOWN' :
                                                                        header.value === 'message' ? row.userAlert && row[header.value] ? row[header.value] : row['message'] || '--' :
                                                                            typeof row[header.value] === 'number' ? row[header.value] :
                                                                                row && row[header.value] ? String(row[header.value])
                                                                                    : '--'}
                                                    </h4>
                                                )}
                                            </div>
                                        </div>
                                    }
                                </Draggable>
                            )}
                            {!dragging ?
                                maxItems < tableData.length ?
                                    <button className={`datatable__lazy-btn${darkMode ? '--dark' : ''}`} onClick={() => setMaxItems(maxItems + 10)}>{`Show more ${name ? name : ''} ▼`}</button>
                                    : tableData.length && maxItems >= tableData.length && tableData.length > (max || 10) ?
                                        <button className={`datatable__lazy-btn${darkMode ? '--dark' : ''}`} onClick={() => setMaxItems(max || 10)}>Show less ▲</button>
                                        : '' : ''
                            }
                        </div>
                        {provided.placeholder}
                    </div>
                }
            </Droppable>
        </DragDropContext >
    }

    return (
        <div className={`datatable__container${darkMode ? '--dark' : ''}`} style={style}>
            <div className='datatable__titles'>
                <h4 className='datatable__title'>{title || ''}</h4>
            </div>
            {renderHeaders()}
            {loading ? renderLoading() :
                tableData && Array.isArray(tableData) && tableData.length ?
                    draggable ? renderDraggableTable() : renderTable() :
                    renderNoData()}
        </div >
    )
}