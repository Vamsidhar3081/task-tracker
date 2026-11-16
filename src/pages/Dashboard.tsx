import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import {
  clearAuthSession,
  completeTask,
  createManagedUser,
  createTask,
  delayTask,
  deleteTask,
  getStoredRole,
  getStoredUserId,
  getTaskStats,
  getTasks,
  getUsers,
  isAdminRole,
  updateTask,
} from "../api/api";
import type { TaskItem, TaskStats,UserSummary } from "../api/api";
import AiAssistantModal from "../components/AiAssistantModal";

interface MetaState {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const initialMeta: MetaState = { total: 0, page: 1, limit: 10, totalPages: 1 };

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const TITLE_MAX = 60;
const DESC_MAX = 300;

const getDateValue = (value?: string) =>
  value ? new Date(`${value.slice(0, 10)}T00:00:00`) : new Date();

const getNextDate = (value?: string) => {
  const date = getDateValue(value);
  date.setDate(date.getDate() + 1);
  return date;
};

/* ── Animations + glow (kept in this file, colors from login image) ── */
const glowStyles = `
@keyframes ft-flow { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes ft-float-a { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(80px,60px) scale(1.15); } }
@keyframes ft-float-b { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-90px,-50px) scale(1.2); } }
@keyframes ft-line { 0% { background-position: 0% 0; } 100% { background-position: 200% 0; } }
@keyframes ft-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes ft-row { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }
@keyframes ft-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ft-pop { from { opacity: 0; transform: translateY(14px) scale(0.95); } to { opacity: 1; transform: none; } }
@keyframes ft-slide { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: none; } }
@keyframes ft-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(109,92,240,.5); } 50% { box-shadow: 0 0 18px 4px rgba(109,92,240,.35); } }
@keyframes ft-num { 0%,100% { filter: drop-shadow(0 0 2px currentColor); } 50% { filter: drop-shadow(0 0 9px currentColor); } }
@keyframes ft-dot { 0% { box-shadow: 0 0 0 0 rgba(244,63,94,.7); } 100% { box-shadow: 0 0 0 8px rgba(244,63,94,0); } }
@keyframes ft-card { 0%,100% { box-shadow: 0 0 22px -8px rgba(91,108,255,.35); } 50% { box-shadow: 0 0 40px -4px rgba(94,234,212,.4); } }

.ft-bg    { background-size: 220% 220%; animation: ft-flow 18s ease-in-out infinite; }
.ft-orb-a { animation: ft-float-a 16s ease-in-out infinite; }
.ft-orb-b { animation: ft-float-b 20s ease-in-out infinite; }
.ft-line  { background-size: 200% 100%; animation: ft-line 4.5s linear infinite; }
.ft-rise  { animation: ft-rise .6s cubic-bezier(.2,.8,.2,1) backwards; }
.ft-row   { animation: ft-row .45s cubic-bezier(.2,.8,.2,1) backwards; }
.ft-fade  { animation: ft-fade .25s ease both; }
.ft-pop   { animation: ft-pop .3s cubic-bezier(.2,.9,.3,1.1) both; }
.ft-slide { animation: ft-slide .4s cubic-bezier(.2,.8,.2,1) both; }
.ft-num   { animation: ft-num 3s ease-in-out infinite; }
.ft-dot   { animation: ft-dot 1.8s ease-out infinite; }
.ft-card  { animation: ft-rise .6s cubic-bezier(.2,.8,.2,1) backwards, ft-card 5s ease-in-out infinite; }

.ft-lift { transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
.ft-lift:hover:not(:disabled) { transform: translateY(-2px); border-color: #5b6cff; box-shadow: 0 0 18px rgba(91,108,255,.45); }
.ft-lift:active:not(:disabled) { transform: scale(.97); }

.ft-primary { background: linear-gradient(135deg, #3b43d6, #6d5cf0); animation: ft-pulse 2.6s ease-in-out infinite; transition: transform .25s ease, filter .25s ease; }
.ft-primary:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.12); }
.ft-primary:active:not(:disabled) { transform: scale(.97); }

.ft-stat { transition: transform .3s ease, box-shadow .3s ease; }
.ft-stat:hover { transform: translateY(-4px); box-shadow: 0 14px 34px -10px rgba(91,108,255,.55); }

.ft-focus { transition: box-shadow .25s ease, border-color .25s ease; }
.ft-focus:focus { border-color: #5b6cff; box-shadow: 0 0 0 3px rgba(91,108,255,.22), 0 0 18px rgba(91,108,255,.35); }

.ft-tr { transition: background-color .25s ease, box-shadow .25s ease; }
.ft-tr:hover { background-color: rgba(91,108,255,.08); box-shadow: inset 3px 0 0 #5b6cff; }

.ft-item { transition: background-color .2s ease, padding-left .2s ease; }
.ft-item:hover { background-color: rgba(91,108,255,.1); padding-left: 12px; }

@media (prefers-reduced-motion: reduce) {
  .ft-bg, .ft-orb-a, .ft-orb-b, .ft-line, .ft-rise, .ft-row, .ft-fade, .ft-pop, .ft-slide,
  .ft-num, .ft-dot, .ft-card, .ft-primary { animation: none !important; }
}
`;

interface FilterOption { value: string | number; label: string }

const FilterSelect = ({
  value,
  onChange,
  options,
  className = "",
  align = "left",
  size = "sm",
  placement = "bottom",
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  options: FilterOption[];
  className?: string;
  align?: "left" | "right";
  size?: "sm" | "lg";
  placement?: "top" | "bottom";
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`ft-lift flex w-full items-center justify-between gap-2 border bg-white text-slate-700 ${
  size === "lg" ? "rounded-xl px-4 py-3 text-sm" : "rounded-lg px-3 py-1.5 text-xs"
} ${
  open ? "border-[#5b6cff] shadow-[0_0_0_3px_rgba(91,108,255,0.22),0_0_18px_rgba(91,108,255,0.35)]" : "border-slate-300"
}`}
      >
        <span className="truncate">{selected?.label}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-300 ${open ? "rotate-180 text-[#5b6cff]" : ""}`}
          fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className={`ft-pop absolute z-50 max-h-60 w-max min-w-full max-w-[18rem] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_-12px_rgba(59,67,214,0.5)] ${
            placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={String(o.value)}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg text-left transition-colors duration-200 ${
  size === "lg" ? "px-3 py-2 text-sm" : "px-2.5 py-1.5 text-xs"
} ${
  active
    ? "bg-gradient-to-r from-[#3b43d6]/10 to-[#6d5cf0]/10 font-semibold text-[#3b43d6]"
    : "text-slate-700 hover:bg-[#5b6cff]/10"
}`}
              >
                <span className="truncate">{o.label}</span>
                {active && (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const role = getStoredRole()?.toUpperCase() || "";
  const currentUserId = getStoredUserId();
  const isAdmin = isAdminRole();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [showOverdue, setShowOverdue] = useState(false);
  const [meta, setMeta] = useState<MetaState>(initialMeta);
  const [assignedFilter, setAssignedFilter] = useState<number | "">("");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [feedbackDate, setFeedbackDate] = useState("");
  const [taskStatus, setTaskStatus] = useState("ONGOING");
  const [assignedTo, setAssignedTo] = useState<number | "">("");
  const [creating, setCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showDelay, setShowDelay] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [delayDate, setDelayDate] = useState("");
  const [delayTaskId, setDelayTaskId] = useState<number | null>(null);
  const [delaying, setDelaying] = useState(false);
  const [menuDir, setMenuDir] = useState<"up" | "down">("down");
  const [mobileMenuPosition, setMobileMenuPosition] = useState<{ left: number; top?: number; bottom?: number }>({ left: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });
  const [creatingUser, setCreatingUser] = useState(false);

  const minimumFeedbackDate = new Date();

  const delayingTask = delayTaskId !== null
    ? tasks.find((task) => task.id === delayTaskId)
    : undefined;
  const minimumDelayDate = delayingTask?.feedback_date
    ? getNextDate(delayingTask.feedback_date)
    : new Date();

  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` })),
    [users]
  );

  const resetTaskForm = useCallback(() => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setFeedbackDate("");
    setTaskStatus("ONGOING");
    setAssignedTo(isAdmin ? "" : currentUserId);
  }, [currentUserId, isAdmin]);

  const closeDelayModal = () => {
    setShowDelay(false);
    setDelayReason("");
    setDelayDate("");
    setDelayTaskId(null);
  };

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) { setUsers([]); return; }
    try {
      setUsersLoading(true);
      const data = await getUsers();
      setUsers(data.users);
    } catch (err) {
      toast.error((err as Error).message || "Failed to fetch users");
    } finally {
      setUsersLoading(false);
    }
  }, [isAdmin]);

  const fetchTasks = useCallback(async (targetPage = page) => {
    try {
      setLoading(true);
      const data = await getTasks({
        page: targetPage, limit: 10, search, status,
        filter: showOverdue ? "overdue" : "",
        assignedTo: isAdmin && assignedFilter !== "" ? assignedFilter : "",
      });
      setTasks(data?.task || []);
      setMeta(data?.meta || initialMeta);
    } catch (err) {
      toast.error((err as Error).message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [assignedFilter, isAdmin, page, search, showOverdue, status]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  useEffect(() => { resetTaskForm(); }, [resetTaskForm]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setPage(1); setSearch(searchInput); }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getTaskStats({
        assignedTo: isAdmin && assignedFilter !== "" ? assignedFilter : "",
      });
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch task stats", err);
    }
  }, [assignedFilter, isAdmin]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { fetchStats(); }, [fetchStats, tasks]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !mobileMenuRef.current?.contains(target)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showLogoutConfirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLogoutConfirm(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showLogoutConfirm]);

  useEffect(() => {
    if (!taskToDelete || deletingTask) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTaskToDelete(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [deletingTask, taskToDelete]);

  const closeCreateUser = () => {
    if (creatingUser) return;
    setShowCreateUser(false);
    setNewUser({ name: "", email: "", password: "" });
  };

  useEffect(() => {
    if (!showCreateUser) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !creatingUser) {
        setShowCreateUser(false);
        setNewUser({ name: "", email: "", password: "" });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showCreateUser, creatingUser]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creatingUser) return;
    const { name, email, password } = newUser;
    if (!name.trim() || !email.trim() || !password.trim()) { toast.error("All fields are required"); return; }
    if (name.trim().length < 3) { toast.error("Name must be at least 3 characters"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { toast.error("Enter a valid email"); return; }
    if (password.length < 6 || password.length > 24) { toast.error("Password must be between 6 and 24 characters"); return; }
    try {
      setCreatingUser(true);
      const response = await createManagedUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "USER",
      });
      toast.success(response?.message || "User created successfully");
      setCreatingUser(false);
      setShowCreateUser(false);
      setNewUser({ name: "", email: "", password: "" });
      await fetchUsers();
    } catch (err) {
      toast.error((err as Error).message || "Could not create the user");
    } finally {
      setCreatingUser(false);
    }
  };

  const openLogout = () => { setShowLogoutConfirm(true); setMobileMenuOpen(false); };

  const confirmLogout = () => {
    clearAuthSession();
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  const openEditDrawer = (task: TaskItem) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setFeedbackDate(task.feedback_date ? task.feedback_date.slice(0, 10) : "");
    setTaskStatus(task.status);
    setAssignedTo(task.assigned_to ?? "");
    setShowCreate(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) { toast.error("Title must be at least 3 characters"); return; }
    if (description.trim().length < 3) { toast.error("Description must be at least 3 characters"); return; }
    if (title.trim().length > TITLE_MAX) { toast.error(`Title must be at most ${TITLE_MAX} characters`); return; }
if (description.trim().length > DESC_MAX) { toast.error(`Description must be at most ${DESC_MAX} characters`); return; }
    if (!feedbackDate) { toast.error("Feedback date is required"); return; }
    if (isAdmin && assignedTo === "") { toast.error("Please assign this task to a user"); return; }
    try {
      setCreating(true);
      const payload = {
        title: title.trim(), description: description.trim(),
        feedback_date: feedbackDate, status: taskStatus,
        ...(assignedTo !== "" ? { assignedTo: Number(assignedTo) } : {}),
      };
      if (editingTask) { await updateTask(editingTask.id, payload); toast.success("Task updated successfully"); }
      else { await createTask(payload); toast.success("Task created successfully"); }
      resetTaskForm();
      setShowCreate(false);
      setPage(1);
      await fetchTasks(1);
      if (isAdmin) await fetchUsers();
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      await completeTask(taskId);
      toast.success("Task completed");
      await fetchTasks();
      if (isAdmin) await fetchUsers();
    } catch (err) { toast.error((err as Error).message || "Something went wrong"); }
  };

  const handleDelayTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delayTaskId || !delayReason.trim() || !delayDate) { toast.error("Reason and new date are required"); return; }
    try {
      setDelaying(true);
      await delayTask(delayTaskId, { reason: delayReason.trim(), newDate: delayDate });
      toast.success("Task delayed successfully");
      closeDelayModal();
      await fetchTasks();
      if (isAdmin) await fetchUsers();
    } catch (err) { toast.error((err as Error).message || "Something went wrong"); }
    finally { setDelaying(false); }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete || deletingTask) return;
    try {
      setDeletingTask(true);
      await deleteTask(taskToDelete.id);
      toast.success("Task deleted successfully");
      setTaskToDelete(null);
      await fetchTasks();
      if (isAdmin) await fetchUsers();
    } catch (err) { toast.error((err as Error).message || "Something went wrong"); }
    finally { setDeletingTask(false); }
  };

  const completedTasks = stats?.completed_tasks ?? 0;
  const delayedTasks   = stats?.delayed_tasks ?? 0;
  const overdueTasks   = stats?.overdue_tasks ?? 0;

  const statusBadge = (s: string) => {
    if (s === "COMPLETED") return "bg-emerald-100 text-emerald-700";
    if (s === "DELAYED")   return "bg-amber-100 text-amber-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    // ── Full viewport height, flex column, no page scroll ──
    <div className="ft-bg premium-dashboard relative isolate flex min-h-[100dvh] flex-col overflow-x-hidden bg-[linear-gradient(120deg,_#f6f7ff_0%,_#dfe6ff_48%,_#ece6ff_72%,_#f8fbff_100%)] sm:h-[100dvh] sm:min-h-0 sm:overflow-hidden">
      <style>{glowStyles}</style>

      <div className="dashboard-ambient" aria-hidden="true">
        <span className="dashboard-ambient-orb dashboard-ambient-orb-one" />
        <span className="dashboard-ambient-orb dashboard-ambient-orb-two" />
      </div>

      {/* Glow orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <span className="ft-orb-a absolute -top-32 -left-24 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,_#5b6cff_0%,_transparent_70%)] opacity-30 blur-3xl" />
        <span className="ft-orb-b absolute -bottom-32 -right-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_#6d5cf0_0%,_transparent_70%)] opacity-30 blur-3xl" />
      </div>

      {/* ── HEADER (fixed height) ── */}
      <header className="ft-fade relative z-30 shrink-0 border-b border-slate-200/80 bg-white/90 shadow-[0_8px_30px_-16px_rgba(91,108,255,0.55)] backdrop-blur-sm">
        <span className="ft-line pointer-events-none absolute inset-x-0 -bottom-px h-[2px] bg-[linear-gradient(90deg,transparent,#5b6cff,#5eead4,#6d5cf0,transparent)]" />
        <div className="w-full px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Title */}
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.3em] text-slate-400 leading-none">FlowTasks / {role} workspace</p>
              <h1 className="text-base sm:text-xl lg:text-2xl font-semibold text-slate-950 leading-tight truncate">
                {isAdmin ? "Admin Task Workspace" : "My Tasks"}
              </h1>
            </div>

            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
              {isAdmin && (
                <button onClick={() => setShowCreateUser(true)}
                  className="ft-lift rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap">
                  Create User
                </button>
              )}
              {isAdmin && (
                <button onClick={() => navigate("/admin")}
                  className="ft-lift rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap">
                  Admin Panel
                </button>
              )}
              <button onClick={() => { resetTaskForm(); setShowCreate(true); }}
                className="ft-primary rounded-xl px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap">
                + Create Task
              </button>
              <button onClick={openLogout} className="ft-lift rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Logout</button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="ft-lift sm:hidden p-2 rounded-lg border border-slate-300 bg-white"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="ft-rise sm:hidden flex flex-col gap-2 pb-3 pt-2 border-t border-slate-100">
              {isAdmin && (
                <button onClick={() => { setShowCreateUser(true); setMobileMenuOpen(false); }}
                  className="ft-lift w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 text-left">
                  Create User
                </button>
              )}
              {isAdmin && (
                <button onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}
                  className="ft-lift w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 text-left">
                  Admin Panel
                </button>
              )}
              <button onClick={() => { resetTaskForm(); setShowCreate(true); setMobileMenuOpen(false); }}
                className="ft-primary w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white text-left">
                + Create Task
              </button>
              <button onClick={openLogout} className="ft-lift w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 text-left">Logout</button>
            </div>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT (flex-1 = takes all remaining height) ── */}
      <main className="relative z-10 min-h-0 flex-1 overflow-visible sm:overflow-hidden">
        <div className="flex min-h-full w-full flex-col gap-2 px-3 py-3 sm:h-full sm:min-h-0 sm:px-4 lg:px-6">

          {/* ── STATS ── */}
          <div className="shrink-0 grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Total Tasks",  sub: isAdmin ? "All users" : "Your tasks",      val: meta.total,    color: "text-slate-950"   },
              { label: "Completed",    sub: "Tasks successfully completed",              val: completedTasks, color: "text-emerald-600" },
              { label: "Delayed",      sub: "Revised feedback dates",                   val: delayedTasks,  color: "text-amber-600"   },
              { label: "Overdue",      sub: "Needs attention",                          val: overdueTasks,  color: "text-rose-600"    },
            ].map(({ label, sub, val, color }, i) => (
              <article
                key={label}
                style={{ animationDelay: `${i * 90}ms` }}
                className="ft-rise ft-stat dashboard-stat-card border border-white/70 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-400 leading-tight">{label}</p>
                  <p className="mt-0.5 text-[10px] sm:text-xs text-slate-500 truncate">{sub}</p>
                </div>
                <p className={`ft-num text-2xl sm:text-3xl font-bold shrink-0 tabular-nums ${color}`}>{val}</p>
              </article>
            ))}
          </div>

          {/* ── FILTERS ── */}
          <div
            style={{ animationDelay: "320ms" }}
            className="ft-rise dashboard-filter-card relative z-20 shrink-0 border border-white/70 bg-white/85 px-3 py-2 shadow-sm backdrop-blur"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Search tasks by title, description, or assignee"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="ft-focus flex-1 min-w-0 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none"
              />
              <div className="flex w-full shrink-0 flex-wrap gap-2 sm:ml-auto sm:w-auto lg:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setShowAiAssistant(true)}
                  className="ai-assistant-gradient-button w-full rounded-lg border border-blue-400 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 bg-[length:200%_200%] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white transition hover:-translate-y-0.5 hover:border-blue-300 hover:from-blue-600 hover:via-indigo-600 hover:to-cyan-500 hover:shadow-[0_0_20px_rgba(94,234,212,0.55)] sm:w-auto"
                >
                  AI Assistant
                </button>
                <FilterSelect
  value={status}
  onChange={(v) => { setPage(1); setStatus(String(v)); }}
  options={[
    { value: "", label: "All Status" },
    { value: "ONGOING", label: "Ongoing" },
    { value: "DELAYED", label: "Delayed" },
    { value: "COMPLETED", label: "Completed" },
  ]}
  className="w-full sm:w-[130px]"
