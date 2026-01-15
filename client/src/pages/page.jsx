"use client"

import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../components/AuthContext.jsx'

export default function ButtonShowcase() {
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate('/login')
  }
  const handleRegister = () => {
    navigate('/register')
  }
  const { logout } = useAuth()
  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error("Logout error:", err?.message || err)
    }
    navigate('/login')

  }
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-blue-700 animate-gradient-x">
      {/* Blurred Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-lg scale-105"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1454817481404-7e84c1b73b4a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")'
        }}
      ></div>
            <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500/30 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />
        <div className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl bottom-10 right-10 animate-ping" />
      </div>

      {/* Dark Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Foreground Content */}
      <div className="relative w-full max-w-4xl p-10 space-y-8 bg-black/60 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">Welcome to The Band of Hawk</h1>
          <p className="text-white/80">ACL 7 Website</p>
        </div>

        {/* Buttons */}
        <section className="space-y-4 center">
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <button 
              onClick={handleLogin}
              className="bg-black border-2 border-white/40 hover:bg-gray-900 text-white font-bold rounded-xl transition-transform transform hover:scale-105 px-5 py-3"
            >
              Login
            </button>
            <button 
              onClick={handleRegister}
              className="bg-black border-2 border-white/40 hover:bg-gray-900 text-white font-bold rounded-xl transition-transform transform hover:scale-105 px-5 py-3"
            >
              Register
            </button>
                        <button 
              onClick={handleLogout}
              className="bg-black border-2 border-white/40 hover:bg-gray-900 text-white font-bold rounded-xl transition-transform transform hover:scale-105 px-5 py-3"
            >
              Logout
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
