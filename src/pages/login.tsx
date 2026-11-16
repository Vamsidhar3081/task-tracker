import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { toast } from "react-hot-toast";
import { loginUser, persistAuthSession,getSetupStatus } from "../api/api";
import { Link } from "react-router-dom";



/* ------------------------------------------------------------------ */
/*  Live board data (the animated moment on the left panel)            */
/* ------------------------------------------------------------------ */

const COLUMNS = ["To do", "In progress", "Done"] as const;

type BoardTask = {
  id: number;
  title: string;
  initials: string;
  tint: string;
};

const TASKS: BoardTask[] = [
  { id: 0, title: "Update onboarding flow", initials: "VA", tint: "#7C8CFF" },
  { id: 1, title: "Fix invoice export", initials: "RK", tint: "#FF8A73" },
  { id: 2, title: "Review vendor contracts", initials: "SN", tint: "#5EE6B8" },
  { id: 3, title: "Ship weekly report", initials: "VA", tint: "#7C8CFF" },
  { id: 4, title: "Archive old tickets", initials: "RK", tint: "#FF8A73" },
];

// [taskId, toColumn] — played in order, then the board resets and loops.
const SCRIPT: Array<[number, number]> = [
  [0, 1],
  [1, 1],
  [0, 2],
  [2, 1],
  [1, 2],
  [3, 1],
  [2, 2],
  [4, 1],
  [3, 2],
  [4, 2],
];

const INITIAL_POSITIONS = [0, 0, 0, 0, 0];
const DEMO_ACCOUNTS = [
  { label: "Admin", email: "vamsidharreddydandu@gmail.com", password: "Dmkr@3081" },
  { label: "Member", email: "bablu@gmail.com", password: "123456" },
];

/* ------------------------------------------------------------------ */
/*  Small inline icons                                                 */
/* ------------------------------------------------------------------ */

const MailIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 7.5 8 5.5 8-5.5" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="10.5" width="16" height="10" rx="3" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);

const EyeIcon = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);

