import { PolarArea } from 'react-chartjs-2'
import { dataObj } from '../../types'
import React, { useContext } from 'react'
import { AppContext } from '../../AppContext'

type Props = {
    label?: string
    chartData?: any
    style?: React.CSSProperties
    chartOptions?: any
}

export default function PolarAreaChart({ chartData, label, style, chartOptions }: Props) {
    const { darkMode } = useContext(AppContext)
    const options = {
        plugins: {
            legend: {
                // display: false,
                labels: {
                    color: darkMode ? 'lightgray' : 'black'
                }
            }
        },
        ...chartOptions
    }

    return (
        <div className="PolarAreachart__container" style={style}>
            <p
                className="PolarAreachart__label"
                style={{
                    color: darkMode ? 'lightgray' : '#263d42',
                    marginBottom: chartOptions && chartOptions.plugins.legend.display === false ? '.5rem' : ''
                }}>
                {label}
            </p>
            <PolarArea data={chartData} options={options} />
        </div>
    )
}