import React, { ReactNode, useContext, useEffect, useState } from 'react'
import { AppContext } from '../../AppContext'
import Api from '../../assets/icons/api.svg'

type Props = {
    children?: ReactNode
    onClose?: () => void
    title?: string | null
    subtitle?: string | null
    style?: React.CSSProperties
    contentStyle?: React.CSSProperties
    logo?: string
    showLogo?: boolean
    linkTitle?: string
}

export default function Modal({ children, onClose, title, subtitle, style, contentStyle, logo, showLogo, linkTitle }: Props) {
    const [closeAnimation, setCloseAnimation] = useState('')
    const { darkMode } = useContext(AppContext)

    useEffect(() => {
        const closeOnOuterClick = (e: any) => {
            if (e.target.className === 'modal__wrapper') closeModal()
        }
        const closeOnEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeModal()
        }
        // document.addEventListener('click', closeOnOuterClick)
        document.addEventListener('keydown', closeOnEsc)
        return () => {
            // document.removeEventListener('click', closeOnOuterClick)
            document.removeEventListener('keydown', closeOnEsc)
        }
    }, [])

    const closeModal = () => {
        setCloseAnimation('close-animation')
        setTimeout(() => onClose ? onClose() : null, 200)
    }

    return (
        <div className="modal__wrapper">
            <div className={`modal__container${darkMode ? '--dark' : ''} ${closeAnimation}`} style={style}>
                <div className="modal__header">
                    <div className="modal__titles">
                        {showLogo ?
                            <div className='modal__logo-div'>
                                <img
                                    src={logo || Api}
                                    alt="System Logo"
                                    className="systemcard__logo"
                                    style={{
                                        filter: darkMode && !logo ? 'invert(100%) sepia(5%) saturate(433%) hue-rotate(6deg) brightness(120%) contrast(100%)' : ''
                                    }}
                                    draggable={false}
                                />
                                {linkTitle ?
                                    <a href={linkTitle} target='_blank' className='modal__title-link'><h1 className="modal__title">{title}</h1></a> :
                                    <h1 className="modal__title">{title}</h1>
                                }
                            </div>
                            :
                            <h1 className="modal__title">{title}</h1>
                        }
                        <h2 className="modal__subtitle">{subtitle}</h2>
                    </div>
                    <button className={`modal__close${darkMode ? '--dark' : ''}`} onClick={closeModal}>X</button>
                </div>
                <div className="modal__content" style={contentStyle}>
                    {children}
                </div>
            </div>
        </div>
    )
}