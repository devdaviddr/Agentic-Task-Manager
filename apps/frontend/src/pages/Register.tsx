import { Navigate } from 'react-router-dom';

/**
 * Registration is handled automatically via Google Sign-In.
 * Redirect anyone visiting /register to the login page.
 */
export default function Register() {
  return <Navigate to="/login" replace />;
}
