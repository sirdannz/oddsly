import { useState } from "react";
import { signIn, signUp } from "../../authorization/AuthService";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);


  const handleAuth = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    try {
      setError(null);
      setInfo(null);
      
      if (isSigningUp) {
        await signUp(email, password);
        setInfo("A verification email has been sent. Please check your inbox and verify your email before logging in.");
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col h-[50vh] text-center items-center">
      <h2 className="text-6xl pt-12 pb-4 font-[900]">{isSigningUp ? "Sign Up" : "Login"}</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {info && <p style={{ color: "blue" }}>{info}</p>}

      <form onSubmit={handleAuth} className="flex flex-col items-center">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-[25vw] min-w-[300px] max-w-[400px] mt-4 mb-8 border-neon border-2 p-1 focus:border-4 focus:outline-none"
        />
        <div className="relative w-[25vw] min-w-[300px] max-w-[400px] mb-8">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-neon border-2 p-1 focus:border-4 focus:outline-none"
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
        <button
          type="submit"
          className="w-[300px] bg-neon text-white py-2 rounded-md hover:bg-[#2043b8] duration-[300ms] mb-4"
        >
          {isSigningUp ? "Sign Up" : "Login"}
        </button>
      </form>

      <button onClick={() => setIsSigningUp(!isSigningUp)}>
        {isSigningUp ? "Have an account? Login" : "New here? Sign Up"}
      </button>
    </div>
  );
};

export default Login;
