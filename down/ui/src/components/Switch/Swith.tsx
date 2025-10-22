import React, { useContext } from 'react'
import { AppContext } from '../../AppContext'

type Props = {
    label: string
    on: string
    off: string
    value: boolean
    setValue: (value: boolean) => void
    style?: React.CSSProperties
}

export default function Switch({ label, on, off, value, setValue, style }: Props) {
    const { darkMode } = useContext(AppContext)
    return (
        <div
            className="switch__container"
            onClick={() => setValue(!value)}
            style={style}
        >
            {label ? <p className={`switch__label${darkMode ? '--dark' : ''}`}>{label}</p> : ''}
            <div
                className={`switch__row${darkMode ? '--dark' : ''}`}
                style={{
                    backgroundColor: value ? '#a4d8a4' : '',
                }}>
                <p className="switch__on">{on}</p>
                <p className={`switch__slider${value ? '--on' : '--off'}`} style={{ color: darkMode ? 'black' : '' }}></p>
                <p className="switch__off" style={{ color: darkMode ? 'lightgray' : '' }}>{off}</p>
            </div>
        </div>
    )
}