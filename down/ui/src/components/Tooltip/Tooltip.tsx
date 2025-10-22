import React, { useEffect, useRef, useState } from 'react'

type Props = {
    tooltip?: string
    children?: React.ReactNode
    inline?: boolean
    show?: boolean | null
    style?: React.CSSProperties
    boxStyle?: React.CSSProperties
    position?: 'up' | 'down'
}

export default function Tooltip({ tooltip, children, inline, style, boxStyle, show, position }: Props) {
    const [showTooltip, setShowTooltip] = useState(show)
    const containerRef = useRef<HTMLDivElement>(null)
    const [childrenWidth, setChildrenWidth] = useState(0)
    const [childrenHeight, setChildrenHeight] = useState(0)

    useEffect(() => {
        const updateClientSize = () => {
            if (containerRef.current) {
                setChildrenWidth(containerRef.current.getBoundingClientRect().width)
                setChildrenHeight(containerRef.current.getBoundingClientRect().height)
            }
        }
        updateClientSize()
        window.addEventListener('resize', updateClientSize)
        return () => {
            window.removeEventListener('resize', updateClientSize)
        }
    }, [children])

    useEffect(() => {
        if (show === false || show === null) setShowTooltip(false)
    }, [show])

    return (
        <div
            className="tooltip__container"
            style={{ ...style, placeContent: inline ? '' : 'center' }}
            onMouseOver={() => setShowTooltip(true)}
            onMouseOut={() => setShowTooltip(false)}
            ref={containerRef}>
            {children}
            {tooltip ?
                <div className={inline ? 'tooltip__box-inline' : 'tooltip__box'} style={{
                    display: showTooltip ? 'block' : 'none',
                    marginLeft: inline ? childrenWidth * 1.2 : '',
                    top: !inline ? position === 'up' ? childrenHeight * -1.4 : childrenHeight * 1.4 : '',
                    marginTop: inline ? childrenHeight / 10 : '',
                    ...boxStyle
                }}>
                    <p className={position === 'up' ? 'tooltip__text-up' : inline ? 'tooltip__text-inline' : 'tooltip__text'} >
                        {tooltip}
                    </p>
                </div> : ''}
        </div>
    )
}
