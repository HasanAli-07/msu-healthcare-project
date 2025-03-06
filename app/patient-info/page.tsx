"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PatientInfo() {
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    weight: "",
    height: "",
    address: "",
  })
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      gender: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch('http://localhost:5000/api/patient-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const data = await response.json()
        console.error('Error saving patient info:', data.error)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
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
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-32 h-40 bg-white rounded-md relative">
                <div className="absolute -right-16 top-4 w-32 h-32 bg-emerald-700 rounded-md p-3">
                  <div className="w-full h-full border-2 border-dashed border-emerald-300 rounded flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-8 h-8"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                </div>
                <div className="absolute top-2 left-2 w-6 h-1 bg-red-500 rounded"></div>
                <div className="absolute top-5 left-2 w-4 h-1 bg-emerald-500 rounded"></div>
                <div className="absolute top-8 left-2 w-5 h-1 bg-blue-500 rounded"></div>
                <div className="absolute top-14 left-2 w-6 h-1 bg-gray-400 rounded"></div>
                <div className="absolute top-17 left-2 w-4 h-1 bg-gray-400 rounded"></div>
                <div className="absolute top-20 left-2 w-5 h-1 bg-gray-400 rounded"></div>
                <div className="absolute bottom-4 left-2 w-6 h-1 bg-red-500 rounded"></div>
              </div>
            </div>
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
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white">
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
                    className="w-4 h-4"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="w-12 h-1 bg-emerald-600"></div>
                <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white">
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
                    className="w-4 h-4"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="w-12 h-1 bg-emerald-600"></div>
                <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white">
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
                    className="w-4 h-4"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="w-12 h-1 bg-gray-300"></div>
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-400">
                  <span className="text-xs">4</span>
                </div>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="age" className="text-sm font-medium text-gray-700">
                  Age
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="gender" className="text-sm font-medium text-gray-700">
                  Gender
                </label>
                <Select onValueChange={handleSelectChange} value={formData.gender}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Please select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="weight" className="text-sm font-medium text-gray-700">
                  Weight
                </label>
                <div className="flex">
                  <input
                    id="weight"
                    name="weight"
                    type="number"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md">
                    kg
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="height" className="text-sm font-medium text-gray-700">
                  Height
                </label>
                <div className="flex">
                  <input
                    id="height"
                    name="height"
                    type="number"
                    value={formData.height}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md">
                    cm
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              ></textarea>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Next
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
                  className="w-4 h-4 ml-2"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

