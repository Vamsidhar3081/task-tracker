import axios from "./axiosInstance";

type ApiErrorShape = {
  errors?: string[];
  error?: string;
  message?: string;
};

type LoginResponse = {
  token: string;
  role?: string;
  user?: {
    id?: number;
    role?: string;
    name?: string;
    email?: string;
  };
};

export type UserSummary = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  created_at: string;
  total_tasks: number;
  ongoing_tasks: number;
};

export type TaskItem = {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at?: string;
  feedback_date?: string;
  is_overdue: number;
  created_by?: number;
  assigned_to?: number;
  creator_name?: string;
  assignee_name?: string;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

type RawTask = Record<string, unknown>;

const normalizeTask = (task: RawTask): TaskItem => ({
  id: Number(task.id ?? 0),
  title: String(task.title ?? ""),
  description: String(task.description ?? ""),
  status: String(task.status ?? ""),
  created_at: String(task.created_at ?? ""),
  updated_at: task.updated_at ? String(task.updated_at) : undefined,
  feedback_date: task.feedback_date ? String(task.feedback_date) : undefined,
  is_overdue: Number(task.is_overdue ?? 0),
  created_by: task.created_by ? Number(task.created_by) : undefined,
  assigned_to: task.assigned_to ? Number(task.assigned_to) : undefined,
  creator_name: task.creator_name ? String(task.creator_name) : undefined,
  assignee_name: task.assignee_name ? String(task.assignee_name) : undefined,
});

const handleError = (err: unknown, fallback: string): never => {
  const data = (err as { response?: { data?: ApiErrorShape } })?.response?.data;
  const message =
    data?.errors?.[0] || data?.error || data?.message || (err as Error)?.message || fallback;

  throw new Error(message);
};

const decodeJwtPayload = (token: string) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = window.atob(normalized);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const persistAuthSession = (data: LoginResponse) => {
  localStorage.setItem("token", data.token);

  const payload = decodeJwtPayload(data.token);
  const userId =
    data.user?.id ??
    (typeof payload?.userId === "number" ? payload.userId : undefined) ??
    (typeof payload?.id === "number" ? payload.id : undefined);
  const role =
    data.role ??
    data.user?.role ??
    (typeof payload?.role === "string" ? payload.role : undefined);

  if (typeof userId === "number") {
    localStorage.setItem("userId", String(userId));
  } else {
    localStorage.removeItem("userId");
  }

  if (role) {
    localStorage.setItem("role", role);
  } else {
    localStorage.removeItem("role");
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("role");
};

export const getStoredRole = () => localStorage.getItem("role");
export const getStoredUserId = () => Number(localStorage.getItem("userId") || 0);
export const isAdminRole = () => getStoredRole()?.toUpperCase() === "ADMIN";

export const registerUser = async (data: RegisterPayload) => {
  try {
    const res = await axios.post("/auth/register", data);
    return res.data as { message?: string };
  } catch (err) {
    return handleError(err, "Registration failed");
  }
};

export const createManagedUser = async (
  data: RegisterPayload & { role?: "ADMIN" | "USER" }
) => {
  try {
    const res = await axios.post("/auth/users", data);
    return res.data as { message?: string };
  } catch (err) {
    return handleError(err, "Failed to create user");
  }
};

export const getUsers = async () => {
  try {
    const res = await axios.get("/auth/users");
    return {
      users: Array.isArray(res.data?.users)
        ? (res.data.users as UserSummary[]).map((user) => ({
            ...user,
            id: Number(user.id),
            total_tasks: Number(user.total_tasks ?? 0),
            ongoing_tasks: Number(user.ongoing_tasks ?? 0),
          }))
        : [],
    };
  } catch (err) {
    return handleError(err, "Failed to fetch users");
  }
};

export const deleteManagedUser = async (userId: number) => {
  try {
    const res = await axios.delete(`/auth/users/${userId}`);
    return res.data as { message?: string };
  } catch (err) {
    return handleError(err, "Failed to delete user");
  }
};

export const loginUser = async (data: { email: string; password: string }) => {
  try {
    const res = await axios.post("/auth/login", data);
    if (!res.data?.token) {
      throw new Error("Token missing from response");
    }
    return res.data as LoginResponse;
  } catch (err) {
    return handleError(err, "Login failed");
  }
};

export const getTasks = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  filter?: string;
  assignedTo?: number | "";
}) => {
  try {
    const res = await axios.get("/auth/gettasks", { params });
    const tasks = Array.isArray(res.data?.task)
      ? (res.data.task as RawTask[]).map(normalizeTask)
      : [];

    return {
      ...res.data,
      task: tasks,
    } as {
      task?: TaskItem[];
      meta?: { total: number; page: number; limit: number; totalPages: number };
    };
  } catch (err) {
    return handleError(err, "Failed to fetch tasks");
  }
};

export const createTask = async (data: {
  title: string;
  description: string;
  feedback_date: string;
  status?: string;
  assignedTo?: number;
}) => {
  try {
    const res = await axios.post("/auth/createtask", data);
    return res.data as { message?: string; taskId?: number };
  } catch (err) {
    return handleError(err, "Failed to create task");
  }
};

export const updateTask = async (
  taskId: number,
  data: {
    title?: string;
    description?: string;
    feedback_date?: string;
    status?: string;
    assignedTo?: number;
  }
) => {
  try {
    const res = await axios.put(`/auth/updateticket/${taskId}`, data);
    return res.data as { message?: string };
  } catch (err) {
    return handleError(err, "Failed to update task");
  }
};

export const completeTask = async (taskId: number) => {
  try {
    const res = await axios.patch(`/auth/tasks/${taskId}/complete`);
    return res.data as { message?: string };
  } catch (err) {
    return handleError(err, "Failed to complete task");
  }
};

export const delayTask = async (
  taskId: number,
  data: {
    reason: string;
    newDate: string;
  }
) => {
  try {
    const res = await axios.post(`/auth/tasks/${taskId}/delay`, data);
    return res.data as { message?: string };
  } catch (err) {
    return handleError(err, "Failed to delay task");
  }
};

export const deleteTask = async (taskId: number) => {
  try {
    const res = await axios.delete(`/auth/tasks/${taskId}`);
    return res.data as { message?: string };
  } catch (err) {
    return handleError(err, "Failed to delete task");
  }
};

export const getTaskById = async (taskId: number) => {
  try {
    const res = await axios.get(`/auth/tasks/${taskId}`);
    return {
      ...normalizeTask(res.data || {}),
      delay_count: Number(res.data?.delay_count ?? 0),
      delays: Array.isArray(res.data?.delays) ? res.data.delays : [],
      completed_at: res.data?.completed_at ? String(res.data.completed_at) : undefined,
    };
  } catch (err) {
    return handleError(err, "Failed to fetch task");
  }
};
