import axios from "axios";
import baseURL from "./base";
// import toast from "react-hot-toast";

export const registerUser = async (data: {
    name: string;
    email: string;
    password: string;
}) => {
    try {
        const response = await axios.post(`${baseURL}auth/register`, data);
        return response.data;
    } catch (err: any) {
        const message =
            err.response?.data?.message ||
            err.response?.data?.error ||
            err.response?.data?.errors?.[0] ||
            "Registration failed";

        throw new Error(message);
    }
};

export const loginUser = async (data: {
  email: string;
  password: string;
}) => {
  try {
    const response = await axios.post(`${baseURL}auth/login`, data);
    return response.data;
  } catch (err: any) {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Login failed";

    throw new Error(message);
  }
};

export const getTasks = async ({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  filter = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  filter?: string;
}) => {
  try {
    const token = localStorage.getItem("token");

    const response = await axios.get(`${baseURL}auth/gettasks`, {
      params: { page, limit, search, status, filter },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (err: any) {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Failed to fetch tasks";

    throw new Error(message);
  }
};

export const createTask = async ({
  title,
  description,
  feedback_date,
}: {
  title: string;
  description: string;
  feedback_date: string;
}) => {
  try {
    const token = localStorage.getItem("token");

    const response = await axios.post(
      `${baseURL}auth/createtask`,
      {title,description,feedback_date,},
      {headers: {Authorization: `Bearer ${token}`},});

    return response.data;
  } catch (err: any) {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Failed to create ticket";

    throw new Error(message);
  }
};

export const updateTask = async (
  taskId: number,
  {
    title,
    description
  }: {
    title: string;
    description: string;
  }
) => {
  try {
    const token = localStorage.getItem("token");

    const response = await axios.put(
      `${baseURL}auth/updateticket/${taskId}`,
      {
        title,
        description,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (err: any) {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Failed to update task";

    throw new Error(message);
  }
};

export const completeTask = async (taskId: number) => {
  try {
    const token = localStorage.getItem("token");

    const response = await axios.patch(
      `${baseURL}auth/tasks/${taskId}/complete`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (err: any) {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Failed to complete task";

    throw new Error(message);
  }
};

export const delayTask = async (
  taskId:number,
  {
    reason,
    newDate}
    :{
  reason:string,
  newDate:string
  }) =>{
  try{
    const token = localStorage.getItem("token");
    const response = await axios.post(`${baseURL}auth/tasks/${taskId}/delay`,{ 
      reason,
      newDate
    },{
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }catch (err: any) {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Failed to delay task";
    throw new Error(message);
  }
}

export const deleteTask = async (taskId: number) => {
  try {
    const token = localStorage.getItem("token");

    const response = await axios.delete(
      `${baseURL}auth/tasks/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (err: any) {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Failed to delete task";

    throw new Error(message);
  }
};

export const getTaskById = async (taskId: number) => {
  try {
    const token = localStorage.getItem("token");

    const response = await axios.get(
      `${baseURL}auth/tasks/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (err: any) {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Failed to fetch task";

    throw new Error(message);
  }
};
