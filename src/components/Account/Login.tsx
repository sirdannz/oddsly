/* ++++++++++ IMPORTS ++++++++++ */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

/* ++++++++++ AUTHORIZATION ++++++++++ */
import { signIn, signUp } from "../../authorization/AuthService";
import useAuth from "../../authorization/useAuth";

const Login = () => {
  /* ++++++++++ STATES ++++++++++ */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // New state for confirm password
  const [fullName, setFullName] = useState(""); // State for full name
  const [dateOfBirth, setDateOfBirth] = useState(""); // State for date of birth
  const [agreeToTerms, setAgreeToTerms] = useState(false); // State for terms agreement
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  const handleAuth = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfo(null);

    try {
      if (isSigningUp) {
        // Validate that password and confirmPassword match
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setIsLoading(false);
          return;
        }
        // Validate other fields
        if (!fullName) {
          setError("Please enter your full name");
          setIsLoading(false);
          return;
        }
        if (!dateOfBirth) {
          setError("Please enter your date of birth");
          setIsLoading(false);
          return;
        }
        // Verify age (e.g., 18+)
        const userAge = calculateAge(new Date(dateOfBirth));
        if (userAge < 18) {
          setError("You must be at least 18 years old to sign up");
          setIsLoading(false);
          return;
        }
        if (!agreeToTerms) {
          setError("You must agree to the terms and conditions");
          setIsLoading(false);
          return;
        }

        // Pass additional data to signUp function
        await signUp(email, password, {
          fullName,
          dateOfBirth,
        });
        setInfo(
          "A verification email has been sent. Please check your inbox and verify your email before logging in."
        );
        setIsSigningUp(false);
        // Reset form fields
        setPassword("");
        setConfirmPassword("");
        setFullName("");
        setDateOfBirth("");
        setAgreeToTerms(false);
      } else {
        await signIn(email, password);
        await refreshAuth(); // Refresh auth state after successful login
        navigate("/"); // Redirect to home page
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to calculate age
  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  /* ++++++++++ RENDER ++++++++++ */
  return (
    <div className="flex flex-col h-[50vh] text-center items-center">
      <h2 className="text-6xl pt-12 pb-4 font-[900]">
        {isSigningUp ? "Sign Up" : "Login"}
      </h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {info && <p className="text-blue-500 mb-4">{info}</p>}

      <form onSubmit={handleAuth} className="flex flex-col items-center">
        {isSigningUp && (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-[25vw] min-w-[300px] max-w-[400px] mt-4 mb-8 border-neon border-2 p-1 focus:border-4 focus:outline-none"
              required
            />
            <input
              type="date"
              placeholder="Date of Birth"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-[25vw] min-w-[300px] max-w-[400px] mb-8 border-neon border-2 p-1 focus:border-4 focus:outline-none"
              required
            />
          </>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-[25vw] min-w-[300px] max-w-[400px] mt-4 mb-8 border-neon border-2 p-1 focus:border-4 focus:outline-none"
          required
        />
        <div className="relative w-[25vw] min-w-[300px] max-w-[400px] mb-8">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-neon border-2 p-1 focus:border-4 focus:outline-none"
            required
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
            role="img"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>
        {/* Confirm Password Field */}
        {isSigningUp && (
          <div className="relative w-[25vw] min-w-[300px] max-w-[400px] mb-8">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border-neon border-2 p-1 focus:border-4 focus:outline-none"
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
              role="img"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>
        )}
        {/* Terms and Conditions */}
        {isSigningUp && (
          <div className="mb-8">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="form-checkbox"
                required
              />
              <span className="ml-2">
                I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-[300px] bg-neon text-white py-2 rounded-md hover:bg-[#2043b8] duration-[300ms] mb-4 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? "Loading..." : isSigningUp ? "Sign Up" : "Login"}
        </button>
      </form>

      <button
        onClick={() => {
          setIsSigningUp(!isSigningUp);
          // Reset form fields when toggling
          setPassword("");
          setConfirmPassword("");
          setFullName("");
          setDateOfBirth("");
          setAgreeToTerms(false);
          setError(null);
        }}
        disabled={isLoading}
        className="text-neon hover:underline"
      >
        {isSigningUp ? "Have an account? Login" : "New here? Sign Up"}
      </button>
    </div>
  );
};

export default Login;
