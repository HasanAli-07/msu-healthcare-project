"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface DashboardData {
  user: {
    id: number
    username: string
    email: string
    role: string
  }
  appointments: number
  total_appointments: number
  prescriptions: number
  totalPatients: number
  visits: {
    daily: number
    monthly: number
    yearly: number
  }
  patient_info?: {
    age: number
    gender: string
    weight: number
    height: number
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Add default data for charts
const defaultWorkingHoursData = [
  { time: '9 AM', patients: 0 },
  { time: '10 AM', patients: 0 },
  { time: '11 AM', patients: 0 },
  { time: '12 PM', patients: 0 },
  { time: '2 PM', patients: 0 },
  { time: '3 PM', patients: 0 },
  { time: '4 PM', patients: 0 },
  { time: '5 PM', patients: 0 }
];

const defaultDiseaseData = [
  { name: 'Fever', value: 0 },
  { name: 'Cold & Flu', value: 0 },
  { name: 'Diabetes', value: 0 },
  { name: 'Blood Pressure', value: 0 },
  { name: 'Others', value: 0 }
];

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [doctorProfile, setDoctorProfile] = useState({
    specialization: '',
    qualification: '',
    experience_years: 0,
    consultation_fee: 0,
    available_days: [] as string[]
  })
  const [workingHoursData, setWorkingHoursData] = useState(defaultWorkingHoursData)
  const [diseaseData, setDiseaseData] = useState(defaultDiseaseData)

    const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token")
      console.log("Dashboard - Token found:", !!token)
      
      if (!token) {
        console.log("No token found, redirecting to login")
        router.push("/")
        return
      }

      console.log("Fetching dashboard data with token:", token)
        const response = await fetch("http://localhost:5000/api/dashboard", {
        method: 'GET',
          headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      console.log("Dashboard API Response Status:", response.status)

        if (response.ok) {
          const data = await response.json()
        console.log("Dashboard data received:", data)
          setDashboardData(data)

        // If user is a doctor, fetch doctor profile
        if (data.user.role === 'doctor') {
          const profileResponse = await fetch("http://localhost:5000/api/doctor/profile", {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (profileResponse.ok) {
            const profileData = await profileResponse.json()
            setDoctorProfile(profileData)
          }
        }
        } else {
        const errorData = await response.json().catch(() => ({}))
        console.log("Dashboard API error:", errorData)
        
        if (response.status === 422 || response.status === 401) {
          console.log("Token invalid or expired, clearing storage and redirecting")
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          window.location.href = "/"
        }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      setDashboardData(null)
      } finally {
        setLoading(false)
      }
    }

  useEffect(() => {
    fetchDashboardData()
  }, [router])

  useEffect(() => {
    if (dashboardData?.user?.role === 'doctor') {
      fetchChartData()
      // Fetch chart data every 30 seconds
      const interval = setInterval(fetchChartData, 30000)
      return () => clearInterval(interval)
    }
  }, [dashboardData?.user?.role])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      console.log("Sending profile data:", doctorProfile)

      const response = await fetch("http://localhost:5000/api/doctor/profile", {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(doctorProfile)
      })

      if (response.ok) {
        const data = await response.json()
        setDoctorProfile(prev => ({
          ...prev,
          ...data.data
        }))
        alert("Profile updated successfully!")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile")
    }
  }

  const fetchChartData = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("http://localhost:5000/api/doctor/charts", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Chart data received:", data)
        if (data.patient_flow && data.patient_flow.length > 0) {
          setWorkingHoursData(data.patient_flow)
        }
        if (data.disease_distribution && data.disease_distribution.length > 0) {
          setDiseaseData(data.disease_distribution)
        }
      } else {
        console.error("Failed to fetch chart data:", response.status)
      }
    } catch (error) {
      console.error("Error fetching chart data:", error)
    }
  }

  const updateChartData = async (timeSlot: string, diseaseName: string) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      await fetch("http://localhost:5000/api/doctor/charts/update", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          time_slot: timeSlot,
          disease_name: diseaseName
        })
      })

      // Fetch updated data
      fetchChartData()
    } catch (error) {
      console.error("Error updating chart data:", error)
    }
  }

  // Add this to update charts when a new appointment is created
  const handleNewAppointment = async (timeSlot: string, disease: string) => {
    try {
      await updateChartData(timeSlot, disease)
      // Refresh chart data
      fetchChartData()
    } catch (error) {
      console.error("Error updating charts:", error)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!dashboardData) {
    return <div className="flex justify-center items-center h-screen">Error loading dashboard data</div>
  }

  const DoctorDashboard = () => (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Welcome Back, Dr. {dashboardData.user.username}! 👋</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your patients today.</p>
        </div>
        <Button onClick={handleLogout} variant="outline" className="border-2 hover:bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="text-4xl font-bold text-blue-700">{dashboardData.appointments}</span>
              <div className="ml-4 p-2 bg-blue-200 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-blue-700 mt-2">Total: {dashboardData.total_appointments}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="text-4xl font-bold text-emerald-700">{dashboardData.totalPatients}</span>
              <div className="ml-4 p-2 bg-emerald-200 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="text-4xl font-bold text-purple-700">{dashboardData.prescriptions}</span>
              <div className="ml-4 p-2 bg-purple-200 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">Patient Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-amber-700">{dashboardData.visits.daily}</p>
                <p className="text-xs text-amber-900">Today</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{dashboardData.visits.monthly}</p>
                <p className="text-xs text-amber-900">Monthly</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{dashboardData.visits.yearly}</p>
                <p className="text-xs text-amber-900">Yearly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-xl font-bold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Patient Flow Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={workingHoursData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="patients" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-xl font-bold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Disease Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diseaseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {diseaseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-xl font-bold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Doctor Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Specialization</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Cardiology"
                    value={doctorProfile.specialization}
                    onChange={(e) => setDoctorProfile(prev => ({
                      ...prev,
                      specialization: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Qualification</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. MBBS, MD"
                    value={doctorProfile.qualification}
                    onChange={(e) => setDoctorProfile(prev => ({
                      ...prev,
                      qualification: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Experience (years)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Years of experience"
                    value={doctorProfile.experience_years || ''}
                    onChange={(e) => setDoctorProfile(prev => ({
                      ...prev,
                      experience_years: e.target.value ? parseInt(e.target.value) : 0
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Consultation Fee</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Fee in Rs."
                    value={doctorProfile.consultation_fee || ''}
                    onChange={(e) => setDoctorProfile(prev => ({
                      ...prev,
                      consultation_fee: e.target.value ? parseFloat(e.target.value) : 0
                    }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Available Days</label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <label key={day} className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={doctorProfile.available_days.includes(day)}
                          onChange={(e) => setDoctorProfile(prev => ({
                            ...prev,
                            available_days: e.target.checked 
                              ? [...prev.available_days, day]
                              : prev.available_days.filter(d => d !== day)
                          }))}
                        />
                      </div>
                      <div className="ml-2 text-sm">
                        <label className="font-medium text-gray-700">{day}</label>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <Button 
                type="button"
                onClick={handleUpdateProfile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-xl font-bold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
                <p className="text-gray-500 text-lg">No appointments scheduled for today</p>
                <p className="text-gray-400 text-sm mt-1">Your schedule is clear</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const PatientDashboard = () => {
    const [patientProfile, setPatientProfile] = useState({
      age: 0,
      gender: '',
      blood_group: '',
      weight: 0,
      height: 0,
      medical_history: '',
      allergies: '',
      chronic_diseases: '',
      current_medications: '',
      family_history: '',
      lifestyle_habits: '',
      emergency_contact: '',
      emergency_contact_relation: '',
      address: '',
      occupation: '',
      marital_status: ''
    });

    const [vitals, setVitals] = useState({
      blood_pressure: '',
      heart_rate: 0,
      temperature: 0,
      respiratory_rate: 0,
      blood_sugar: 0
    });

    const handleUpdateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("http://localhost:5000/api/patient/profile", {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(patientProfile)
        });

        if (response.ok) {
          const data = await response.json();
          setPatientProfile(prev => ({
            ...prev,
            ...data.data
          }));
          alert("Profile updated successfully!");
        } else {
          const error = await response.json();
          alert(error.error || "Failed to update profile");
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile");
      }
    };

    const handleUpdateVitals = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("http://localhost:5000/api/patient/vitals", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(vitals)
        });

        if (response.ok) {
          alert("Vitals updated successfully!");
        } else {
          const error = await response.json();
          alert(error.error || "Failed to update vitals");
        }
      } catch (error) {
        console.error("Error updating vitals:", error);
        alert("Failed to update vitals");
      }
    };

    useEffect(() => {
      const fetchPatientProfile = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) return;

          const response = await fetch("http://localhost:5000/api/patient/profile", {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            setPatientProfile(data);
          }
        } catch (error) {
          console.error("Error fetching patient profile:", error);
        }
      };

      fetchPatientProfile();
    }, []);

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome, {dashboardData.user.username}! 👋</h1>
            <p className="text-gray-600 mt-1">Manage your health information and appointments here.</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="border-2 hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <span className="text-3xl font-bold">{dashboardData.appointments}</span>
                <div className="ml-4 p-2 bg-amber-100 rounded-full">
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
                    className="w-5 h-5 text-amber-500"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Total: {dashboardData.total_appointments}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <span className="text-3xl font-bold">{dashboardData.prescriptions}</span>
                <div className="ml-4 p-2 bg-emerald-100 rounded-full">
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
                    className="w-5 h-5 text-emerald-500"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Medical Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <span className="text-3xl font-bold">0</span>
                <div className="ml-4 p-2 bg-purple-100 rounded-full">
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
                    className="w-5 h-5 text-purple-500"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Hospital Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{dashboardData.visits.daily}</p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{dashboardData.visits.monthly}</p>
                  <p className="text-xs text-gray-500">Monthly</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{dashboardData.visits.yearly}</p>
                  <p className="text-xs text-gray-500">Yearly</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {dashboardData.patient_info && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Age</p>
                  <p className="text-lg font-medium">{dashboardData.patient_info.age} years</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="text-lg font-medium">{dashboardData.patient_info.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="text-lg font-medium">{dashboardData.patient_info.weight} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Height</p>
                  <p className="text-lg font-medium">{dashboardData.patient_info.height} cm</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">No upcoming appointments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">No recent prescriptions</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleUpdateProfile}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Age</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border rounded-lg"
                      value={patientProfile.age}
                      onChange={(e) => setPatientProfile(prev => ({
                        ...prev,
                        age: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Gender</label>
                    <select
                      className="w-full p-2.5 border rounded-lg"
                      value={patientProfile.gender}
                      onChange={(e) => setPatientProfile(prev => ({
                        ...prev,
                        gender: e.target.value
                      }))}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Blood Group</label>
                    <select
                      className="w-full p-2.5 border rounded-lg"
                      value={patientProfile.blood_group}
                      onChange={(e) => setPatientProfile(prev => ({
                        ...prev,
                        blood_group: e.target.value
                      }))}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-2.5 border rounded-lg"
                      value={patientProfile.weight}
                      onChange={(e) => setPatientProfile(prev => ({
                        ...prev,
                        weight: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-2.5 border rounded-lg"
                      value={patientProfile.height}
                      onChange={(e) => setPatientProfile(prev => ({
                        ...prev,
                        height: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Occupation</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border rounded-lg"
                      value={patientProfile.occupation}
                      onChange={(e) => setPatientProfile(prev => ({
                        ...prev,
                        occupation: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Marital Status</label>
                    <select
                      className="w-full p-2.5 border rounded-lg"
                      value={patientProfile.marital_status}
                      onChange={(e) => setPatientProfile(prev => ({
                        ...prev,
                        marital_status: e.target.value
                      }))}
                    >
                      <option value="">Select Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    className="w-full p-2.5 border rounded-lg"
                    rows={2}
                    value={patientProfile.address}
                    onChange={(e) => setPatientProfile(prev => ({
                      ...prev,
                      address: e.target.value
                    }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Emergency Contact</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border rounded-lg"
                      value={patientProfile.emergency_contact}
                      onChange={(e) => setPatientProfile(prev => ({
                        ...prev,
                        emergency_contact: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Relation</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border rounded-lg"
                      value={patientProfile.emergency_contact_relation}
                      onChange={(e) => setPatientProfile(prev => ({
                        ...prev,
                        emergency_contact_relation: e.target.value
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Medical History</label>
                  <textarea
                    className="w-full p-2.5 border rounded-lg"
                    rows={3}
                    value={patientProfile.medical_history}
                    onChange={(e) => setPatientProfile(prev => ({
                      ...prev,
                      medical_history: e.target.value
                    }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Allergies</label>
                    <textarea
                      className="w-full p-2.5 border rounded-lg"
                      rows={2}
                      value={patientProfile.allergies}
                      onChange={(e) => setPatientProfile(prev => ({
                        ...prev,
                        allergies: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Chronic Diseases</label>
                    <textarea
                      className="w-full p-2.5 border rounded-lg"
                      rows={2}
                      value={patientProfile.chronic_diseases}
                      onChange={(e) => setPatientProfile(prev => ({
                        ...prev,
                        chronic_diseases: e.target.value
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Current Medications</label>
                    <textarea
                      className="w-full p-2.5 border rounded-lg"
                      rows={2}
                      value={patientProfile.current_medications}
                      onChange={(e) => setPatientProfile(prev => ({
                        ...prev,
                        current_medications: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Family History</label>
                    <textarea
                      className="w-full p-2.5 border rounded-lg"
                      rows={2}
                      value={patientProfile.family_history}
                      onChange={(e) => setPatientProfile(prev => ({
                        ...prev,
                        family_history: e.target.value
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Lifestyle Habits</label>
                  <textarea
                    className="w-full p-2.5 border rounded-lg"
                    rows={2}
                    value={patientProfile.lifestyle_habits}
                    onChange={(e) => setPatientProfile(prev => ({
                      ...prev,
                      lifestyle_habits: e.target.value
                    }))}
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Update Profile
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vitals</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleUpdateVitals}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Blood Pressure</label>
                    <input
                      type="text"
                      placeholder="120/80"
                      className="w-full p-2.5 border rounded-lg"
                      value={vitals.blood_pressure}
                      onChange={(e) => setVitals(prev => ({
                        ...prev,
                        blood_pressure: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border rounded-lg"
                      value={vitals.heart_rate}
                      onChange={(e) => setVitals(prev => ({
                        ...prev,
                        heart_rate: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-2.5 border rounded-lg"
                      value={vitals.temperature}
                      onChange={(e) => setVitals(prev => ({
                        ...prev,
                        temperature: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Respiratory Rate</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border rounded-lg"
                      value={vitals.respiratory_rate}
                      onChange={(e) => setVitals(prev => ({
                        ...prev,
                        respiratory_rate: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Blood Sugar</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-2.5 border rounded-lg"
                      value={vitals.blood_sugar}
                      onChange={(e) => setVitals(prev => ({
                        ...prev,
                        blood_sugar: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Update Vitals
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
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
              className="w-6 h-6 text-emerald-600"
            >
              <path d="M12 2a3 3 0 0 0-3 3c0 1.6.8 3 2 4l-2 2h6l-2-2c1.2-1 2-2.4 2-4a3 3 0 0 0-3-3z"></path>
              <path d="M15.4 13a4 4 0 0 1 0 6l-1.4 1.4"></path>
              <path d="M8.6 13a4 4 0 0 0 0 6l1.4 1.4"></path>
              <path d="M7 18h10"></path>
            </svg>
            <span className="text-xl font-bold text-emerald-600">MedicAID</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {dashboardData.user.role === 'doctor' ? 'Doctor' : 'Patient'} Dashboard
            </span>
            <Button variant="outline" className="text-emerald-600 border-emerald-600" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {dashboardData.user.role === 'doctor' ? <DoctorDashboard /> : <PatientDashboard />}
      </main>
    </div>
  )
}

