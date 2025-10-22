import React from "react"
import { sortArray } from "../../helpers"
import { dataObj } from "../../types"

type Props = {
    label?: string
    arrData?: dataObj[]
    colors: { [value: string]: string }
    objKey: string
    percentageFor: string
    style?: React.CSSProperties
}

export default function ProgressBar({ label, arrData, colors, objKey, percentageFor, style }: Props) {

    const getPercentage = (key: string) => {
        if (Object.keys(colors)) {
            const matchLength = (arrData || []).filter(d => d[objKey] === key).length
            const result = parseFloat(`${(matchLength * 100 / (arrData || []).length)}`).toFixed(1)
            return (result.split('.')[1] === "0" ? result.split('.')[0] : result) + '%'
        }
        return ''
    }

    return (
        <div className="progressbar__container" style={style}>
            <div className="progressbar__row">
                <p className="progressbar__label">{label || ''}</p>
                {percentageFor ?
                    <p className="progressbar__percentage">{getPercentage(percentageFor).replace('NaN', '- ')}</p>
                    : ''}
            </div>
            <div className="progressbar__bar">
                {Object.keys(colors).map(key =>
                    <div
                        key={key}
                        style={{
                            background: colors[key],
                            width: `${getPercentage(key)}`
                        }}
                        className="progressbar__step"
                    />
                )}
                {!arrData || !arrData.length &&
                    <div
                        style={{
                            background: 'gray',
                            width: `100%`
                        }}
                        className="progressbar__step"
                    />}
            </div>
        </div>
    )
}