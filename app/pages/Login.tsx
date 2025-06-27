import { useState } from 'react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Logging in with:', email, password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAD4D4] px-4">


      <div className="flex w-full max-w-6xl bg-white shadow-lg rounded-3xl overflow-hidden">
        {/* Left Panel */}
        <div className="w-1/2 bg-[#D62828] text-white p-10 hidden md:flex flex-col justify-center rounded-l-3xl">
          <h1 className="text-4xl font-bold mb-4">WELCOME</h1>
          <h2 className="text-lg font-semibold mb-2">Your headline name</h2>
          <p className="text-white/90 text-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>

        {/* Right Panel (Login Form) */}
        <div className="w-full md:w-1/2 bg-white p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-[#D62828] mb-1">Sign in</h2>
          <p className="text-sm text-gray-500 mb-6">Please login to continue</p>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#D62828]"
                required
              />
            </div>

            {/* Password */}
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#D62828]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-9 right-3 text-sm text-[#D62828] focus:outline-none"
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between text-sm mb-6">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Remember me
              </label>
              <a href="#" className="text-[#D62828] hover:underline">
                Forgot Password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-[#D62828] hover:bg-[#b92121] text-white py-2 rounded-md shadow-md font-semibold"
            >
              Sign in
            </button>
          </form>

          {/* Sign Up */}
          <p className="mt-6 text-sm text-center text-gray-500">
            Don’t have an account?{' '}
            <a href="#" className="text-[#D62828] font-medium hover:underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
