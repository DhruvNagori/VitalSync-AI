import { apiRequest } from "./api";

function normalizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    dateOfBirth: user.date_of_birth,
    specialization: user.specialization,
    registrationNumber: user.registration_number,
    isVerified: user.is_verified,
    createdAt: user.created_at
  };
}

export async function registerAccount(userData) {
  const result = await apiRequest("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      role: userData.role,
      date_of_birth: userData.dateOfBirth || null,
      specialization: userData.specialization || null,
      registration_number: userData.registrationNumber || null
    })
  });

  return { ...result, user: normalizeUser(result.user) };
}

export async function loginAccount(email, password, rememberMe) {
  const result = await apiRequest("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      remember_me: rememberMe
    })
  });

  return { ...result, user: normalizeUser(result.user) };
}

export async function getCurrentAccount() {
  const user = await apiRequest("/auth/me");
  return normalizeUser(user);
}
