import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    Name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'traveler',
    phone: '',
    agreeToTerms: false,
  });

  // New state to hold field-specific errors
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(''); // For non-field specific errors
  const [success, setSuccess] = useState('');

  const { signup, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear the specific error for the field being changed
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
    setGeneralError(''); // Also clear general errors when a field changes
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter.';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter.';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number.';
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'Password must contain at least one special character (e.g., !@#$%^&*).';
    }
    return ''; // No error
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({}); // Clear all previous field errors
    setGeneralError(''); // Clear general errors
    setSuccess('');

    let errors = {};
    let hasError = false;

    // Phone number validation
    if (formData.phone.length === 0) {
        errors.phone = 'Phone number is required.';
        hasError = true;
    } else if (!/^\d+$/.test(formData.phone)) {
        errors.phone = 'Phone number can only contain digits.';
        hasError = true;
    } else if (formData.phone.length > 10) {
      errors.phone = 'Phone number cannot be more than 10 digits.';
      hasError = true;
    } else if (formData.phone.length < 10) {
      errors.phone = 'Phone number must be exactly 10 digits.';
      hasError = true;
    }


    // Password validation
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      errors.password = passwordError;
      hasError = true;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
      hasError = true;
    }

    // Terms and Conditions validation
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the Terms and Conditions.';
      hasError = true;
    }

    // If any errors were found, set them and stop submission
    if (hasError) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      name: formData.Name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role.toUpperCase(),
      contactNumber: formData.phone.trim()
    };

    try {
      const result = await signup(payload);
      if (result.success) {
        setSuccess('Account created successfully! Please login to continue.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setGeneralError(err.message || 'An unexpected error occurred during signup.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {generalError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {generalError}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="Name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="Name"
                name="Name"
                type="text"
                required
                value={formData.Name}
                onChange={handleChange}
                className={`mt-1 input-field ${fieldErrors.Name ? 'border-red-500' : ''}`}
                placeholder="Ram"
              />
              {fieldErrors.Name && <p className="mt-2 text-sm text-red-600">{fieldErrors.Name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 input-field ${fieldErrors.email ? 'border-red-500' : ''}`}
                placeholder="john@example.com"
              />
              {fieldErrors.email && <p className="mt-2 text-sm text-red-600">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`mt-1 input-field ${fieldErrors.phone ? 'border-red-500' : ''}`}
                placeholder="9998887770"
              />
              {fieldErrors.phone && <p className="mt-2 text-sm text-red-600">{fieldErrors.phone}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`mt-1 input-field ${fieldErrors.password ? 'border-red-500' : ''}`}
                placeholder="Enter your password"
              />
              {fieldErrors.password && <p className="mt-2 text-sm text-red-600">{fieldErrors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`mt-1 input-field ${fieldErrors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Confirm your password"
              />
              {fieldErrors.confirmPassword && <p className="mt-2 text-sm text-red-600">{fieldErrors.confirmPassword}</p>}
            </div>

            <div className="flex items-center">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ${fieldErrors.agreeToTerms ? 'border-red-500' : ''}`}
              />
              <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {fieldErrors.agreeToTerms && <p className="mt-2 text-sm text-red-600">{fieldErrors.agreeToTerms}</p>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <LoadingSpinner size="sm" text="" /> : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;