const Logo = ({ dark = false }: { dark?: boolean }) => (
  <div className="flex items-center gap-3">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C8CFF] to-[#4B5BFF] shadow-lg shadow-indigo-900/30">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 6h10M4 12h16M4 18h7" />
      </svg>
    </span>
    <span className={`ft-display text-xl font-bold ${dark ? "text-[#0F1535]" : "text-white"}`}>
      FlowTasks
    </span>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Animated task board                                                */
/* ------------------------------------------------------------------ */

const LiveBoard = () => {
  const [positions, setPositions] = useState<number[]>(INITIAL_POSITIONS);
  const [lastMoved, setLastMoved] = useState<number | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setPositions([2, 2, 1, 0, 0]);
      return;
    }

    let step = 0;
    const timer = window.setInterval(() => {
      if (step >= SCRIPT.length) {
        setPositions(INITIAL_POSITIONS);
        setLastMoved(null);
        step = 0;
        return;
      }
      const [taskId, toColumn] = SCRIPT[step];
      setPositions((prev) => prev.map((col, i) => (i === taskId ? toColumn : col)));
      setLastMoved(taskId);
      step += 1;
    }, 1900);

    return () => window.clearInterval(timer);
  }, []);

  // Row index of each card inside its current column
  const rowOf = (taskId: number) =>
    TASKS.filter((t) => positions[t.id] === positions[taskId] && t.id < taskId).length;

  const doneCount = positions.filter((c) => c === 2).length;
  const percent = Math.round((doneCount / TASKS.length) * 100);

  return (
    <div className="ft-board-shell w-full max-w-[560px]">
      {/* progress strip */}
      <div className="mb-3 flex items-center justify-between text-sm text-indigo-100/70">
        <span>Sprint progress</span>
        <span className="tabular-nums text-white">
          {doneCount} of {TASKS.length} done
        </span>
      </div>
      <div className="mb-[clamp(0.75rem,3vh,2rem)] h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#7C8CFF] to-[#5EE6B8]"
          style={{ width: `${percent}%`, transition: "width 900ms cubic-bezier(.22,1,.36,1)" }}
        />
      </div>

      {/* board */}
      <div
        className="relative"
        style={{ height: `calc(var(--ft-head) + var(--ft-card-h) * ${TASKS.length})` }}
      >
        {COLUMNS.map((name, i) => (
          <div
            key={name}
            className="absolute top-0 h-full w-1/3 px-1"
            style={{ left: `${(i * 100) / 3}%` }}
          >
            <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04]">
              <p className="px-3 pt-2.5 text-xs font-medium text-indigo-100/60">
                {name}
                <span className="ml-2 tabular-nums text-indigo-100/40">
                  {positions.filter((c) => c === i).length}
                </span>
              </p>
            </div>
          </div>
        ))}

        {TASKS.map((task) => {
          const col = positions[task.id];
          const row = rowOf(task.id);
          const done = col === 2;
          const active = lastMoved === task.id;

          return (
            <div
              key={task.id}
              className="ft-card absolute left-0 top-0 w-1/3 px-2"
              style={{
                transform: `translate(${col * 100}%, calc(var(--ft-head) + ${row} * var(--ft-card-h)))`,
              }}
            >
              <div
                className={`flex items-start gap-2 rounded-xl border px-2 py-2 text-[12px] leading-tight ${
                  active
                    ? "border-[#7C8CFF] bg-[#1B2360] shadow-[0_0_0_3px_rgba(124,140,255,0.22)]"
                    : "border-white/10 bg-[#171E55]"
                }`}
                style={{ transition: "all 500ms ease", borderLeftColor: done ? "#5EE6B8" : undefined }}
              >
                <span
                  className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-[#0F1535]"
                  style={{ background: task.tint }}
                >
                  {task.initials}
                </span>
                <p
                  className={`font-medium ${
                    done ? "text-indigo-100/50 line-through decoration-white/30" : "text-white"
                  }`}
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {task.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Login page                                                         */
/* ------------------------------------------------------------------ */

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    getSetupStatus().then(setNeedsSetup);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const triggerShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      toast.error("Email and password are required");
      triggerShake();
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
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <div className="ft-root relative min-h-[100dvh] overflow-x-hidden bg-[#F4F5FB] lg:grid lg:h-[100dvh] lg:grid-cols-2 lg:overflow-hidden">
      {/* Scoped styles: fonts + keyframes (no Tailwind config changes needed) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=DM+Sans:wght@400;500;600&display=swap');

        .ft-root { font-family: 'DM Sans', system-ui, sans-serif; }
        .ft-display { font-family: 'Bricolage Grotesque', 'DM Sans', system-ui, sans-serif; letter-spacing: -0.02em; }

        .ft-board-shell { --ft-head: 34px; --ft-card-h: clamp(54px, 8.4vh, 70px); }
        .ft-card { transition: transform 800ms cubic-bezier(.65,0,.25,1); will-change: transform; }

        @keyframes ft-drift-a { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(60px,40px) scale(1.15); } }
        @keyframes ft-drift-b { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,-60px) scale(1.2); } }
        @keyframes ft-grid-pan { from { background-position: 0 0; } to { background-position: 48px 48px; } }
        @keyframes ft-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ft-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-10px); } 40% { transform: translateX(9px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(4px); } }
        @keyframes ft-spin { to { transform: rotate(360deg); } }
        @keyframes ft-shine { from { transform: translateX(-120%) skewX(-20deg); } to { transform: translateX(260%) skewX(-20deg); } }

        .ft-orb-a { animation: ft-drift-a 14s ease-in-out infinite; }
        .ft-orb-b { animation: ft-drift-b 18s ease-in-out infinite; }
        .ft-grid { animation: ft-grid-pan 6s linear infinite; }
        .ft-form-in { animation: ft-rise 700ms cubic-bezier(.22,1,.36,1) both; }
        .ft-shake { animation: ft-shake 450ms ease; }
        .ft-spinner { animation: ft-spin 700ms linear infinite; }

        .ft-btn:hover:not(:disabled) .ft-shine { animation: ft-shine 900ms ease; }

        .ft-field:focus-within { border-color: #3B47D6; box-shadow: 0 0 0 4px rgba(59,71,214,0.12); }
        .ft-field:focus-within .ft-field-icon { color: #3B47D6; }

        /* Short desktop windows: drop secondary copy so everything fits without scrolling */
        @media (max-height: 700px) { .ft-sub, .ft-foot { display: none; } }

        @media (prefers-reduced-motion: reduce) {
          .ft-orb-a, .ft-orb-b, .ft-grid, .ft-form-in, .ft-shake { animation: none !important; }
          .ft-card { transition: none; }
        }
      `}</style>

      {/* ------------------------- Left: brand + live board (desktop only) ------------------------- */}
      <section className="relative hidden overflow-hidden bg-[#0F1535] px-10 py-[clamp(1.5rem,5vh,3.5rem)] text-white lg:flex lg:h-[100dvh] lg:flex-col lg:justify-between xl:px-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="ft-orb-a absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#4B5BFF]/40 blur-[110px]" />
          <div className="ft-orb-b absolute -bottom-32 right-0 h-[460px] w-[460px] rounded-full bg-[#FF7A66]/25 blur-[120px]" />
          <div
            className="ft-grid absolute inset-0 opacity-[0.14]"
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
          <h1 className="ft-display mb-[clamp(0.5rem,1.6vh,1rem)] max-w-xl text-[clamp(1.75rem,min(4.4vh,3.2vw),2.9rem)] font-bold leading-[1.1]">
            Know who owns what, the moment it changes.
          </h1>
          <p className="ft-sub mb-[clamp(1rem,4vh,2.5rem)] max-w-md text-base leading-7 text-indigo-100/75">
            Admins assign the work, members move it forward, and everyone sees the same board.
          </p>
          <LiveBoard />
        </div>

        <p className="ft-foot relative text-sm text-indigo-100/50">
          Role-based access for admins and team members.
        </p>
      </section>

      {/* ------------------------- Right: sign-in form ------------------------- */}
      <section className="relative flex min-h-[100dvh] items-center justify-center px-5 py-6 sm:px-8 lg:h-[100dvh] lg:min-h-0 lg:overflow-y-auto">
        {/* soft glows for mobile/tablet only */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <div className="ft-orb-a absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#4B5BFF]/20 blur-[80px]" />
          <div className="ft-orb-b absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#FF7A66]/20 blur-[80px]" />
        </div>

        <div className="ft-form-in relative w-full max-w-[420px]">
          {/* mobile brand */}
          <div className="mb-[clamp(1.25rem,4vh,2rem)] lg:hidden">
            <Logo dark />
          </div>

          <h2 className="ft-display mb-1.5 text-[clamp(1.6rem,4vh,2rem)] font-bold leading-tight text-[#0F1535]">
            Welcome back
          </h2>
          <p className="mb-[clamp(1rem,3vh,1.75rem)] text-[15px] text-slate-500">
            Sign in to see your tasks and your team’s progress.
          </p>

            <div className="mb-[clamp(1rem,3vh,1.5rem)] flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 py-3">
            <span className="mr-1 text-[13px] text-slate-500">Demo account:</span>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.label}
                type="button"
                title={acc.email}
                onClick={() => setForm({ email: acc.email, password: acc.password })}
                className="rounded-full border border-slate-200 bg-white px-4 py-1 text-[13px] font-medium text-[#0F1535] transition hover:border-[#3B47D6] hover:text-[#3B47D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B47D6]"
              >
                {acc.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className={`flex flex-col gap-[clamp(0.75rem,2.2vh,1.25rem)] ${shake ? "ft-shake" : ""}`}
          >
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="ft-field flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 transition">
                <span className="ft-field-icon text-slate-400 transition">
                  <MailIcon />
                </span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-transparent py-[clamp(0.6rem,1.7vh,0.9rem)] text-[15px] text-[#0F1535] outline-none placeholder:text-slate-400"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="ft-field flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 transition">
                <span className="ft-field-icon text-slate-400 transition">
                  <LockIcon />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  onBlur={() => setCapsLock(false)}
                  className="w-full bg-transparent py-[clamp(0.6rem,1.7vh,0.9rem)] text-[15px] text-[#0F1535] outline-none placeholder:text-slate-400"
                  placeholder="Enter your password"
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
              {capsLock && <p className="mt-1.5 text-[13px] text-[#D4533F]">Caps Lock is on.</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="ft-btn relative mt-1 w-full overflow-hidden rounded-xl bg-[#3B47D6] py-[clamp(0.65rem,1.8vh,0.95rem)] text-[15px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-[#2F3AC2] focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span
                className="ft-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/25"
                style={{ transform: "translateX(-120%) skewX(-20deg)" }}
              />
              <span className="relative flex items-center justify-center gap-2">
                {loading && (
                  <span className="ft-spinner h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />
                )}
                {loading ? "Signing in" : "Sign in"}
              </span>
            </button>
          </form>

          <p className="mt-[clamp(1rem,3vh,1.75rem)] text-center text-[13px] text-slate-500">
  {needsSetup ? (
    <>
      First time here?{" "}
      <Link to="/register" className="font-semibold text-[#3B47D6] hover:underline">
        Create the admin account
      </Link>
    </>
  ) : (
    "Accounts are created by your workspace admin."
  )}
</p>
        </div>
      </section>
    </div>
  );
};

export default Login;