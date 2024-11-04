import { signOut } from "../../authorization/AuthService";

const Logout = () => {
  return (
    <button 
      onClick={signOut}
      className="bg-neon rounded-md text-white px-4 py-2 hover:scale-[1.1] duration-[300ms]"
      
      
      >Logout
    </button>

  );
};

export default Logout;
