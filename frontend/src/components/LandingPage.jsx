import { useNavigate } from "react-router-dom";
import batmanlogosvg from "../assets/batmanlogosvg.svg"; // Updated import
import { auth } from "../firebase";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleEnterClick = () => {
    auth.currentUser ? navigate("/dashboard") : navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] to-[#feecec]">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-[#C94B4B]/10 rounded-full -top-20 -left-20 animate-pulse opacity-30"></div>
        <div className="absolute w-72 h-72 bg-[#C94B4B]/15 rounded-full -bottom-20 -right-20 animate-pulse opacity-40"></div>
      </div>

      {/* Content - Seamless Integration */}
      <div className="relative z-10 text-center p-8 space-y-8">
        <img
          src={batmanlogosvg} // Changed to SVG
          alt="Batman Logo"
          className="w-40 h-32 mx-auto filter saturate-110 contrast-125 animate-float"
        />

        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-[#1F2937] mb-4 bg-gradient-to-r from-[#C94B4B] to-[#b33737] bg-clip-text text-transparent">
            Gotham Parking
          </h1>
          <p className="text-xl text-[#4B5563]/90 font-medium">
            Smart parking solutions
          </p>
        </div>
        
        <button
          className="px-8 py-4 bg-[#C94B4B] text-white font-semibold rounded-xl
          hover:bg-[#C94B4B]/90 transition-all duration-300 shadow-md
          hover:scale-105 hover:shadow-lg active:scale-95"
          onClick={handleEnterClick}
        >
          Enter the Batcave
        </button>
      </div>
    </div>
  );
};

export default LandingPage;