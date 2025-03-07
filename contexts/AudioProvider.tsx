"use client";
import { createContext, useState, useEffect } from 'react'

export const MyAudioContext = createContext({ setAudioContext: () => undefined, audioContext: null } as { setAudioContext: any, audioContext: AudioContext | null })

export default function AudioProvider({children}: any) {
  const [audioContext, setAudioContext] = useState<null | AudioContext>(null)  
  useEffect(() => {
    setAudioContext(new AudioContext())
  },[])
  return <MyAudioContext.Provider value={{audioContext, setAudioContext}}>{children}</MyAudioContext.Provider>
}