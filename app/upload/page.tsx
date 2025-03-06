import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Upload() {
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
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
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
          <h2 className="text-2xl font-bold text-white mb-2">Differential Diagnosis</h2>
          <p className="text-emerald-100 text-sm">Automated</p>
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
                <div className="w-6 h-6 rounded-full border-2 border-emerald-600 flex items-center justify-center text-emerald-600">
                  <span className="text-xs">3</span>
                </div>
                <div className="w-12 h-1 bg-gray-300"></div>
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-400">
                  <span className="text-xs">4</span>
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-6 text-center">Upload your medical imaging scans</h1>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center">
            <div className="mb-4">
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
                className="w-12 h-12 text-gray-400"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-4 text-center">Drag and drop your files here, or click to browse</p>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Browse Files</Button>
          </div>

          <div className="mt-8 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/" className="text-emerald-600 hover:underline">
                  Login
                </Link>
              </p>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
        </div>
      </div>
    </div>
  )
}

