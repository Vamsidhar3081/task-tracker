import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getTasks, createTask, updateTask, deleteTask, delayTask, completeTask } from "../api/api";

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  is_overdue: number;
  feedback_date: string;
}

const Dashboard = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [showOverdue, setShowOverdue] = useState(false);

  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Drawer state
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [feedbackDate, setFeedbackDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  // for delay
  const [showDelay, setShowDelay] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [delayDate, setDelayDate] = useState("");
  const [delayTaskId, setDelayTaskId] = useState<number | null>(null);
  const [delaying, setDelaying] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const resetForm = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setFeedbackDate("");
  };

  // Protect route
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [page, search, status, showOverdue]);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const data = await getTasks({
        page,
        limit: 10,
        search,
        status,
        filter: showOverdue ? "overdue" : "",
      });

      setTasks(data.task);
      setMeta(data.meta);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error("Title and Description are required");
      return;
    }

    // Only require date in CREATE mode
    if (!editingTask && !feedbackDate) {
      toast.error("Feedback date is required");
      return;
    }

    try {
      setCreating(true);

      if (editingTask) {
        await updateTask(editingTask.id, {
          title: title.trim(),
          description: description.trim(),
        });

        toast.success("Task updated successfully");
      } else {
        await createTask({
          title: title.trim(),
          description: description.trim(),
          feedback_date: feedbackDate,
        });

        toast.success("Task created successfully");
      }
      resetForm();
      setShowCreate(false);

      fetchTasks();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      await completeTask(taskId);
      toast.success("Task completed");
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelayTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!delayReason || !delayDate || !delayReason.trim()) {
      return toast.error("All fields are required");
    }
    try {
      setDelaying(true);
      await delayTask(delayTaskId!, {
        reason: delayReason.trim(),
        newDate: delayDate,
      });
      toast.success("Task delayed successfully");
      setDelayDate("");
      setDelayReason("");
      setDelayTaskId(null);
      setShowDelay(false);

      fetchTasks();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDelaying(false);
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      toast.success("Task deleted successfully");
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
  const timer = setTimeout(() => {
    setPage(1);
    setSearch(searchInput);
  }, 500); 

  return () => clearTimeout(timer);
}, [searchInput]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-6 py-2 bg-white shadow-sm">
        <h1 className="text-xl font-bold">FlowTasks</h1>

        <div className="flex gap-4">
          <button
            onClick={() => setShowCreate(true)}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition"
          >
            + Create Task
          </button>

          <button
            onClick={handleLogout}
            className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="p-8 pt-4 pb-0">
        {/* Controls */}
        <div className=" flex flex-wrap items-center gap-6 mb-3">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(e) => {
              // setPage(1);
              setSearchInput(e.target.value);
            }}
            className="border border-gray-300 px-4 py-2 rounded-lg w-64 text-sm outline-none"
          />

          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="border border-gray-300 px-4 py-2 rounded-lg text-sm outline-none"
          >
            <option value="">All Status</option>
            <option value="ONGOING">Ongoing</option>
            <option value="DELAYED">Delayed</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">
              Overdue Only
            </span>

            <button
              onClick={() => {
                setPage(1);
                setShowOverdue((prev) => !prev);
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition ${showOverdue ? "bg-red-500" : "bg-gray-300"
                }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow transform transition ${showOverdue ? "translate-x-6" : ""
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow overflow-visible">
          <table className="w-full table-fixed text-left">
            <thead className="bg-gray-50 border-b border-gray-200 ">
              <tr>
                <th className="px-3 py-3 w-1/4 text-sm font-semibold text-gray-600 rounded-tl-2xl">Title</th>
                <th className="px-3 py-3 w-2/4 text-sm font-semibold text-gray-600">Description</th>
                <th className="px-3 py-3 w-1/5 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-3 py-3 w-1/5 text-sm font-semibold text-gray-600">Created</th>
                <th className="px-3 py-3 w-[60px] rounded-tr-2xl"></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm">
                    Loading...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-500">
                    No tasks found
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b last:border-b-0 hover:bg-gray-50 transition"
                  >
                    {/* Title */}
                    <td className="px-3 py-2 text-sm font-medium">
                      {task.is_overdue === 1 && (
                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      )}
                      <Link
                        to={`/tasks/${task.id}`}
                        state={{ task }}
                        className="text-blue-600 hover:underline hover:text-blue-800 transition"
                      >
                        {task.title}
                      </Link>
                    </td>

                    {/* Description */}
                    <td className="px-3 py-2 text-sm text-gray-500 truncate">
                      {task.description}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2 text-sm">
                      <span
                        className={`text-xs px-2 py-1 rounded ${task.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : task.status === "DELAYED"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                          }`}
                      >
                        {task.status}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {new Date(task.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === task.id ? null : task.id);
                        }}
                        className="text-gray-600 hover:text-black text-lg px-2"
                      >
                        ⋮
                      </button>

                      {openMenuId === task.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 bottom-full mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20"
                        >
                          {task.status !== "COMPLETED" && (
                            <button
                              onClick={() => {
                                handleCompleteTask(task.id);
                                setOpenMenuId(null);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-green-600"
                            >
                              Complete
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setTitle(task.title);
                              setDescription(task.description);
                              setShowCreate(true);
                              setOpenMenuId(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => {
                              if (task.status === "COMPLETED") {
                                toast.error("Cannot delay completed task");
                                return;
                              }

                              setDelayTaskId(task.id);
                              setShowDelay(true);
                              setOpenMenuId(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-yellow-600"
                          >
                            Delay
                          </button>

                          <button
                            onClick={() => {
                              handleDeleteTask(task.id);
                              setOpenMenuId(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-500">
            Page {meta.page} of {meta.totalPages}
          </span>

          <button
            disabled={page === meta.totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* CREATE DRAWER */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-neutral-900/20 backdrop-blur-[2px]"
            onClick={() => {
              setShowCreate(false)
              resetForm()
            }
            }
          />

          <div className="w-[40%] bg-white h-full shadow-2xl p-8 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-6">
              {editingTask ? "Update Task" : "Create New Task"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg text-sm"
                />
              </div>

              {!editingTask && <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Feedback Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={feedbackDate}
                  onChange={(e) => setFeedbackDate(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg text-sm"
                />
              </div>}

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    resetForm();
                  }}

                  className="border border-gray-300 px-5 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="bg-black text-white px-5 py-2 rounded-lg text-sm disabled:opacity-60"
                >
                  {creating ? editingTask
                      ? "Updating..."
                      : "Creating..."
                    : editingTask
                      ? "Update Task"
                      : "Create Task"}

                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDelay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setShowDelay(false)}
          />

          <div className="relative bg-white w-[420px] rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold mb-4">
              Delay Task
            </h2>

            <form onSubmit={handleDelayTask} className="space-y-4">
              <div>
                <label className="block text-sm mb-2">
                  Reason
                </label>
                <textarea
                  rows={3}
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full border px-3 py-2 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">
                  New Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={delayDate}
                  onChange={(e) => setDelayDate(e.target.value)}
                  className="w-full border px-3 py-2 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDelay(false)}
                  className="border px-4 py-2 rounded-lg text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={delaying}
                  className="bg-black text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60"
                >
                  {delaying ? "Delaying..." : "Delay Task"}
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
