import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginUser, persistAuthSession } from "../api/api";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      toast.error("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      const data = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      persistAuthSession(data);
      toast.success("Login successful");
      window.location.href = "/dashboard";
    } catch (err) {
      toast.error((err as Error).message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 lg:grid lg:grid-cols-2">
      <section className="hidden bg-black px-16 text-white lg:flex lg:flex-col lg:justify-center">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-gray-400">FlowTasks</p>
        <h1 className="mb-6 text-5xl font-semibold leading-tight">
          Role-based task tracking for accountable teams.
        </h1>
        <p className="max-w-lg text-lg leading-8 text-gray-300">
          Sign in to manage users, assign work, and keep task progress visible from one dashboard.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.25em] text-gray-400">
            Welcome back
          </p>
          <h2 className="mb-2 text-3xl font-semibold text-gray-900">Sign in to FlowTasks</h2>
          <p className="mb-8 text-sm text-gray-500">
            Use your backend-issued credentials to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Login;
