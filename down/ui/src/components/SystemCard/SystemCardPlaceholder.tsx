import { useContext } from 'react'
import { AppContext } from '../../AppContext'

type Props = {
    delay?: string
}

export const SystemCardPlaceholderBlock = (darkMode: boolean) => {
    return (
        <div className="systemcard__placeholder">
            <div
                style={{
                    height: '3rem',
                    width: '100%',
                    backgroundImage: darkMode ?
                        'linear-gradient(110deg, #262626 8%, #4f4f4f 18%, #262626 33%)' :
                        'linear - gradient(110deg, #ececec 8 %, #f5f5f5 18 %, #ececec 33 %)'
                }}
                className='systemcard__loading-block' />
        </div>
    )
}

export default function SystemCardPlaceholder({ delay }: Props) {
    const { darkMode } = useContext(AppContext)

    return (
        <div className="systemcard__wrapper" style={{ animationDelay: `${delay || '0'}` }}>
            <div
                className={`systemcard__container${darkMode ? '--dark' : ''}`}
                style={{
                    borderColor: darkMode ? 'gray' : '#d3d3d361',
                    backgroundImage: ''
                }}>
                <div className="systemcard__placeholder">
                    <div
                        style={{
                            height: '.5rem',
                            backgroundImage: darkMode ?
                                'linear-gradient(110deg, #262626 8%, #4f4f4f 18%, #262626 33%)' :
                                'linear - gradient(110deg, #ececec 8 %, #f5f5f5 18 %, #ececec 33 %)'
                        }}
                        className='systemcard__loading-block' />
                </div>
                {SystemCardPlaceholderBlock(darkMode)}
                <div className="systemcard__footer">
                    <div
                        style={{
                            height: '.5rem',
                            backgroundImage: darkMode ?
                                'linear-gradient(110deg, #262626 8%, #4f4f4f 18%, #262626 33%)' :
                                'linear - gradient(110deg, #ececec 8 %, #f5f5f5 18 %, #ececec 33 %)'
                        }}
                        className='systemcard__loading-block' />
                </div>
            </div>
        </div>
    )
}