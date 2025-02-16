import { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const Home = () => {
  const [position, setPosition] = useState({ lat: 0, lng: 0 });
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("Geolocation permission denied")
    );

    fetch("/api/parking")
      .then((res) => res.json())
      .then((data) => setParkingSpaces(data))
      .catch((err) => console.error(err));
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="relative">
      {/* Sidebar Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 text-white transform ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-50`} // Added z-50
      >
        <div className="p-4">
          <h2 className="text-xl font-bold">Menu</h2>
          <button
            onClick={handleLogout}
            className="mt-4 w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Menu Toggle Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed top-4 left-4 bg-gray-800 text-white p-2 rounded z-50" // Added z-50
      >
        {isMenuOpen ? "Close Menu" : "Open Menu"}
      </button>

      {/* Google Map */}
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={position}
          zoom={15}
          options={{
            // Disable map controls to ensure they don't overlap with the menu button
            disableDefaultUI: true,
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          <Marker position={position} />
          {parkingSpaces.map((space) => (
            <Marker key={space.id} position={space.location} />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default Home;