import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { createTask } from "../api/api";
import toast from "react-hot-toast";
import {
    getUsers,
    deleteManagedUser,
    isAdminRole,
} from "../api/api";
import type { UserSummary } from "../api/api";

const formatDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

/* Counts up to the target the first time and whenever the target changes */
const useCountUp = (target: number, duration = 900) => {
    const [value, setValue] = useState(0);
    const previous = useRef(0);

    useEffect(() => {
        const from = previous.current;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reduceMotion || from === target) {
            setValue(target);
            previous.current = target;
            return;
        }

        const start = performance.now();
        let frame = 0;

        const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(Math.round(from + (target - from) * eased));
            if (t < 1) {
                frame = requestAnimationFrame(tick);
            } else {
                previous.current = target;
            }
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, duration]);

    return value;
};

const StatTile = ({ label, value, hint }: { label: string; value: number; hint: string }) => {
    const shown = useCountUp(value);
    return (
        <div className="ft-tile rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
            <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-200/80">{label}</p>
            <p className="ft-num mt-2 text-3xl font-semibold tabular-nums">{shown}</p>
            <p className="mt-1 text-xs text-indigo-100/60">{hint}</p>
        </div>
    );
};

/* ── Animations + glow (same theme as Dashboard, colors from login image) ── */
const glowStyles = `
@keyframes ft-flow { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes ft-float-a { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(80px,60px) scale(1.15); } }
@keyframes ft-float-b { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-90px,-50px) scale(1.2); } }
@keyframes ft-line { 0% { background-position: 0% 0; } 100% { background-position: 200% 0; } }
@keyframes ft-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes ft-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ft-slide { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: none; } }
@keyframes ft-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(109,92,240,.5); } 50% { box-shadow: 0 0 18px 4px rgba(109,92,240,.35); } }
@keyframes ft-num { 0%,100% { filter: drop-shadow(0 0 3px rgba(94,234,212,.5)); } 50% { filter: drop-shadow(0 0 14px rgba(94,234,212,.95)); } }
@keyframes ft-card { 0%,100% { box-shadow: 0 0 22px -8px rgba(91,108,255,.35); } 50% { box-shadow: 0 0 40px -4px rgba(94,234,212,.4); } }
@keyframes ft-card-dark { 0%,100% { box-shadow: 0 0 30px -8px rgba(91,108,255,.5); } 50% { box-shadow: 0 0 56px -4px rgba(109,92,240,.7); } }
@keyframes ft-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-10px); } 40% { transform: translateX(9px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(4px); } }
@keyframes ft-spin { to { transform: rotate(360deg); } }

.ft-bg    { background-size: 220% 220%; animation: ft-flow 18s ease-in-out infinite; }
.ft-orb-a { animation: ft-float-a 16s ease-in-out infinite; }
.ft-orb-b { animation: ft-float-b 20s ease-in-out infinite; }
.ft-line  { background-size: 200% 100%; animation: ft-line 4.5s linear infinite; }
.ft-rise  { animation: ft-rise .6s cubic-bezier(.2,.8,.2,1) backwards; }
.ft-fade  { animation: ft-fade .25s ease both; }
.ft-slide { animation: ft-slide .4s cubic-bezier(.2,.8,.2,1) both; }
.ft-num   { animation: ft-num 3s ease-in-out infinite; }
.ft-card  { animation: ft-rise .6s cubic-bezier(.2,.8,.2,1) backwards, ft-card 5s ease-in-out infinite; }
.ft-card-dark { animation: ft-rise .6s cubic-bezier(.2,.8,.2,1) backwards, ft-card-dark 5s ease-in-out infinite; }
.ft-shake { animation: ft-shake 450ms ease; }
.ft-spinner { animation: ft-spin 700ms linear infinite; }

.ft-lift { transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
.ft-lift:hover:not(:disabled) { transform: translateY(-2px); border-color: #5b6cff; box-shadow: 0 0 18px rgba(91,108,255,.45); }
.ft-lift:active:not(:disabled) { transform: scale(.97); }

.ft-danger { transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
.ft-danger:hover:not(:disabled) { transform: translateY(-2px); border-color: #f43f5e; box-shadow: 0 0 18px rgba(244,63,94,.45); }
.ft-danger:active:not(:disabled) { transform: scale(.97); }

.ft-primary { background: linear-gradient(135deg, #3b43d6, #6d5cf0); animation: ft-pulse 2.6s ease-in-out infinite; transition: transform .25s ease, filter .25s ease; }
.ft-primary:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.12); }
.ft-primary:active:not(:disabled) { transform: scale(.97); }

.ft-user { transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease, background-color .3s ease; }
.ft-user:hover { transform: translateY(-2px); border-color: rgba(91,108,255,.55); background-color: #fff; box-shadow: 0 10px 28px -12px rgba(91,108,255,.55), inset 3px 0 0 #5b6cff; }

.ft-tile { transition: transform .3s ease, box-shadow .3s ease, background-color .3s ease; }
.ft-tile:hover { transform: translateY(-3px); background-color: rgba(255,255,255,.16); box-shadow: 0 0 26px rgba(94,234,212,.3); }

.ft-focus { transition: box-shadow .25s ease, border-color .25s ease; }
.ft-focus:focus { border-color: #5b6cff; box-shadow: 0 0 0 3px rgba(91,108,255,.22), 0 0 18px rgba(91,108,255,.35); }

@media (prefers-reduced-motion: reduce) {
  .ft-bg, .ft-orb-a, .ft-orb-b, .ft-line, .ft-rise, .ft-fade, .ft-slide,
  .ft-num, .ft-card, .ft-card-dark, .ft-primary, .ft-shake { animation: none !important; }
}
`;

