import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTaskById } from "../api/api";
import { FiAlertCircle } from "react-icons/fi";

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
                setTask(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTask();
    }, [id]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center text-gray-500">
                Loading...
            </div>
        );
    }

    if (!task) {
        return (
            <div className="h-screen flex items-center justify-center text-red-500">
                Task not found
            </div>
        );
    }


    const badgeStyles = {
        COMPLETED: "bg-green-100 text-green-600",
        DELAYED: "bg-yellow-100 text-yellow-700",
        ONGOING: "bg-blue-100 text-blue-600",
    } as const;

    const badge =
        badgeStyles[task.status as keyof typeof badgeStyles] ||
        "bg-gray-100 text-gray-600";

    return (
        <div className="h-screen bg-gray-100 p-6 overflow-hidden">
            <div className="h-full max-w-7xl mx-auto flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
                    >
                        ← Back to tasks
                    </button>

                </div>
                <div className="grid grid-cols-3 gap-6 flex-1">
                    {/* ================= LEFT SIDE ================= */}
                    <div className="col-span-2 flex flex-col gap-6 h-full">
                        {/* TITLE CARD */}
                        <div className="bg-white rounded-xl shadow-sm p-6 flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-semibold">
                                    {task.title}
                                </h1>
                            </div>

                            {/* Right side status + overdue */}
                            <div className="flex flex-col items-end gap-2">
                                {task.is_overdue === 1 && (
                                    <div className="flex items-center gap-1 text-red-500 text-xs font-medium">
                                        <div className="flex pr-3 items-center gap-1 text-red-500 text-xs font-semibold">
                                            <FiAlertCircle className="text-base" />
                                            <span>Overdue</span>
                                        </div>
                                    </div>
                                )}

                                <span className={`px-4 py-1 text-xs rounded-full ${badge}`}>
                                    {task.status}
                                </span>

                            </div>
                        </div>

                        {/* DESCRIPTION CARD */}
                        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col flex-1">

                            <h3 className="text-sm text-gray-500 mb-3">
                                Description
                            </h3>

                            <div className="flex-1 overflow-y-auto rounded-md p-4 bg-gray-50">
                                <p className="text-gray-700 whitespace-pre-wrap break-words h-[70px]">
                                    {task.description || "No description provided"}
                                </p>
                            </div>
                        </div>

                        {/* META SECTION – NOW SEPARATE MINI CARDS */}
                        <div className="grid grid-cols-2 gap-4">

                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <p className="text-gray-500 text-xs mb-1">Created</p>
                                <p className="font-medium">
                                    {new Date(task.created_at).toLocaleString()}
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <p className="text-gray-500 text-xs mb-1">Last Updated</p>
                                <p className="font-medium">
                                    {new Date(task.updated_at).toLocaleString()}
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <p className="text-gray-500 text-xs mb-1">Feedback Date</p>
                                <p className="font-medium">
                                    {new Date(task.feedback_date).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <p className="text-gray-500 text-xs mb-1">Delays</p>
                                <p className="font-medium">
                                    {task.delay_count}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ================= RIGHT SIDE ================= */}
                    <div className="bg-white rounded-xl shadow-sm p-6  flex flex-col h-[500px]">

                        <h2 className="text-xl font-semibold mb-6">
                            Delay History
                        </h2>

                        <div className="flex-1 overflow-y-auto pr-2">

                            {task.delays.length === 0 ? (
                                <p className="text-gray-400 text-sm">
                                    No delays recorded.
                                </p>
                            ) : (
                                <div className="relative">

                                    {/* Vertical Line */}
                                    <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-gray-300"></div>

                                    <div className="space-y-10">

                                        {task.delays.map((delay) => (
                                            <div key={delay.id} className="grid grid-cols-[24px_1fr] gap-4 relative">

                                                {/* DOT COLUMN */}
                                                <div className="relative flex justify-center">
                                                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                                </div>

                                                {/* CONTENT COLUMN */}
                                                <div>

                                                    <p className="text-sm text-gray-500">
                                                        {new Date(delay.created_at).toLocaleString()}
                                                    </p>

                                                    <p className="mt-2 text-base font-medium text-gray-800">
                                                        {delay.reason}
                                                    </p>

                                                    <p className="text-sm text-gray-600 mt-2">
                                                        {new Date(delay.old_date).toLocaleDateString()} →{" "}
                                                        {new Date(delay.new_date).toLocaleDateString()}
                                                    </p>

                                                </div>

                                            </div>
                                        ))}

                                    </div>

                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetails;
