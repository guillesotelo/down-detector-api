import React from 'react'

type Props = {
    label?: string
    value?: string | number
    inline?: boolean
    style?: React.CSSProperties
    color?: string
}

export default function TextData({ label, value, inline, style, color }: Props) {
    return (
        <div
            className="textdata__container"
            style={{
                flexDirection: inline ? 'row' : 'column',
                gap: inline ? '1rem' : '',
                ...style
            }}>
            <p className="textdata__label">{label}</p>
            <p className="textdata__value" style={{ marginTop: !inline ? '.2rem' : '', color: color || '' }}>{value}</p>
        </div>
    )
}