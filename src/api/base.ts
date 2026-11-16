
// const baseURL = "https://task-tracker-backend-lyu3.onrender.com/api/";
const baseURL = location.hostname === "localhost"
	? "http://localhost:5000/api/"
	: "https://task-tracker-backend-lyu3.onrender.com/api/";
export default baseURL;