/>

                {isAdmin && (
                  usersLoading
                    ? <div className="h-[30px] w-[150px] rounded-lg border border-slate-300 bg-white animate-pulse" />
                    : (
                      <FilterSelect
  value={assignedFilter}
  onChange={(v) => { setPage(1); setAssignedFilter(v === "" ? "" : Number(v)); }}
  options={[{ value: "", label: "All Users" }, ...userOptions]}
  className="w-full sm:w-[150px]"
  align="right"
/>
                    )
                )}

                <button
                  onClick={() => { setPage(1); setShowOverdue((p) => !p); }}
                  className={`ft-lift rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition w-full sm:w-auto ${
                    showOverdue ? "bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)]" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {showOverdue ? "Overdue Only" : "Show Overdue"}
                </button>
              </div>
            </div>
          </div>

          {/* ── TABLE CARD ── */}
          <div
            style={{ animationDelay: "450ms" }}
            className="ft-card dashboard-table-card flex-1 min-h-[18rem] overflow-hidden border border-white/70 bg-white/90 shadow-sm backdrop-blur flex flex-col sm:min-h-0 max-h-full"
          >

            {/* ── MOBILE CARDS ── */}
            <div className="md:hidden flex-1 overflow-y-auto px-3 py-2">
              {loading ? (
                <p className="py-8 text-center text-xs text-slate-500 animate-pulse">Loading tasks...</p>
              ) : tasks.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">No tasks found</p>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task, i) => (
                    <div
                      key={task.id}
                      style={{ animationDelay: `${i * 60}ms` }}
                      className="ft-rise ft-stat rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {task.is_overdue === 1 && <span className="ft-dot h-2 w-2 rounded-full bg-rose-500 shrink-0" />}
                            <Link to={`/tasks/${task.id}`}
                              className="block truncate text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                              {task.title}
                            </Link>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 line-clamp-1">{task.description}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                        <div>Feedback: {task.feedback_date ? new Date(task.feedback_date).toLocaleDateString() : "-"}</div>
                        <div>Created: {new Date(task.created_at).toLocaleDateString()}</div>
                        {isAdmin && <div className="col-span-2">Assigned: {task.assignee_name || "Unassigned"}</div>}
                      </div>
                      <div className="mt-2 relative" ref={openMenuId === task.id ? menuRef : null}>
                        <button
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const direction = window.innerHeight - rect.bottom < 160 ? "up" : "down";
                            setMenuDir(direction);
                            setMobileMenuPosition({
                              left: Math.min(rect.left, window.innerWidth - 164),
                              ...(direction === "up"
                                ? { bottom: window.innerHeight - rect.top + 4 }
                                : { top: rect.bottom + 4 }),
                            });
                            setOpenMenuId((p) => (p === task.id ? null : task.id));
                          }}
                          className="ft-lift rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Actions ▾
                        </button>
                        {openMenuId === task.id && (
                          createPortal(
                            <div
                              ref={mobileMenuRef}
                              style={{ left: mobileMenuPosition.left, top: mobileMenuPosition.top, bottom: mobileMenuPosition.bottom }}
                              className="ft-pop fixed z-[100] w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_-12px_rgba(59,67,214,0.5)]"
                            >
                              {task.status !== "COMPLETED" && (
                                <button onClick={() => { handleCompleteTask(task.id); setOpenMenuId(null); }}
                                  className="ft-item block w-full rounded-lg px-2 py-1.5 text-left text-xs text-emerald-700">Mark Complete</button>
                              )}
                              <button onClick={() => { openEditDrawer(task); setOpenMenuId(null); }}
                                className="ft-item block w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-700">Edit Task</button>
                              <button onClick={() => {
                                if (task.status === "COMPLETED") { toast.error("Cannot delay a completed task"); return; }
                                setDelayTaskId(task.id); setShowDelay(true); setOpenMenuId(null);
                              }} className="ft-item block w-full rounded-lg px-2 py-1.5 text-left text-xs text-amber-700">Delay Task</button>
                              <button onClick={() => { setTaskToDelete(task); setOpenMenuId(null); }}
                                className="ft-item block w-full rounded-lg px-2 py-1.5 text-left text-xs text-rose-600">Delete Task</button>
                            </div>,
                            document.body
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── DESKTOP TABLE ── */}
            <div className="hidden md:flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-auto min-h-0">
                <table className="w-full min-w-[700px] text-left border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-100 text-xs text-slate-600">
                      <th className="px-4 py-2.5 font-semibold border-b border-slate-200 w-[20%]">Title</th>
                      <th className="px-4 py-2.5 font-semibold border-b border-slate-200 w-[20%]">Description</th>
                      <th className="px-4 py-2.5 font-semibold border-b border-slate-200 w-[11%]">Status</th>
                      <th className="px-4 py-2.5 font-semibold border-b border-slate-200 w-[11%]">Feedback</th>
                      {isAdmin && <th className="px-4 py-2.5 font-semibold border-b border-slate-200 w-[14%]">Assigned To</th>}
                      <th className="px-4 py-2.5 font-semibold border-b border-slate-200 w-[11%]">Created</th>
                      <th className="px-4 py-2.5 font-semibold border-b border-slate-200 w-[9%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center text-xs text-slate-500 animate-pulse">Loading tasks...</td></tr>
                    ) : tasks.length === 0 ? (
                      <tr><td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center text-xs text-slate-500">No tasks found</td></tr>
                    ) : (
                      tasks.map((task, i) => (
                        <tr
                          key={task.id}
                          style={{ animationDelay: `${i * 45}ms` }}
                          className="ft-row ft-tr border-b border-slate-100 align-middle even:bg-slate-50/50"
                        >
                          <td className="px-4 py-2.5 max-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              {task.is_overdue === 1 && <span className="ft-dot h-2 w-2 rounded-full bg-rose-500 shrink-0" />}
                              <Link to={`/tasks/${task.id}`}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline truncate block">
                                {task.title}
                              </Link>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-500 max-w-0">
                            <p className="truncate">{task.description}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${statusBadge(task.status)}`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                            {task.feedback_date ? new Date(task.feedback_date).toLocaleDateString() : "-"}
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-2.5 text-xs text-slate-600 max-w-0">
                              <p className="truncate">{task.assignee_name || "Unassigned"}</p>
                            </td>
                          )}
                          <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                            {new Date(task.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="relative" ref={openMenuId === task.id ? menuRef : null}>
                              <button
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setMenuDir(window.innerHeight - rect.bottom < 160 ? "up" : "down");
                                  setOpenMenuId((p) => (p === task.id ? null : task.id));
                                }}
                                className="ft-lift rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                              >
                                Actions ▾
                              </button>
                              {openMenuId === task.id && (
                                <div className={`ft-pop absolute right-0 z-50 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_40px_-12px_rgba(59,67,214,0.5)] ${menuDir === "up" ? "bottom-full mb-1" : "top-full mt-1"}`}>
                                  {task.status !== "COMPLETED" && (
                                    <button onClick={() => { handleCompleteTask(task.id); setOpenMenuId(null); }}
                                      className="ft-item block w-full rounded-lg px-2 py-1.5 text-left text-xs text-emerald-700">Mark Complete</button>
                                  )}
                                  <button onClick={() => { openEditDrawer(task); setOpenMenuId(null); }}
                                    className="ft-item block w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-700">Edit Task</button>
                                  <button onClick={() => {
                                    if (task.status === "COMPLETED") { toast.error("Cannot delay a completed task"); return; }
                                    setDelayTaskId(task.id); setShowDelay(true); setOpenMenuId(null);
                                  }} className="ft-item block w-full rounded-lg px-2 py-1.5 text-left text-xs text-amber-700">Delay Task</button>
                                  <button onClick={() => { setTaskToDelete(task); setOpenMenuId(null); }}
                                    className="ft-item block w-full rounded-lg px-2 py-1.5 text-left text-xs text-rose-600">Delete Task</button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── PAGINATION ── */}
            <div className="shrink-0 flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-2 bg-white/60">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="ft-lift rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="text-xs text-slate-500">Page {meta.page} of {meta.totalPages}</span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="ft-lift rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
          {/* end table card */}

        </div>
      </main>

      {/* ── CREATE / EDIT TASK DRAWER ── */}
      {showCreate && (
        <div className="ft-fade fixed inset-0 z-50 flex bg-[#0d0f33]/30 backdrop-blur-[2px]">
          <div className="flex-1" onClick={() => { setShowCreate(false); resetTaskForm(); }} />
          <aside className="ft-slide h-full min-w-0 w-full max-w-xl overflow-y-auto bg-white p-5 sm:p-8 shadow-[-20px_0_60px_-20px_rgba(59,67,214,0.55)]">
            <h2 className="mb-1 text-xl sm:text-2xl font-semibold text-slate-950">
              {editingTask ? "Update Task" : "Create New Task"}
            </h2>
            <p className="mb-5 text-xs sm:text-sm text-slate-500">
              {isAdmin ? "Create and assign tasks, or update status and ownership."
                       : "Manage your task details, feedback date, and completion status."}
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
  <label className="mb-1.5 block text-sm font-medium text-slate-700">Title</label>
  <input type="text" value={title} maxLength={TITLE_MAX} onChange={(e) => setTitle(e.target.value)}
    className="ft-focus w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none" />
  <p className="mt-1 text-right text-xs text-slate-400">{title.length}/{TITLE_MAX}</p>
</div>
<div>
  <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
  <textarea rows={4} value={description} maxLength={DESC_MAX} onChange={(e) => setDescription(e.target.value)}
    className="ft-focus w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none" />
  <p className="mt-1 text-right text-xs text-slate-400">{description.length}/{DESC_MAX}</p>
</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Feedback Date</label>
                  <DatePicker
                    selected={feedbackDate ? getDateValue(feedbackDate) : null}
                    onChange={(date: Date | null) => setFeedbackDate(date ? formatDateValue(date) : "")}
                    minDate={minimumFeedbackDate}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select feedback date"
                    popperPlacement="top-start"
                    portalId="root"
                    wrapperClassName="block w-full"
                    className="ft-focus date-input w-full min-w-0 max-w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                  <FilterSelect
                    value={taskStatus}
                    onChange={(value) => setTaskStatus(String(value))}
                    options={[
                      { value: "ONGOING", label: "Ongoing" },
                      { value: "DELAYED", label: "Delayed" },
                      { value: "COMPLETED", label: "Completed" },
                    ]}
                    size="lg"
                    placement="top"
                  />
                </div>
              </div>
              {isAdmin && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Assign To</label>
                  <FilterSelect
                    value={assignedTo}
                    onChange={(value) => setAssignedTo(value === "" ? "" : Number(value))}
                    options={[
                      { value: "", label: "Select a user" },
                      ...userOptions,
                    ]}
                    size="lg"
                    placement="top"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); resetTaskForm(); }}
                  className="ft-lift rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="ft-primary rounded-xl px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
                  {creating ? (editingTask ? "Updating..." : "Creating...") : (editingTask ? "Update Task" : "Create Task")}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {/* ── DELAY MODAL ── */}
      {showDelay && (
        <div className="ft-fade fixed inset-0 z-50 flex items-center justify-center bg-[#0d0f33]/30 px-4 backdrop-blur-[2px]">
          <div className="ft-pop max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 sm:max-h-none sm:p-6 shadow-[0_30px_80px_-20px_rgba(59,67,214,0.6)]">
            <h2 className="mb-4 text-lg sm:text-xl font-semibold text-slate-950">Delay Task</h2>
            <form onSubmit={handleDelayTask} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Reason</label>
                <textarea rows={4} value={delayReason} onChange={(e) => setDelayReason(e.target.value)}
                  className="ft-focus w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">New Date</label>
                <DatePicker
                  selected={delayDate ? getDateValue(delayDate) : null}
                  onChange={(date: Date | null) => setDelayDate(date ? formatDateValue(date) : "")}
                  minDate={minimumDelayDate}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select new date"
                  popperPlacement="top-start"
                  portalId="root"
                  wrapperClassName="block w-full"
                  className="ft-focus date-input w-full min-w-0 max-w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeDelayModal}
                  className="ft-lift rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={delaying}
                  className="ft-primary rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-60">
                  {delaying ? "Saving..." : "Delay Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ── */}
      {taskToDelete && (
        <div
          className="ft-fade fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[2px] sm:p-4"
          onClick={() => { if (!deletingTask) setTaskToDelete(null); }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-task-title"
            aria-describedby="delete-task-description"
            aria-busy={deletingTask}
            className="ft-pop w-full max-w-md rounded-2xl bg-white p-5 shadow-[0_30px_80px_-20px_rgba(244,63,94,0.5)] sm:rounded-3xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-task-title" className="text-lg font-semibold text-slate-950 sm:text-xl">
              Delete this task?
            </h2>
            <p id="delete-task-description" className="mt-2 break-words text-sm text-slate-600">
              “{taskToDelete.title}” will be permanently deleted. This action cannot be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                autoFocus
                disabled={deletingTask}
                onClick={() => setTaskToDelete(null)}
                className="ft-lift min-h-11 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingTask}
                onClick={handleDeleteTask}
                className="min-h-11 w-full rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-[0_0_22px_rgba(244,63,94,0.6)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {deletingTask ? "Deleting..." : "Delete task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOGOUT CONFIRM ── */}
      {showLogoutConfirm && (
  <div
    className="ft-fade fixed inset-0 z-[60] flex items-center justify-center bg-[#0F1535]/50 px-4 backdrop-blur-[2px]"
    onClick={() => setShowLogoutConfirm(false)}
  >
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="logout-title"
      className="ft-pop w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-[0_24px_60px_-20px_rgba(15,21,53,0.55)]"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C8CFF] to-[#4B5BFF] shadow-lg shadow-indigo-500/30">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H9" />
          <path d="M16 8l4 4-4 4M20 12H10" />
        </svg>
      </span>

      <h2 id="logout-title" className="mb-1.5 text-xl font-semibold text-[#0F1535]">Log out?</h2>
      <p className="mb-6 text-sm text-slate-500">You will need to sign in again to see your tasks.</p>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          autoFocus
          onClick={() => setShowLogoutConfirm(false)}
          className="rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#3B47D6] hover:text-[#3B47D6]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={confirmLogout}
          className="rounded-xl bg-[#3B47D6] py-2.5 text-sm font-semibold text-white transition hover:bg-[#2F3AC2]"
        >
          Log out
        </button>
      </div>
    </div>
  </div>
)}

      {/* ── CREATE USER DRAWER ── */}
      {showCreateUser && (
        <div className="ft-fade fixed inset-0 z-[60] flex bg-[#0d0f33]/30 backdrop-blur-[2px]">
          <div className="flex-1" onClick={closeCreateUser} />
          <aside className="ft-slide h-full min-w-0 w-full max-w-md overflow-y-auto bg-white p-5 sm:p-8 shadow-[-20px_0_60px_-20px_rgba(59,67,214,0.55)]">
            <h2 className="mb-1 text-xl sm:text-2xl font-semibold text-slate-950">Add New User</h2>
            <p className="mb-5 text-xs sm:text-sm text-slate-500">
              They will sign in with the email and password you set here.
            </p>
            <form onSubmit={handleCreateUser} className="space-y-5" noValidate>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
                <input type="text" autoFocus value={newUser.name} placeholder="John Doe"
                  onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
                  className="ft-focus w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                <input type="email" autoComplete="off" value={newUser.email} placeholder="user@example.com"
                  onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                  className="ft-focus w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                <input type="password" autoComplete="new-password" maxLength={24} value={newUser.password}
                  placeholder="6 to 24 characters"
                  onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                  className="ft-focus w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeCreateUser} disabled={creatingUser}
                  className="ft-lift rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">Cancel</button>
                <button type="submit" disabled={creatingUser}
                  className="ft-primary rounded-xl px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
                  {creatingUser ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {showAiAssistant && <AiAssistantModal onClose={() => setShowAiAssistant(false)} />}
    </div>
  );
};

export default Dashboard;