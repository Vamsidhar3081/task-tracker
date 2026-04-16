import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiAlertCircle } from "react-icons/fi";
import { getTaskById } from "../api/api";

interface DelayHistory {
  id: number;
  reason: string;
  old_date: string;
  new_date: string;
  created_at: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  feedback_date: string;
  delay_count: number;
  delays: DelayHistory[];
  is_overdue: number;
  completed_at?: string;
  creator_name?: string;
  assignee_name?: string;
}

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await getTaskById(Number(id));
        setTask(data as Task);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [id]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>;
  }

  if (!task) {
    return <div className="flex h-screen items-center justify-center text-red-500">Task not found</div>;
  }

  const badgeStyles = {
    COMPLETED: "bg-green-100 text-green-600",
    DELAYED: "bg-yellow-100 text-yellow-700",
    ONGOING: "bg-blue-100 text-blue-600",
  } as const;

  const badge = badgeStyles[task.status as keyof typeof badgeStyles] || "bg-gray-100 text-gray-600";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(224,231,255,0.85),_rgba(248,250,252,1)_30%,_rgba(255,255,255,1)_100%)] p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <button
          onClick={() => navigate(-1)}
          className="w-fit rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-950"
        >
          {"<- Back to tasks"}
        </button>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Task Overview</p>
                  <h1 className="text-3xl font-semibold text-gray-900">{task.title}</h1>
                  <p className="mt-4 max-w-3xl text-gray-600">
                    {task.description || "No description provided"}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {task.is_overdue === 1 && (
                    <div className="flex items-center gap-2 text-sm font-medium text-red-500">
                      <FiAlertCircle />
                      <span>Overdue</span>
                    </div>
                  )}
                  <span className={`rounded-full px-4 py-1 text-xs font-semibold ${badge}`}>{task.status}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm">
                <p className="mb-1 text-xs uppercase tracking-[0.2em] text-gray-400">Created</p>
                <p className="font-medium text-gray-900">{new Date(task.created_at).toLocaleString()}</p>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm">
                <p className="mb-1 text-xs uppercase tracking-[0.2em] text-gray-400">Last Updated</p>
                <p className="font-medium text-gray-900">{new Date(task.updated_at).toLocaleString()}</p>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm">
                <p className="mb-1 text-xs uppercase tracking-[0.2em] text-gray-400">Feedback Date</p>
                <p className="font-medium text-gray-900">{new Date(task.feedback_date).toLocaleDateString()}</p>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm">
                <p className="mb-1 text-xs uppercase tracking-[0.2em] text-gray-400">Delay Count</p>
                <p className="font-medium text-gray-900">{task.delay_count}</p>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm">
                <p className="mb-1 text-xs uppercase tracking-[0.2em] text-gray-400">Created By</p>
                <p className="font-medium text-gray-900">{task.creator_name || "-"}</p>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm">
                <p className="mb-1 text-xs uppercase tracking-[0.2em] text-gray-400">Assigned To</p>
                <p className="font-medium text-gray-900">{task.assignee_name || "-"}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/70 bg-slate-950 p-6 text-white shadow-sm">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Status Summary</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Current Status</p>
                  <p className="mt-2 text-xl font-semibold">{task.status}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Completed At</p>
                  <p className="mt-2 text-sm font-medium text-slate-100">
                    {task.completed_at ? new Date(task.completed_at).toLocaleString() : "Not completed yet"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Overdue State</p>
                  <p className="mt-2 text-sm font-medium text-slate-100">
                    {task.is_overdue === 1 ? "Requires attention" : "Within expected timeline"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur max-h-[540px] flex flex-col">

            {/* FIXED HEADER */}
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Delay History
            </h2>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto pr-2">
              {task.delays.length === 0 ? (
                <p className="text-sm text-gray-500">No delays recorded.</p>
              ) : (
                <div className="space-y-5">
                  {task.delays.map((delay) => (
                    <article
                      key={delay.id}
                      className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        {new Date(delay.created_at).toLocaleString()}
                      </p>
                      <p className="mt-2 font-medium text-gray-900">
                        {delay.reason}
                      </p>
                      <p className="mt-2 text-sm text-gray-600">
                        {new Date(delay.old_date).toLocaleDateString()} to{" "}
                        {new Date(delay.new_date).toLocaleDateString()}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
