import { createContext, useContext, useEffect, useState } from "react";
import { resetDemoDoctorDirectory } from "../services/doctorService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Demo accounts are in memory only; clear the persisted doctor list too.
    resetDemoDoctorDirectory();
  }, []);

  function register(userData) {
    const normalizedEmail = userData.email.trim().toLowerCase();
    const existingUser = users.find((user) => user.email === normalizedEmail);
    if (existingUser) {
      return { success: false, message: "An account with this email already exists." };
    }

    const newUser = {
      id: Date.now(),
      name: userData.name.trim(),
      email: normalizedEmail,
      password: userData.password,
      phone: userData.phone,
      role: userData.role,
      isVerified: userData.role === "patient"
    };
    setUsers((previousUsers) => [...previousUsers, newUser]);
    const { password, ...safeUser } = newUser;
    setCurrentUser(safeUser);
    return { success: true, user: safeUser };
  }

  function login(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find((account) =>
      account.email === normalizedEmail && account.password === password
    );
    if (!user) return { success: false, message: "Invalid email or password." };
    const { password: storedPassword, ...safeUser } = user;
    setCurrentUser(safeUser);
    return { success: true, user: safeUser };
  }

  function logout() {
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
