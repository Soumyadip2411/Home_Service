import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const accessToken = localStorage.getItem("accesstoken");

  return accessToken ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
