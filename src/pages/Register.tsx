import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createManagedUser, getSetupStatus, getStoredRole, isAdminRole, registerUser } from "../api/api";

type Role = "USER" | "ADMIN";

/* ------------------------------------------------------------------ */
/*  Team roster animation (left panel)                                 */
/* ------------------------------------------------------------------ */

type Person = {
  name: string;
  initials: string;
  tint: string;
  role: "Admin" | "Member";
  task?: string;
};

const PEOPLE: Person[] = [
  { name: "You", initials: "YO", tint: "#7C8CFF", role: "Admin" },
  { name: "Ravi Kumar", initials: "RK", tint: "#FF8A73", role: "Member", task: "Fix invoice export" },
  { name: "Sneha N.", initials: "SN", tint: "#5EE6B8", role: "Member", task: "Review vendor contracts" },
  { name: "Vamsi", initials: "VA", tint: "#F2C94C", role: "Member", task: "Ship weekly report" },
];

const TeamRoster = () => {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setShown(PEOPLE.length + 1);
      return;
    }

    const timer = window.setInterval(() => {
      setShown((s) => (s >= PEOPLE.length + 1 ? 0 : s + 1));
    }, 1500);

    return () => window.clearInterval(timer);
  }, []);

  const count = Math.min(shown, PEOPLE.length);
  const percent = Math.round((count / PEOPLE.length) * 100);

  return (
    <div className="w-full max-w-[460px]">
      <div className="mb-3 flex items-center justify-between text-sm text-indigo-100/70">
        <span>Your workspace</span>
        <span className="tabular-nums text-white">
          {count} {count === 1 ? "person" : "people"}
        </span>
      </div>
      <div className="mb-[clamp(0.75rem,3vh,1.5rem)] h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#7C8CFF] to-[#5EE6B8]"
          style={{ width: `${percent}%`, transition: "width 900ms cubic-bezier(.22,1,.36,1)" }}
        />
      </div>

      <div className="flex flex-col gap-2.5">
        {PEOPLE.map((p, i) => {
          const visible = i < shown;
          const latest = i === shown - 1;
          const assigned = Boolean(p.task) && shown > i + 1;

          return (
            <div
              key={p.name}
              className={`flex h-[62px] items-center gap-3 rounded-2xl border px-4 ${
                latest
                  ? "border-[#7C8CFF] bg-[#1B2360] shadow-[0_0_0_3px_rgba(124,140,255,0.22)]"
                  : "border-white/10 bg-[#171E55]"
              }`}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(14px)",
                transition: "opacity 500ms ease, transform 600ms cubic-bezier(.22,1,.36,1), all 400ms ease",
              }}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-[#0F1535]"
                style={{ background: p.tint }}
              >
                {p.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-white">{p.name}</p>
                <p
                  className="truncate text-[12px] text-indigo-100/60"
                  style={{ opacity: p.task ? (assigned ? 1 : 0.35) : 1, transition: "opacity 400ms ease" }}
                >
                  {p.task ? (assigned ? `Assigned: ${p.task}` : "Waiting for a task") : "Owns the workspace"}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  p.role === "Admin" ? "bg-[#7C8CFF]/25 text-[#C9D0FF]" : "bg-white/10 text-indigo-100/80"
                }`}
              >
                {p.role}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Small inline icons                                                 */
/* ------------------------------------------------------------------ */

const iconProps = {
  viewBox: "0 0 24 24",
  className: "h-5 w-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const UserIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M4.5 20c.8-3.6 3.7-5.5 7.5-5.5s6.7 1.9 7.5 5.5" />
  </svg>
);

const MailIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 7.5 8 5.5 8-5.5" />
  </svg>
);

const LockIcon = () => (
  <svg {...iconProps}>
    <rect x="4" y="10.5" width="16" height="10" rx="3" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);

const EyeIcon = ({ off }: { off: boolean }) => (
  <svg {...iconProps}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path className="rg-check" d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

const Logo = ({ dark = false }: { dark?: boolean }) => (
  <div className="flex items-center gap-3">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C8CFF] to-[#4B5BFF] shadow-lg shadow-indigo-900/30">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 6h10M4 12h16M4 18h7" />
      </svg>
    </span>
    <span className={`rg-display text-xl font-bold ${dark ? "text-[#0F1535]" : "text-white"}`}>FlowTasks</span>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Password strength                                                  */
/* ------------------------------------------------------------------ */

const STRENGTH_LABELS = ["Too short", "Weak", "Okay", "Good", "Strong"];
const STRENGTH_COLORS = ["#D4533F", "#F2A03D", "#E5B93C", "#3FBF96", "#22A67E"];

const scorePassword = (value: string) => {
  let score = 0;
  if (value.length >= 6) score += 1;
  if (value.length >= 10) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
  return score;
};

/* ------------------------------------------------------------------ */
/*  Register page                                                      */
/* ------------------------------------------------------------------ */

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentRole = getStoredRole();

  const isCreateUserMode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("mode") === "create-user";
  }, [location.search]);

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [role, setRole] = useState<Role>("USER");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const redirectTimer = useRef<number | null>(null);

  useEffect(() => {
    if (isCreateUserMode) {
      if (!isAdminRole()) navigate("/login", { replace: true });
      return;
    }

    if (localStorage.getItem("token")) {
      navigate("/dashboard", { replace: true });
      return;
    }

    getSetupStatus().then((needsSetup) => {
      if (!needsSetup) {
        toast.error("Sign up is closed. Ask your admin for an account.");
        navigate("/login", { replace: true });
      }
    });
  }, [isCreateUserMode, navigate]);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) window.clearTimeout(redirectTimer.current);
    };
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const triggerShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 500);
  };

  const fail = (message: string) => {
    toast.error(message);
    triggerShake();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || done) return;

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      return fail("All fields are required");
    }
    if (form.name.trim().length < 3) {
      return fail("Name must be at least 3 characters");
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      return fail("Enter a valid email");
    }
    if (form.password.length < 6 || form.password.length > 24) {
      return fail("Password must be between 6 and 24 characters");
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };

    try {
      setLoading(true);

      if (isCreateUserMode) {
        const response = await createManagedUser({ ...payload, role });
        toast.success(response?.message || "User created successfully");
      } else {
        const response = await registerUser(payload);
        toast.success(response?.message || "Admin account created successfully");
      }

      setDone(true);
      redirectTimer.current = window.setTimeout(() => {
        navigate(isCreateUserMode ? "/dashboard" : "/login");
      }, 900);
    } catch (err) {
      fail((err as Error).message || "Could not create the account");
    } finally {
      setLoading(false);
    }
  };

  const strength = scorePassword(form.password);
  const filled = form.password.length > 0 ? Math.max(strength, 1) : 0;

  const roleOptions: Array<{ value: Role; title: string; hint: string }> = [
    { value: "USER", title: "Member", hint: "Gets assigned tasks" },
    { value: "ADMIN", title: "Admin", hint: "Manages everyone" },
  ];

  return (
    <div className="rg-root relative min-h-[100dvh] overflow-x-hidden bg-[#F4F5FB] lg:grid lg:h-[100dvh] lg:grid-cols-2 lg:overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=DM+Sans:wght@400;500;600&display=swap');

        .rg-root { font-family: 'DM Sans', system-ui, sans-serif; }
        .rg-display { font-family: 'Bricolage Grotesque', 'DM Sans', system-ui, sans-serif; letter-spacing: -0.02em; }

        @keyframes rg-drift-a { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(60px,40px) scale(1.15); } }
        @keyframes rg-drift-b { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,-60px) scale(1.2); } }
        @keyframes rg-grid-pan { from { background-position: 0 0; } to { background-position: 48px 48px; } }
        @keyframes rg-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rg-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-10px); } 40% { transform: translateX(9px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(4px); } }
        @keyframes rg-spin { to { transform: rotate(360deg); } }
        @keyframes rg-shine { from { transform: translateX(-120%) skewX(-20deg); } to { transform: translateX(260%) skewX(-20deg); } }
        @keyframes rg-draw { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }

        .rg-orb-a { animation: rg-drift-a 14s ease-in-out infinite; }
        .rg-orb-b { animation: rg-drift-b 18s ease-in-out infinite; }
        .rg-grid { animation: rg-grid-pan 6s linear infinite; }
        .rg-form-in { animation: rg-rise 700ms cubic-bezier(.22,1,.36,1) both; }
        .rg-shake { animation: rg-shake 450ms ease; }
        .rg-spinner { animation: rg-spin 700ms linear infinite; }
        .rg-check { stroke-dasharray: 24; animation: rg-draw 450ms ease forwards; }
        .rg-role-pill { transition: transform 350ms cubic-bezier(.65,0,.25,1); }

        .rg-btn:hover:not(:disabled) .rg-shine { animation: rg-shine 900ms ease; }

        .rg-field:focus-within { border-color: #3B47D6; box-shadow: 0 0 0 4px rgba(59,71,214,0.12); }
        .rg-field:focus-within .rg-field-icon { color: #3B47D6; }

        @media (max-height: 700px) { .rg-sub, .rg-foot { display: none; } }

        @media (prefers-reduced-motion: reduce) {
          .rg-orb-a, .rg-orb-b, .rg-grid, .rg-form-in, .rg-shake { animation: none !important; }
          .rg-check { animation: none; stroke-dashoffset: 0; }
          .rg-role-pill { transition: none; }
        }
      `}</style>

      {/* ------------------------- Left: brand + live roster (desktop only) ------------------------- */}
      <section className="relative hidden overflow-hidden bg-[#0F1535] px-10 py-[clamp(1.5rem,5vh,3.5rem)] text-white lg:flex lg:h-[100dvh] lg:flex-col lg:justify-between xl:px-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="rg-orb-a absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#4B5BFF]/40 blur-[110px]" />
          <div className="rg-orb-b absolute -bottom-32 right-0 h-[460px] w-[460px] rounded-full bg-[#FF7A66]/25 blur-[120px]" />
          <div
            className="rg-grid absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse at 40% 45%, black 20%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at 40% 45%, black 20%, transparent 75%)",
            }}
          />
        </div>

        <div className="relative">
          <Logo />
        </div>

        <div className="relative">
          <h1 className="rg-display mb-[clamp(0.5rem,1.6vh,1rem)] max-w-xl text-[clamp(1.75rem,min(4.4vh,3.2vw),2.9rem)] font-bold leading-[1.1]">
            {isCreateUserMode ? "Add a teammate, then hand them work." : "Set up your workspace in a minute."}
          </h1>
          <p className="rg-sub mb-[clamp(1rem,4vh,2.5rem)] max-w-md text-base leading-7 text-indigo-100/75">
            {isCreateUserMode
              ? `Signed in as ${currentRole ?? "ADMIN"}. They sign in with the same login page as everyone else.`
              : "Start with the admin account. Add your team and assign tasks right after you sign in."}
          </p>
          <TeamRoster />
        </div>

        <p className="rg-foot relative text-sm text-indigo-100/50">
          Role-based access for admins and team members.
        </p>
      </section>

      {/* ------------------------- Right: form ------------------------- */}
      <section className="relative flex min-h-[100dvh] items-center justify-center px-5 py-6 sm:px-8 lg:h-[100dvh] lg:min-h-0 lg:overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <div className="rg-orb-a absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#4B5BFF]/20 blur-[80px]" />
          <div className="rg-orb-b absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#FF7A66]/20 blur-[80px]" />
        </div>

        <div className="rg-form-in relative w-full max-w-[420px]">
          <div className="mb-[clamp(1.25rem,4vh,2rem)] lg:hidden">
            <Logo dark />
          </div>

          <h2 className="rg-display mb-1.5 text-[clamp(1.6rem,4vh,2rem)] font-bold leading-tight text-[#0F1535]">
            {isCreateUserMode ? "Add a new user" : "Create the admin account"}
          </h2>
          <p className="mb-[clamp(1rem,3vh,1.75rem)] text-[15px] text-slate-500">
            {isCreateUserMode
              ? "They will sign in with the email and password you set here."
              : "You will own the workspace and can add your team later."}
          </p>

          <form
            onSubmit={handleSubmit}
            noValidate
            className={`flex flex-col gap-[clamp(0.7rem,2vh,1.1rem)] ${shake ? "rg-shake" : ""}`}
          >
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <div className="rg-field flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 transition">
                <span className="rg-field-icon text-slate-400 transition">
                  <UserIcon />
                </span>
                <input
                  id="name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full bg-transparent py-[clamp(0.6rem,1.6vh,0.85rem)] text-[15px] text-[#0F1535] outline-none placeholder:text-slate-400"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="rg-field flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 transition">
                <span className="rg-field-icon text-slate-400 transition">
                  <MailIcon />
                </span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-transparent py-[clamp(0.6rem,1.6vh,0.85rem)] text-[15px] text-[#0F1535] outline-none placeholder:text-slate-400"
                  placeholder="user@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="rg-field flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 transition">
                <span className="rg-field-icon text-slate-400 transition">
                  <LockIcon />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  maxLength={24}
                  value={form.password}
                  onChange={handleChange}
                  onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  onBlur={() => setCapsLock(false)}
                  className="w-full bg-transparent py-[clamp(0.6rem,1.6vh,0.85rem)] text-[15px] text-[#0F1535] outline-none placeholder:text-slate-400"
                  placeholder="6 to 24 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="rounded-md p-1 text-slate-400 transition hover:text-[#3B47D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B47D6]"
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>

              <div className="mt-2 flex items-center gap-2" aria-live="polite">
                <div className="flex flex-1 gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 flex-1 rounded-full bg-slate-200"
                      style={{
                        background: i < filled ? STRENGTH_COLORS[Math.max(strength, 0)] : undefined,
                        transition: "background 300ms ease",
                      }}
                    />
                  ))}
                </div>
                <span className="w-16 text-right text-[12px] text-slate-500">
                  {form.password ? STRENGTH_LABELS[strength] : ""}
                </span>
              </div>
              {capsLock && <p className="mt-1.5 text-[13px] text-[#D4533F]">Caps Lock is on.</p>}
            </div>

            {isCreateUserMode && (
              <div>
                <span id="role-label" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Role
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="role-label"
                  className="relative grid grid-cols-2 gap-1 rounded-xl border border-slate-300 bg-white p-1"
                >
                  <span
                    className="rg-role-pill pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.375rem)] rounded-lg bg-[#3B47D6] shadow-md shadow-indigo-500/25"
                    style={{ transform: role === "ADMIN" ? "translateX(calc(100% + 0.25rem))" : "translateX(0)" }}
                  />
                  {roleOptions.map((opt) => {
                    const active = role === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setRole(opt.value)}
                        className={`relative z-10 rounded-lg px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B47D6] ${
                          active ? "text-white" : "text-[#0F1535]"
                        }`}
                      >
                        <span className="block text-sm font-semibold">{opt.title}</span>
                        <span className={`block text-[12px] ${active ? "text-indigo-100" : "text-slate-500"}`}>
                          {opt.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-1 flex gap-3">
              <button
                type="button"
                onClick={() => navigate(isCreateUserMode ? "/dashboard" : "/login")}
                className="w-[34%] rounded-xl border border-slate-300 bg-white py-[clamp(0.65rem,1.8vh,0.95rem)] text-[15px] font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || done}
                className={`rg-btn relative flex-1 overflow-hidden rounded-xl py-[clamp(0.65rem,1.8vh,0.95rem)] text-[15px] font-semibold text-white shadow-lg transition focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:cursor-not-allowed ${
                  done
                    ? "bg-[#22A67E] shadow-emerald-500/25"
                    : "bg-[#3B47D6] shadow-indigo-500/25 hover:bg-[#2F3AC2] disabled:opacity-70"
                }`}
              >
                <span
                  className="rg-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/25"
                  style={{ transform: "translateX(-120%) skewX(-20deg)" }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  {loading && (
                    <span className="rg-spinner h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {done && <CheckIcon />}
                  {done
                    ? isCreateUserMode
                      ? "User created"
                      : "Admin created"
                    : loading
                      ? "Saving"
                      : isCreateUserMode
                        ? "Create user"
                        : "Create admin"}
                </span>
              </button>
            </div>
          </form>

          {!isCreateUserMode && (
            <p className="mt-[clamp(1rem,3vh,1.75rem)] text-center text-[13px] text-slate-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-semibold text-[#3B47D6] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B47D6]"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Register;