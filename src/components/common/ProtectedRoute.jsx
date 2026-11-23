
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ children, allowedRole }) {
  const { currentUser, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <div className="simple-page">Restoring your secure session…</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRole &&
    currentUser.role !== allowedRole
  ) {
    return (
      <Navigate
        to={`/${currentUser.role}/dashboard`}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
