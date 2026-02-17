import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginUser } from "../api/api";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return toast.error("All fields are required");
    }

    try {
      setLoading(true);

      const data = await loginUser(form);

      // Example: store token if backend sends it
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      toast.success("Login successful");
      navigate("/dashboard");

    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
        

      {/* Left Branding Section */}
      <div className="hidden lg:flex w-1/2 bg-black text-white flex-col justify-center px-16">
        <h1 className="text-4xl font-bold mb-6">FlowTasks</h1>
        <p className="text-lg text-gray-300 leading-relaxed">
          Organize your goals.
          Track delays.
          Build discipline.
        </p>
      </div>

      {/* Right Form Section */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl">

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h2>

          <p className="text-gray-500 mb-6">
            Log in to continue managing your tasks.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-300 focus:border-black focus:ring-0 rounded-lg px-4 py-3 outline-none transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full border border-gray-300 focus:border-black focus:ring-0 rounded-lg px-4 py-3 outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-black font-medium cursor-pointer hover:underline"
            >
              Create one
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
