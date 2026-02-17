import { Routes, Route,Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import CreateTask from "./pages/CreateTask";
import TaskDetails from "./pages/TaskDetails";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/register" />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard/>} />
      <Route path="/createtask" element={<CreateTask/>} />
      <Route path="/tasks/:id" element={<TaskDetails />} />
    </Routes>
  );
}

export default App;