const AdminDashboard = () => {
    const navigate = useNavigate();
    const isAdmin = isAdminRole();
    const [taskStatus, setTaskStatus] = useState("ONGOING");
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [assignedTo, setAssignedTo] = useState<number | "">("");

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [feedbackDate, setFeedbackDate] = useState("");
    const [creating, setCreating] = useState(false);
    const [shake, setShake] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<UserSummary | null>(null);
    const [deleting, setDeleting] = useState(false);

    // 🔥 Fetch users
    const fetchUsers = async () => {
        try {
            setUsersLoading(true);
            const data = await getUsers();
            setUsers(data.users || []);
        } catch (err) {
            toast.error((err as Error).message || "Failed to fetch users");
        } finally {
            setUsersLoading(false);
        }
    };

    const resetTaskForm = () => {
        setTitle("");
        setDescription("");
        setFeedbackDate("");
        setTaskStatus("ONGOING");
        setAssignedTo("");
    };

    const closeDrawer = () => {
        setShowCreate(false);
        resetTaskForm();
    };

    const failForm = (message: string) => {
        toast.error(message);
        setShake(true);
        window.setTimeout(() => setShake(false), 500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (title.trim().length < 3) return failForm("Title must be at least 3 characters");
        if (description.trim().length < 3) return failForm("Description must be at least 3 characters");
        if (!feedbackDate) return failForm("Feedback date is required");
        if (assignedTo === "") return failForm("Please assign this task to a user");

        try {
            setCreating(true);

            await createTask({
                title: title.trim(),
                description: description.trim(),
                feedback_date: feedbackDate,
                status: taskStatus,
                assignedTo: Number(assignedTo),
            });

            toast.success("Task created");
            closeDrawer();
            await fetchUsers();
        } catch (err) {
            toast.error((err as Error).message || "Failed to create task");
        } finally {
            setCreating(false);
        }
    };

    useEffect(() => {
        if (!isAdmin) {
            navigate("/dashboard");
            return;
        }

        fetchUsers();
    }, [isAdmin, navigate]);

    useEffect(() => {
        if (!showCreate && !deleteTarget) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (deleteTarget) setDeleteTarget(null);
            else closeDrawer();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [showCreate, deleteTarget]);

    const confirmDeleteUser = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await deleteManagedUser(deleteTarget.id);
            toast.success("User deleted successfully");
            setDeleteTarget(null);
            await fetchUsers();
        } catch (err) {
            toast.error((err as Error).message || "Failed to delete user");
        } finally {
            setDeleting(false);
        }
    };

    const totals = useMemo(() => {
        const totalTasks = users.reduce((sum, u) => sum + u.total_tasks, 0);
        const ongoing = users.reduce((sum, u) => sum + u.ongoing_tasks, 0);
        const available = users.filter((u) => u.total_tasks === 0).length;
        return { totalTasks, ongoing, available };
    }, [users]);

    return (
        <div className="ft-bg relative isolate min-h-screen overflow-x-hidden bg-[linear-gradient(120deg,_#f6f7ff_0%,_#dfe6ff_48%,_#ece6ff_72%,_#f8fbff_100%)]">
            <style>{glowStyles}</style>

            {/* Glow orbs */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
                <span className="ft-orb-a absolute -top-32 -left-24 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,_#5b6cff_0%,_transparent_70%)] opacity-30 blur-3xl" />
                <span className="ft-orb-b absolute -bottom-32 -right-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_#6d5cf0_0%,_transparent_70%)] opacity-30 blur-3xl" />
            </div>

            {/* HEADER */}
            <header className="ft-fade relative border-b border-slate-200/80 bg-white/85 shadow-[0_8px_30px_-16px_rgba(91,108,255,0.55)] backdrop-blur-xl">
                <span className="ft-line pointer-events-none absolute inset-x-0 -bottom-px h-[2px] bg-[linear-gradient(90deg,transparent,#5b6cff,#5eead4,#6d5cf0,transparent)]" />
                <div className="flex w-full items-center justify-between px-6 py-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                            FlowTasks Workspace
                        </p>
                        <h1 className="text-2xl font-semibold text-slate-950">
                            Admin Dashboard
                        </h1>
                    </div>

                    <button
                        onClick={() => navigate("/dashboard")}
                        className="ft-lift rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </header>

            {/* MAIN */}
            <main className="relative w-full px-4 sm:px-6 py-6 h-[calc(100vh-73px)]">
                <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">

                    {/* USERS */}
                    <article
                        style={{ animationDelay: "100ms" }}
                        className="ft-card rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                                    Users
                                </p>
                                <h2 className="text-2xl font-semibold text-slate-950">
                                    Manage created users
                                </h2>
                            </div>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 shadow-[0_0_14px_rgba(91,108,255,0.25)]">
                                {users.length} users
                            </span>
                        </div>

                        {usersLoading && users.length === 0 ? (
                            <p className="animate-pulse text-sm text-slate-500">Loading users...</p>
                        ) : users.length === 0 ? (
                            <p className="text-sm text-slate-500">No users found.</p>
                        ) : (
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                                {users.map((user, i) => (
                                    <div
                                        key={user.id}
                                        style={{ animationDelay: `${i * 70}ms` }}
                                        className="ft-rise ft-user flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                                    >
                                        <div>
                                            <p className="font-medium text-slate-950">
                                                {user.name}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {user.email}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                {user.ongoing_tasks} ongoing of {user.total_tasks} tasks
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    resetTaskForm();
                                                    setAssignedTo(user.id);
                                                    setShowCreate(true);
                                                }}
                                                className="ft-lift rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                            >
                                                Assign Task
                                            </button>

                                            <button
                                                onClick={() => setDeleteTarget(user)}
                                                className="ft-danger rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </article>

                    {/* OVERVIEW */}
                    <article
                        style={{ animationDelay: "220ms" }}
                        className="ft-card-dark relative overflow-hidden rounded-3xl border border-white/20 bg-[linear-gradient(135deg,_#0d0f33,_#1b2360_60%,_#2a1f56)] p-6 text-white shadow-sm"
                    >
                        {/* glow orbs inside the card */}
                        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                            <span className="ft-orb-a absolute -top-24 -left-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,_#5b6cff_0%,_transparent_70%)] opacity-50 blur-3xl" />
                            <span className="ft-orb-b absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,_#5eead4_0%,_transparent_70%)] opacity-25 blur-3xl" />
                        </div>

                        <div className="relative">
                            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200/80">
                                Overview
                            </p>

                            <h2 className="mt-2 text-2xl font-semibold">
                                Admin control panel
                            </h2>

                            <p className="mt-3 max-w-lg text-sm leading-7 text-indigo-100/80">
                                Manage users and assign tasks from a dedicated admin dashboard.
                            </p>

                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <StatTile label="Team members" value={users.length} hint="Accounts you manage" />
                                <StatTile label="Total tasks" value={totals.totalTasks} hint="Across all members" />
                                <StatTile label="Ongoing" value={totals.ongoing} hint="Being worked on now" />
                                <StatTile label="Without tasks" value={totals.available} hint="Ready for new work" />
                            </div>
                        </div>
                    </article>

                </section>
            </main>

            {/* CREATE TASK DRAWER */}
            {showCreate && (
                <div className="ft-fade fixed inset-0 z-50 flex bg-[#0d0f33]/30 backdrop-blur-[2px]">
                    <div className="flex-1" onClick={closeDrawer} />

                    <aside className="ft-slide h-full w-full max-w-xl overflow-y-auto bg-white p-8 shadow-[-20px_0_60px_-20px_rgba(59,67,214,0.55)]">
                        <h2 className="mb-2 text-2xl font-semibold text-slate-950">
                            Create New Task
                        </h2>
                        <p className="mb-6 text-sm text-slate-500">
                            {isAdmin
                                ? "Create and assign tasks, or update status and ownership from the same form."
                                : "Manage your task details, feedback date, and completion status."}
                        </p>

                        <form onSubmit={handleSubmit} noValidate className={`space-y-6 ${shake ? "ft-shake" : ""}`}>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="ft-focus w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                                <textarea
                                    rows={5}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="ft-focus w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Feedback Date</label>
                                    <DatePicker
                                        selected={feedbackDate ? new Date(`${feedbackDate}T00:00:00`) : null}
                                        onChange={(date: Date | null) => setFeedbackDate(date ? formatDateValue(date) : "")}
                                        minDate={new Date()}
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="Select feedback date"
                                        popperPlacement="top-start"
                                        portalId="root"
                                        wrapperClassName="block w-full"
                                        className="ft-focus date-input w-full min-w-0 max-w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                                    <select
                                        value={taskStatus}
                                        onChange={(e) => setTaskStatus(e.target.value)}
                                        className="ft-focus w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                                    >
                                        <option value="ONGOING">Ongoing</option>
                                        <option value="DELAYED">Delayed</option>
                                        <option value="COMPLETED">Completed</option>
                                    </select>
                                </div>
                            </div>

                            {isAdmin && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Assign To</label>
                                    <select
                                        value={assignedTo}
                                        onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : "")}
                                        className="ft-focus w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                                    >
                                        <option value="">Select a user</option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeDrawer}
                                    className="ft-lift rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="ft-primary rounded-xl px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {creating ? "Creating..." : "Create Task"}
                                </button>
                            </div>
                        </form>
                    </aside>
                </div>
            )}

            {/* DELETE USER CONFIRMATION */}
            {deleteTarget && (
                <div
                    className="ft-fade fixed inset-0 z-[60] flex items-center justify-center bg-[#0d0f33]/40 px-4 backdrop-blur-[2px]"
                    onClick={() => !deleting && setDeleteTarget(null)}
                >
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-user-title"
                        className="ft-rise w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_20px_60px_-20px_rgba(59,67,214,0.55)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="delete-user-title" className="mb-1.5 text-xl font-semibold text-slate-950">
                            Delete {deleteTarget.name}?
                        </h2>
                        <p className="mb-6 text-sm leading-6 text-slate-500">
                            {deleteTarget.total_tasks > 0
                                ? `Their ${deleteTarget.total_tasks} ${deleteTarget.total_tasks === 1 ? "task" : "tasks"} and delay history will be deleted too. This cannot be undone.`
                                : "This account will be removed. This cannot be undone."}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                autoFocus
                                disabled={deleting}
                                onClick={() => setDeleteTarget(null)}
                                className="ft-lift rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={confirmDeleteUser}
                                className="ft-danger rounded-xl border border-rose-600 bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-70"
                            >
                                <span className="flex items-center gap-2">
                                    {deleting && (
                                        <span className="ft-spinner h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />
                                    )}
                                    {deleting ? "Deleting..." : "Delete user"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;