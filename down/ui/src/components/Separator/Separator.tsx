import React, { useContext } from 'react'
import { AppContext } from '../../AppContext'

type Props = {}

export default function Separator({}: Props) {
    const { darkMode } = useContext(AppContext)
    return (
    <div style={{ width: '100%', borderBottom: darkMode ? '1px solid gray' : '1px solid lightgray', marginBottom: 5 }}></div>
  )
}