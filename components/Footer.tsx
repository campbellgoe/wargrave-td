"use client";
import Link from "next/link"
import { useState } from "react"
import React from 'react'

function Footer() {
  const [scale, setScale] = useState(1)
  return (
    <footer className="p-4 text-black bg-white text-xl">Made with <button className="appearance-none" onClick={() => {
      setScale(s => {
        if(s + 0.125 >= 2.8){
          return 1
        }
        return (s + 0.125)
      })
    }} style={{
      transform: 'scale(' + scale + ')',
    }}>❤️</button> by <Link className="hover:underline" target="_blank" href="https://georgecampbell.co.uk">George Campbell</Link> with help from <Link className="hover:underline" href="https://v0.dev" target="_blank">v0.dev</Link>. All Rights Reserved. Copyright &copy; 2025</footer>
  )
}

export default Footer


