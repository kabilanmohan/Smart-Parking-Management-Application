import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate(); // Hook for navigation

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-gray-700 rounded-full -top-20 -left-20 animate-pulse opacity-30"></div>
        <div className="absolute w-72 h-72 bg-gray-800 rounded-full -bottom-20 -right-20 animate-pulse opacity-40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center p-8 rounded-lg shadow-2xl bg-black/80 backdrop-blur-md">
        <img
          src="/batman-logo.jpg" // Reference the image from the public folder
          alt="Batman Logo"
          className="w-24 h-24 mx-auto mb-6"
        />

        <h1 className="text-6xl font-bold text-white mb-4"> Gotham Parking </h1>
        <p className="text-xl text-gray-300 mb-8"> Smart parking solutions  </p>
        
        {/* Button to navigate to the App */}
        <button
          className="px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 transition duration-300"
          onClick={() => navigate("/dashboard")} // Navigate to /dashboard
        >
          Enter the Batcave
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
