
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Eye, EyeOff, ArrowRight } from "lucide-react";

import AuthLayout from "../../layouts/AuthLayout";
import { useAuth } from "../../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateForm() {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password, rememberMe);
    setIsSubmitting(false);

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    navigate(`/${result.user.role}/dashboard`, {
      replace: true
    });
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to access your healthcare dashboard."
    >

      <form className="auth-form" onSubmit={handleSubmit}>

        <div className="form-group">

          <label htmlFor="email">
            Email Address
          </label>

          <input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors({});
              setMessage("");
            }}
          />

          {errors.email && (
            <span className="form-error">
              {errors.email}
            </span>
          )}

        </div>

        <div className="form-group">

          <label htmlFor="password">
            Password
          </label>

          <div className="password-input-wrapper">

            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors({});
                setMessage("");
              }}
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

        <div className="form-options">

          <label className="remember-option">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) =>
                setRememberMe(event.target.checked)
              }
            />

            <span>Remember me</span>
          </label>

          <span className="forgot-password">
            Forgot password?
          </span>

        </div>

        {message && (
          <div className="form-error" role="alert">
            {message}
          </div>
        )}

        <button
          type="submit"
          className="auth-submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing In…" : "Sign In"}
          <ArrowRight size={18} />
        </button>

      </form>

      <div className="auth-switch">
        Don't have an account?

        <Link to="/register">
          Create Account
        </Link>
      </div>

    </AuthLayout>
  );
}

export default LoginPage;
