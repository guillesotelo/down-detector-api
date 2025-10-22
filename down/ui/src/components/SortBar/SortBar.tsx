import React, { useContext, useState } from 'react'
import Dropdown from '../Dropdown/Dropdown'
import { AppContext } from '../../AppContext'

type Props = {
    setSortBy: (value: string) => void
    sortBy: string
    options: string[]
}

export default function SortBar({ setSortBy, sortBy, options }: Props) {
    const { darkMode } = useContext(AppContext)
    return (
        <div
            className='sortbar__container'
            style={{
                backgroundColor: darkMode ? 'black' : 'white',
                border: darkMode ? '1px solid gray' : '1px solid lightgray'
            }}>
            <p className="sortbar__label" style={{ color: darkMode ? '#bfbfbf' : '#636363' }}>Sort by</p>
            <Dropdown
                label=''
                options={options}
                selected={sortBy}
                setSelected={setSortBy}
                value={sortBy}
                style={{ minWidth: '8rem' }}
            />
        </div>
    )
}