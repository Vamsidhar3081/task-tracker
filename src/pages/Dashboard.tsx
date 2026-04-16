import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  clearAuthSession,
  completeTask,
  createTask,
  delayTask,
  deleteManagedUser,
  deleteTask,
  getStoredRole,
  getStoredUserId,
  getTasks,
  getUsers,
  isAdminRole,
  updateTask,
} from "../api/api";
import type { TaskItem, UserSummary } from "../api/api";

interface MetaState {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const initialMeta: MetaState = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
};


const Dashboard = () => {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
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
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showDelay, setShowDelay] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [delayDate, setDelayDate] = useState("");
  const [delayTaskId, setDelayTaskId] = useState<number | null>(null);
  const [delaying, setDelaying] = useState(false);
  const [menuDir, setMenuDir] = useState<"up" | "down">("down");
  const userOptions = useMemo(
    () => users.map((user) => ({ value: user.id, label: `${user.name} (${user.email})` })),
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
    if (!isAdmin) {
      setUsers([]);
      return;
    }

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

  const fetchTasks = useCallback(
    async (targetPage = page) => {
      try {
        setLoading(true);
        const data = await getTasks({
          page: targetPage,
          limit: 10,
          search,
          status,
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
    },
    [assignedFilter, isAdmin, page, search, showOverdue, status]
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    resetTaskForm();
  }, [resetTaskForm]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuthSession();
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

    if (title.trim().length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }

    if (description.trim().length < 3) {
      toast.error("Description must be at least 3 characters");
      return;
    }

    if (!feedbackDate) {
      toast.error("Feedback date is required");
      return;
    }

    if (isAdmin && assignedTo === "") {
      toast.error("Please assign this task to a user");
      return;
    }

    try {
      setCreating(true);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        feedback_date: feedbackDate,
        status: taskStatus,
        ...(assignedTo !== "" ? { assignedTo: Number(assignedTo) } : {}),
      };

      if (editingTask) {
        await updateTask(editingTask.id, payload);
        toast.success("Task updated successfully");
      } else {
        await createTask(payload);
        toast.success("Task created successfully");
      }

      resetTaskForm();
      setShowCreate(false);
      setPage(1);
      await fetchTasks(1);
      if (isAdmin) {
        await fetchUsers();
      }
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
      if (isAdmin) {
        await fetchUsers();
      }
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong");
    }
  };

  const handleDelayTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!delayTaskId || !delayReason.trim() || !delayDate) {
      toast.error("Reason and new date are required");
      return;
    }

    try {
      setDelaying(true);
      await delayTask(delayTaskId, {
        reason: delayReason.trim(),
        newDate: delayDate,
      });
      toast.success("Task delayed successfully");
      closeDelayModal();
      await fetchTasks();
      if (isAdmin) {
        await fetchUsers();
      }
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong");
    } finally {
      setDelaying(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      toast.success("Task deleted successfully");
      await fetchTasks();
      if (isAdmin) {
        await fetchUsers();
      }
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong");
    }
  };

  const completedTasks = tasks.filter((task) => task.status === "COMPLETED").length;
  const delayedTasks = tasks.filter((task) => task.status === "DELAYED").length;
  const overdueTasks = tasks.filter((task) => task.is_overdue === 1).length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(199,210,254,0.6),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(147,197,253,0.5),transparent_40%),radial-gradient(circle_at_50%_100%,rgba(224,231,255,0.6),transparent_50%)] bg-[length:200%_200%] animate-gradientMove">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-1">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Signed in as {role}.{" "}</p>
            <h1 className="text-2xl font-semibold text-slate-950 md:text-3xl">
              {isAdmin ? "Admin Task Workspace" : "My Tasks"}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => navigate("/register?mode=create-user")}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Create User
              </button>
            )}

            {isAdmin && (<button
              onClick={() => navigate("/admin")}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Admin Panel
            </button>)}

            <button
              onClick={() => {
                resetTaskForm();
                setShowCreate(true);
              }}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800"
            >
              + Create Task
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-3">
        <section className="mb-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between"> {/* LEFT CONTENT */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Total Tasks
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {isAdmin ? "All users" : "Your tasks"}
                </p>
              </div>
              <p className="text-2xl font-semibold text-slate-950">{/* RIGHT NUMBER */}
                {meta.total}
              </p>
            </div>
          </article>

          {/* COMPLETED */}
          <article className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Completed
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Tasks successfully completed
                </p>
              </div>
              <p className="text-2xl font-semibold text-emerald-600">
                {completedTasks}
              </p>

            </div>
          </article>
          {/* DELAYED */}
          <article className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Delayed
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Revised feedback dates
                </p>
              </div>
              <p className="text-2xl font-semibold text-amber-600">
                {delayedTasks}
              </p>
            </div>
          </article>
          {/* OVERDUE */}
          <article className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Overdue
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Needs attention
                </p>
              </div>
              <p className="text-2xl font-semibold text-rose-600">
                {overdueTasks}
              </p>
            </div>
          </article>
        </section>
        <section className="mb-2 grid gap-1.5 rounded-lg border border-white/70 bg-white/85 p-2 shadow-sm backdrop-blur lg:grid-cols-[1.4fr_180px_160px_180px]">
          <input
            type="text"
            placeholder="Search tasks by title, description, or assignee"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-slate-3 00 bg-white px-3 py-1.5 text-xs outline-none transition focus:border-slate-950"
          />
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none transition focus:border-slate-950"
          >
            <option value="">All Status</option>
            <option value="ONGOING">Ongoing</option>
            <option value="DELAYED">Delayed</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {isAdmin && (
            <select
              value={assignedFilter}
              onChange={(e) => {
                setPage(1);
                setAssignedFilter(e.target.value ? Number(e.target.value) : "");
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs outline-none transition focus:border-slate-950"
            >
              <option value="">All Users</option>
              {userOptions.map((user) => (
                <option key={user.value} value={user.value}>
                  {user.label}
                </option>
              ))}
            </select>
          )
            //  : 
            // (
            //   <div className="rounded-lg border border-dashed border-slate-300 px-2 py-1.5 text-xs text-slate-500">
            //     Personal tasks only
            //   </div>
            // )
          }

          <button
            onClick={() => {
              setPage(1);
              setShowOverdue((prev) => !prev);
            }}
            className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${showOverdue
              ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
              : "border border-slate-300 bg-white text-slate-700"
              }`}
          >
            {showOverdue ? "Overdue Only On" : "Show Overdue"}
          </button>
        </section>

        <section className="overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
          <div className="min-h-[330px] max-h-[330px] overflow-y-auto">
            <table className="min-w-full text-left ">
              <thead className="bg-slate-200 h-10 sticky top-0 z-20 border-b border-slate-300">
                <tr className="text-xs text-slate-600 ">
                  <th className="px-3 py-2 font-semibold">Title</th>
                  <th className="px-3 py-2 font-semibold">Description</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Feedback</th>
                  {/* <th className="px-3 py-2 font-semibold">Quick Update</th> */}
                  {isAdmin && <th className="px-3 py-2 font-semibold">Assigned To</th>}
                  <th className="px-3 py-2 font-semibold">Created</th>
                  <th className="px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 8 : 7}
                      className="px-3 py-2 text-center text-xs text-slate-500"
                    >
                      Loading tasks...
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 8 : 7}
                      className="px-3 py-2 text-center text-xs text-slate-500"
                    >
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className="border-t border-slate-100 align-middle even:bg-slate-50 hover:bg-slate-100 transition">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {task.is_overdue === 1 && (
                            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                          )}
                          <Link
                            to={`/tasks/${task.id}`}
                            className="font-medium text-indigo-600 transition hover:text-indigo-800 hover:underline"
                          >
                            {task.title}
                          </Link>
                        </div>
                      </td>

                      <td className="max-w-[200px] px-3 py-2 text-xs text-slate-600 truncate">{task.description}</td>

                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${task.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : task.status === "DELAYED"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-blue-100 text-blue-700"
                            }`}
                        >
                          {task.status}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-sm text-slate-500">
                        {task.feedback_date ? new Date(task.feedback_date).toLocaleDateString() : "-"}
                      </td>

                      {isAdmin && (
                        <td className="px-3 py-2 text-sm text-slate-600">
                          {task.assignee_name || "Unassigned"}
                        </td>
                      )}

                      <td className="px-3 py-2 text-sm text-slate-500">
                        {new Date(task.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-3 py-2">
                        <div className="relative" ref={openMenuId === task.id ? menuRef : null}>

                          <button
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuDir(window.innerHeight - rect.bottom < 160 ? "up" : "down");
                              setOpenMenuId((prev) => (prev === task.id ? null : task.id));
                            }}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-50"
                          >
                            Actions
                          </button>
                          {openMenuId === task.id && (
                            <div className={`absolute right-0 z-50 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg
    ${menuDir === "up" ? "bottom-full mb-1" : "top-full mt-1"}`}
                            >
                              {task.status !== "COMPLETED" && (
                                <button
                                  onClick={() => {
                                    handleCompleteTask(task.id);
                                    setOpenMenuId(null);
                                  }}
                                  className="block w-full rounded-lg px-2 py-1 text-left text-xs text-emerald-700 transition hover:bg-slate-50"
                                >
                                  Mark Complete
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  openEditDrawer(task);
                                  setOpenMenuId(null);
                                }}
                                className="block w-full rounded-lg px-2 py-1 text-left text-xs text-slate-700 transition hover:bg-slate-50"
                              >
                                Edit Task
                              </button>

                              <button
                                onClick={() => {
                                  if (task.status === "COMPLETED") {
                                    toast.error("Cannot delay a completed task");
                                    return;
                                  }
                                  setDelayTaskId(task.id);
                                  setShowDelay(true);
                                  setOpenMenuId(null);
                                }}
                                className="block w-full rounded-lg px-2 py-1 text-left text-xs text-amber-700 transition hover:bg-slate-50"
                              >
                                Delay Task
                              </button>

                              <button
                                onClick={() => {
                                  handleDeleteTask(task.id);
                                  setOpenMenuId(null);
                                }}
                                className="block w-full rounded-lg px-2 py-1 text-left text-xs text-rose-600 transition hover:bg-slate-50"
                              >
                                Delete Task
                              </button>
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

          <div className="flex flex-wrap items-center  ttext-xs justify-between gap-3 border-t border-slate-100 px-3 py-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              className="rounded-xl border border-slate-300 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-xs text-slate-500">
              Page {meta.page} of {meta.totalPages}
            </span>

            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-xl border border-slate-300 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </section>
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex bg-black/20 backdrop-blur-[2px]">
          <div
            className="flex-1"
            onClick={() => {
              setShowCreate(false);
              resetTaskForm();
            }}
          />

          <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-8 shadow-2xl">
            <h2 className="mb-2 text-2xl font-semibold text-slate-950">
              {editingTask ? "Update Task" : "Create New Task"}
            </h2>
            <p className="mb-6 text-sm text-slate-500">
              {isAdmin
                ? "Create and assign tasks, or update status and ownership from the same form."
                : "Manage your task details, feedback date, and completion status."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-950"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Feedback Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={feedbackDate}
                    onChange={(e) => setFeedbackDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-950"
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
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-950"
                  >
                    <option value="">Select a user</option>
                    {userOptions.map((user) => (
                      <option key={user.value} value={user.value}>
                        {user.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    resetTaskForm();
                  }}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating
                    ? editingTask
                      ? "Updating..."
                      : "Creating..."
                    : editingTask
                      ? "Update Task"
                      : "Create Task"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {showDelay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-5 text-xl font-semibold text-slate-950">Delay Task</h2>

            <form onSubmit={handleDelayTask} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Reason</label>
                <textarea
                  rows={4}
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">New Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={delayDate}
                  onChange={(e) => setDelayDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-950"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeDelayModal}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={delaying}
                  className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {delaying ? "Saving..." : "Delay Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
};

export default Dashboard;
