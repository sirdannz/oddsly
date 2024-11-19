/* ++++++++++ LIBRARIES ++++++++++ */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';

/* ++++++++++ ICONS ++++++++++ */
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

/* ++++++++++ AUTHORIZATION / LOGIN ++++++++++ */
import { signIn, signUp, forgotPassword } from '../../authorization/AuthService';
import useAuth from '../../authorization/useAuth';

const Login = () => {
  /* ++++++++++ STATES ++++++++++ */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValidations, setPasswordValidations] = useState({
    hasLength: false,
    hasCapital: false,
    hasNumber: false,
    hasSpecial: false,
  });
  
  const [validations, setValidations] = useState({
    email: false,
    password: false,
    confirmPassword: false,
    fullName: false,
    dateOfBirth: false
  });
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;


  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  // Validate password on change
  useEffect(() => {
    setPasswordValidations(validatePassword(password));
  }, [password]);

  // Validate email, password, confirm password, full name, and date of birth
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return {
      hasLength: password.length >= 8,
      hasCapital: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  const validateConfirmPassword = (password: string, confirmPassword: string) => {
    return password === confirmPassword && password !== "";
  };

  const validateFullName = (name: string) => {
    return name.length >= 2 && /^[a-zA-Z\s]*$/.test(name);
  };

  const validateDateOfBirth = (dob: string) => {
    if (!dob) return false;
    const age = calculateAge(new Date(dob));
    return age >= 18;
  };

  // Password Reset
  const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfo(null);
  
    try {
      if (!email) {
        setError('Please enter your email address.');
        setIsLoading(false);
        return;
      }
  
      await forgotPassword(email);
      setInfo('Password reset email sent. Please check your inbox.');
      setIsResettingPassword(false);
      resetForm();
    } catch (error) {
      console.error('Password reset error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };
  

  // Validate all fields on change
  useEffect(() => {
    setValidations({
      email: validateEmail(email),
      password: !!password && Object.values(validatePassword(password)).every(Boolean),//validatePassword(password),
      confirmPassword: !!confirmPassword && validateConfirmPassword(password, confirmPassword),
      fullName: fullName ? validateFullName(fullName) : false,
      dateOfBirth: !!dateOfBirth && validateDateOfBirth(dateOfBirth)
    });
  }, [email, password, confirmPassword, fullName, dateOfBirth]);


  const calculateAge = (birthDate: Date) => { // Calculate age from date of birth
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfo(null);

    // Complete reCAPTCHA before proceeding
    if (!captchaVerified) {
      setError("Please complete the reCAPTCHA");
      setIsLoading(false);
      return;
    }

    // Sign up or sign in
    try { 
      if (isSigningUp) {
        if (!Object.values(validations).every(Boolean) || !agreeToTerms) {
          setError("Please ensure all fields are valid");
          setIsLoading(false);
          return;
        }
        await signUp(email, password, { fullName, dateOfBirth });
        setInfo("A verification email has been sent. Please check your inbox.");
        setIsSigningUp(false);
        resetForm();
      } else {
        if (!validations.email || !validations.password) {
          setError("Invalid email or password");
          setIsLoading(false);
          return;
        }
        await signIn(email, password);
        await refreshAuth();
        navigate("/");
      }
    } catch (error) {
      console.error("Auth error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Resert form
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setDateOfBirth('');
    setAgreeToTerms(false);
    setError(null);
    setInfo(null);
  };
  

  // Get input class name
  const getInputClassName = (isValid: boolean, value: string, isSigningUp: boolean) => `
    w-full px-4 py-2 rounded-lg
    border-2 transition-all duration-300 ease-in-out
    ${
      isSigningUp
        ? isValid === true 
          ? 'border-green-500' 
          : isValid === false 
            ? 'border-neon' 
            : 'border-gray-300'
        : value 
          ? 'border-neon' 
          : 'border-gray-300'
    }
    focus:outline-none focus:border-4
    hover:border-opacity-80
  `;

  //
  return (
    <div className="flex flex-col min-h-[50vh] items-center p-8 bg-white">
    <h2 className="text-6xl font-black mb-8 transition-all duration-300">
      {isSigningUp
        ? 'Sign Up'
        : isResettingPassword
        ? 'Reset Password'
        : 'Login'}
    </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg transition-all duration-300">
          {error}
        </div>
      )}

      {info && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-lg transition-all duration-300">
          {info}
        </div>
      )}

      {/* Login and Sign Up Forms */}
      {!isResettingPassword && (
      <form onSubmit={handleAuth} className="w-full max-w-md space-y-6">
        <div className="space-y-6 transition-all duration-300">
          {isSigningUp && (
            <>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={getInputClassName(validations.fullName, fullName, isSigningUp)}
                  required
                />
                {fullName && validations.fullName === false && (
                  <p className="text-sm text-red-500">Please enter a valid full name</p>
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className={getInputClassName(validations.dateOfBirth, dateOfBirth, isSigningUp)}
                  required
                />
                {dateOfBirth && validations.dateOfBirth === false && (
                  <p className="text-sm text-red-500">Must be 18 or older</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={getInputClassName(validations.email, email, isSigningUp)}
              required
            />
            {email && validations.email === false && (
              <p className="text-sm text-red-500">Please enter a valid email</p>
            )}
          </div>

          <div className="relative space-y-2">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={getInputClassName(validations.password, password, isSigningUp)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {isSigningUp && (
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex items-center">
                {passwordValidations.hasLength ? (
                  <CheckCircle className="text-green-500 mr-2" />
                ) : (
                  <XCircle className="text-red-500 mr-2" />
                )}
                <span>At least 8 characters</span>
              </div>
              <div className="flex items-center">
                {passwordValidations.hasCapital ? (
                  <CheckCircle className="text-green-500 mr-2" />
                ) : (
                  <XCircle className="text-red-500 mr-2" />
                )}
                <span>One uppercase letter</span>
              </div>
              <div className="flex items-center">
                {passwordValidations.hasNumber ? (
                  <CheckCircle className="text-green-500 mr-2" />
                ) : (
                  <XCircle className="text-red-500 mr-2" />
                )}
                <span>One number</span>
              </div>
              <div className="flex items-center">
                {passwordValidations.hasSpecial ? (
                  <CheckCircle className="text-green-500 mr-2" />
                ) : (
                  <XCircle className="text-red-500 mr-2" />
                )}
                <span>One special character (!@#$...)</span>
              </div>
            </div>
            )}
          </div>

          {isSigningUp && (
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={getInputClassName(validations.confirmPassword, confirmPassword, isSigningUp)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {confirmPassword && validations.confirmPassword === false && (
                <p className="text-sm text-red-500">Passwords must match</p>
              )}
            </div>
          )}

          {isSigningUp && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-4 h-4 text-neon border-neon rounded focus:ring-neon"
                required
              />
              <span className="text-sm text-gray-600">
                I agree to the{" "}
                <a href="/terms" target="_blank" className="text-neon hover:underline">
                  Terms
                </a>{" "}
                and{" "}
                <a href="/privacy" target="_blank" className="text-neon hover:underline">
                  Privacy Policy
                </a>
              </span>
            </div>
          )}

          <div className="flex justify-center mt-4">
            <ReCAPTCHA
              sitekey={SITE_KEY}
              onChange={() => setCaptchaVerified(true)}
            />
          </div>

        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full py-3 rounded-lg
            bg-neon text-white font-medium
            transform transition-all duration-300
            hover:bg-opacity-90 hover:scale-[1.02]
            disabled:opacity-50 disabled:cursor-not-allowed
            disabled:hover:scale-100
          `}
        >
          {isLoading ? "Loading..." : isSigningUp ? "Sign Up" : "Login"}
        </button>
      </form>
      )}

      {/* Password Reset Form */}
    {isResettingPassword && (
      <form
        onSubmit={handlePasswordReset}
        className="w-full max-w-md space-y-6"
      >
        <div className="space-y-6 transition-all duration-300">
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={getInputClassName(
                validations.email,
                email,
                isSigningUp
              )}
              required
            />
            {email && validations.email === false && (
              <p className="text-sm text-red-500">
                Please enter a valid email
              </p>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full py-3 rounded-lg
            bg-neon text-white font-medium
            transform transition-all duration-300
            hover:bg-opacity-90 hover:scale-[1.02]
            disabled:opacity-50 disabled:cursor-not-allowed
            disabled:hover:scale-100
          `}
        >
          {isLoading ? 'Loading...' : 'Send Password Reset Email'}
        </button>
      </form>
    )}

    {/* Navigation Links */}
    {!isResettingPassword && (
      <>
        <button
          onClick={() => {
            setIsSigningUp(!isSigningUp);
            resetForm();
          }}
          disabled={isLoading}
          className="mt-6 text-neon hover:underline transition-all duration-300"
        >
          {isSigningUp ? 'Have an account? Login' : 'New here? Sign Up'}
        </button>

        <button
          onClick={() => {
            setIsResettingPassword(true);
            resetForm();
          }}
          disabled={isLoading}
          className="mt-2 text-neon hover:underline transition-all duration-300"
        >
          Forgot Password?
        </button>
      </>
    )}

    {isResettingPassword && (
      <button
        onClick={() => {
          setIsResettingPassword(false);
          resetForm();
        }}
        disabled={isLoading}
        className="mt-6 text-neon hover:underline transition-all duration-300"
      >
        Back to Login
      </button>
    )}
  </div>
);
};

export default Login;