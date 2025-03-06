"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient"
  })
  const [error, setError] = useState("")
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const response = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: formData.name,
          email: formData.email, 
          password: formData.password,
          role: formData.role
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push("/") // Redirect to login page after successful signup
      } else {
        const data = await response.json()
        setError(data.error || "An error occurred during signup")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Green sidebar with medical symbol */}
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-full h-full"
            >
              <path
                d="M12 2a3 3 0 0 0-3 3c0 1.6.8 3 2 4l-2 2h6l-2-2c1.2-1 2-2.4 2-4a3 3 0 0 0-3-3z"
                strokeWidth="0.5"
                fill="white"
              ></path>
              <path d="M15.4 13a4 4 0 0 1 0 6l-1.4 1.4" strokeWidth="0.5"></path>
              <path d="M8.6 13a4 4 0 0 0 0 6l1.4 1.4" strokeWidth="0.5"></path>
              <path d="M7 18h10" strokeWidth="0.5"></path>
              <circle cx="12" cy="12" r="10" strokeWidth="0.5"></circle>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">MedicAID</h2>
          <p className="text-emerald-100 text-sm">Where Expertise Meets Innovation</p>
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
          <h1 className="text-2xl font-bold mb-6">Sign up for MedicAID</h1>
          <form className="space-y-4" onSubmit={handleSignup}>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium text-gray-700">
                Register as
              </label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="pt-2">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Sign Up
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/" className="text-emerald-600 hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

