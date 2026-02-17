import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createTask } from "../api/api";

const CreateTask = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [feedbackDate, setFeedbackDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !feedbackDate) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);

      await createTask({
        title,
        description,
        feedback_date: feedbackDate,
      });

      toast.success("Task created successfully");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Top Bar (Same as Dashboard) */}
      <div className="flex justify-between items-center px-6 py-3 bg-white shadow-sm">
        <h1 className="text-xl font-bold">FlowTasks</h1>

        <button
          onClick={() => navigate("/dashboard")}
          className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
        >
          Back
        </button>
      </div>

      <div className="p-8 flex justify-center">

        <div className="w-full max-w-2xl bg-white rounded-2xl shadow p-8">

          <h2 className="text-lg font-semibold mb-6">Create New Task</h2>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                placeholder="Enter task title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                placeholder="Enter task description"
              />
            </div>

            {/* Feedback Date */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Feedback Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={feedbackDate}
                onChange={(e) => setFeedbackDate(e.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 pt-4">

              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="border border-gray-300 px-5 py-2 rounded-lg text-sm hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white px-5 py-2 rounded-lg text-sm hover:bg-gray-800 transition disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Task"}
              </button>

            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default CreateTask;
