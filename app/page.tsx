"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    console.log("Login attempt started")

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log("Login response:", data)

      if (response.ok) {
        // Store token and user data
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        console.log("Token and user data stored")
        
        // Force a hard navigation to dashboard
        window.location.href = "/dashboard"
      } else {
        console.log("Login failed:", data.error)
        setError(data.error || "Invalid email or password")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An error occurred. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Green sidebar with illustration */}
      <div className="hidden md:flex md:w-1/2 bg-emerald-600 flex-col items-center justify-center p-8 relative">
        <div className="absolute top-6 left-6">
          <div className="flex items-center gap-2 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M12 2a3 3 0 0 0-3 3c0 1.6.8 3 2 4l-2 2h6l-2-2c1.2-1 2-2.4 2-4a3 3 0 0 0-3-3z"></path>
              <path d="M15.4 13a4 4 0 0 1 0 6l-1.4 1.4"></path>
              <path d="M8.6 13a4 4 0 0 0 0 6l1.4 1.4"></path>
              <path d="M7 18h10"></path>
            </svg>
            <span className="text-xl font-bold">MedicAID</span>
          </div>
        </div>
        <div className="max-w-md text-center">
          <div className="mb-6 mx-auto w-64 h-64 relative">
            <Image
              src="/placeholder.svg?height=256&width=256"
              alt="Online Consultation"
              width={256}
              height={256}
              priority
              className="object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Online Consultation</h2>
          <p className="text-emerald-100 text-sm">Mobile entry</p>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[10%] left-[20%] w-2 h-2 rounded-full bg-pink-500 opacity-70"></div>
            <div className="absolute top-[30%] right-[15%] w-2 h-2 rounded-full bg-emerald-300 opacity-70"></div>
            <div className="absolute bottom-[25%] left-[10%] w-2 h-2 rounded-full bg-yellow-400 opacity-70"></div>
            <div className="absolute bottom-[10%] right-[20%] w-2 h-2 rounded-full bg-purple-500 opacity-70"></div>
            <div className="absolute top-[50%] left-[50%] w-2 h-2 rounded-full bg-emerald-200 opacity-70"></div>
            <div className="absolute top-[70%] right-[30%] w-2 h-2 rounded-full bg-red-400 opacity-70"></div>
          </div>
        </div>
      </div>

      {/* White content area */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6">Welcome back!</h1>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="pt-2">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Login
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/signup" className="text-emerald-600 hover:underline">
                Signup
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

