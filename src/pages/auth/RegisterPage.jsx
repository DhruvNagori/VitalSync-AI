
import { useState } from "react";

import {
  Link,
  useParams,
  useNavigate
} from "react-router-dom";

import {
  Eye,
  EyeOff,
  ArrowRight
} from "lucide-react";

import AuthLayout from "../../layouts/AuthLayout";
import { useAuth } from "../../context/AuthContext";

function RegisterPage() {
  const { role } = useParams();

  const navigate = useNavigate();
  const { register } = useAuth();

  const isDoctor = role === "doctor";
  const isPatient = role === "patient";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    specialization: "",
    registrationNumber: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: ""
    }));

    setMessage("");
  }

  function validateForm() {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (
      !/^\+?[0-9\s-]{10,15}$/.test(formData.phone)
    ) {
      newErrors.phone = "Enter a valid phone number.";
    }

    if (isDoctor) {
      if (!formData.specialization) {
        newErrors.specialization =
          "Select your specialization.";
      }

      if (!formData.registrationNumber.trim()) {
        newErrors.registrationNumber =
          "Professional registration number is required.";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password =
        "Password must contain at least 8 characters.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();

    setMessage("");

    if (!validateForm()) {
      return;
    }

    const result = register({
      ...formData,
      role: role
    });

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    navigate(`/${role}/dashboard`, {
      replace: true
    });
  }

  if (!isDoctor && !isPatient) {
    return (
      <div className="simple-page">
        <h1>Invalid Registration Type</h1>

        <Link to="/register">
          Select Account Type
        </Link>
      </div>
    );
  }

  return (
    <AuthLayout
      title={
        isDoctor
          ? "Doctor Registration"
          : "Patient Registration"
      }
      subtitle={
        isDoctor
          ? "Create your professional healthcare account."
          : "Create your account to get started with VitalSync AI."
      }
    >

      <div className="register-role-label">
        {isDoctor ? "DOCTOR ACCOUNT" : "PATIENT ACCOUNT"}
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>

        <div className="form-group">

          <label htmlFor="name">
            Full Name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
          />

          {errors.name && (
            <span className="form-error">
              {errors.name}
            </span>
          )}

        </div>

        <div className="form-group">

          <label htmlFor="register-email">
            Email Address
          </label>

          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleChange}
          />

          {errors.email && (
            <span className="form-error">
              {errors.email}
            </span>
          )}

        </div>

        <div className="form-group">

          <label htmlFor="phone">
            Phone Number
          </label>

          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={handleChange}
          />

          {errors.phone && (
            <span className="form-error">
              {errors.phone}
            </span>
          )}

        </div>

        {isPatient && (
          <div className="form-group">

            <label htmlFor="dateOfBirth">
              Date of Birth (Optional)
            </label>

            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />

          </div>
        )}

        {isDoctor && (
          <>
            <div className="form-group">

              <label htmlFor="specialization">
                Medical Specialization
              </label>

              <select
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
              >
                <option value="">Select specialization</option>
                <option value="General Physician">
                  General Physician
                </option>
                <option value="Cardiology">
                  Cardiology
                </option>
                <option value="Neurology">
                  Neurology
                </option>
                <option value="Dermatology">
                  Dermatology
                </option>
                <option value="Orthopedics">
                  Orthopedics
                </option>
                <option value="Pediatrics">
                  Pediatrics
                </option>
                <option value="Other">
                  Other
                </option>
              </select>

              {errors.specialization && (
                <span className="form-error">
                  {errors.specialization}
                </span>
              )}

            </div>

            <div className="form-group">

              <label htmlFor="registrationNumber">
                Professional Registration Number
              </label>

              <input
                id="registrationNumber"
                name="registrationNumber"
                type="text"
                placeholder="Enter registration number"
                value={formData.registrationNumber}
                onChange={handleChange}
              />

              {errors.registrationNumber && (
                <span className="form-error">
                  {errors.registrationNumber}
                </span>
              )}

            </div>
          </>
        )}

        <div className="form-group">

          <label htmlFor="register-password">
            Password
          </label>

          <div className="password-input-wrapper">

            <input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
            >
              {showPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>

          </div>

          {errors.password && (
            <span className="form-error">
              {errors.password}
            </span>
          )}

        </div>

        <div className="form-group">

          <label htmlFor="confirmPassword">
            Confirm Password
          </label>

          <div className="password-input-wrapper">

            <input
              id="confirmPassword"
              name="confirmPassword"
              type={
                showConfirmPassword ? "text" : "password"
              }
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              aria-label={
                showConfirmPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>

          </div>

          {errors.confirmPassword && (
            <span className="form-error">
              {errors.confirmPassword}
            </span>
          )}

        </div>

        {message && (
          <div className="form-error" role="alert">
            {message}
          </div>
        )}

        <button
          type="submit"
          className="auth-submit-button"
        >
          Create Account
          <ArrowRight size={18} />
        </button>

      </form>

      <div className="auth-switch">
        Already have an account?

        <Link to="/login">
          Sign In
        </Link>
      </div>

      <div className="auth-back-link">
        <Link to="/register">
          Change Account Type
        </Link>
      </div>

    </AuthLayout>
  );
}

export default RegisterPage;
