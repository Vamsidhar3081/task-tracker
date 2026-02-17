import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/api";
import toast from "react-hot-toast";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password) {
      return toast.error("All fields are required");
    }

    try {
      setLoading(true);
      await registerUser(form);
      toast.success("Registration successful");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100">

      {/* Left Branding Section (Desktop Only) */}
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
            Create Account
          </h2>

          <p className="text-gray-500 mb-6">
            Start managing your tasks smarter.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-gray-300 focus:border-black focus:ring-0 rounded-lg px-4 py-3 outline-none transition"
                placeholder="John Doe"
              />
            </div>

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
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-black font-medium cursor-pointer hover:underline"
            >
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
