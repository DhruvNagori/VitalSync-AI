
import { Link } from "react-router-dom";

import {
  UserRound,
  Stethoscope,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

import AuthLayout from "../../layouts/AuthLayout";

function RegisterChoicePage() {
  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Choose your account type to get started."
    >

      <div className="role-selection">

        <Link
          to="/register/patient"
          className="role-card"
        >

          <div className="role-icon">
            <UserRound size={28} />
          </div>

          <div className="role-content">
            <h3>I'm a Patient</h3>

            <p>
              Monitor your health, access medical information
              and stay connected with doctors.
            </p>
          </div>

          <ArrowRight className="role-arrow" size={21} />

        </Link>

        <Link
          to="/register/doctor"
          className="role-card"
        >

          <div className="role-icon">
            <Stethoscope size={28} />
          </div>

          <div className="role-content">
            <h3>I'm a Doctor</h3>

            <p>
              Monitor assigned patients, review health reports
              and support patient care.
            </p>
          </div>

          <ArrowRight className="role-arrow" size={21} />

        </Link>

      </div>

      <div className="role-security">
        <ShieldCheck size={18} />
        <span>
          Your account information should only be accessible
          to authorized users.
        </span>
      </div>

      <div className="auth-switch">
        Already have an account?

        <Link to="/login">
          Sign In
        </Link>
      </div>

    </AuthLayout>
  );
}

export default RegisterChoicePage;
