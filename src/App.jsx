import { useState } from "react";
import axios from "axios";
import "./App.css";

import FlightSearch from "./components/FlightSearch.jsx";
import FlightResults from "./components/FlightResults.jsx";

function App() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPassengers, setSearchPassengers] = useState({ adults: 1, children: 0 });

  const handleSearch = async ({ from, to, departure, returnDate, passengers, adults = 1, children = 0, tripType, travel_class }) => {
    setLoading(true);

    // 🧩 Add your console.log here:
    console.log("Searching flights from", from, "to", to, "on", departure, "return:", returnDate, "passengers:", passengers, "tripType:", tripType, "travel_class:", travel_class);

    try {
      const res = await axios.get("http://localhost:5000/api/flights", {
    params: { 
      from, 
      to, 
      departure, 
      returnDate, 
      passengers, 
      tripType,
      travel_class},
  });

      // 🧩 Add another console.log to inspect the response:
      console.log("API Response:", res.data);

      setFlights(res.data.flights || []);
      // Store the passenger counts sent from the search form (if provided)
      if (typeof passengers === 'number' || typeof adults === 'number' || typeof children === 'number') {
        setSearchPassengers({ adults: adults || 1, children: children || 0 });
      }
    } catch (error) {
      console.error("Error fetching flights:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <nav className="navbar">
      <div className="logo-container">
        <img src="/6192144.png" alt="Flight Booker Logo"/>
        <span className="logo-text">Skybooker</span>
      </div>
    </nav>
    <div className="app-container">
      <h1 className="app-title">Find Your Perfect Flight</h1>
      <p className="small-paragraph">Book flights to anywhere in the world with the best price and service</p>
      <FlightSearch onSearch={handleSearch} />
      {loading ? <p className="text-center mt-4">Loading...</p> : (
        <FlightResults
          flights={flights}
          adults={searchPassengers.adults}
          children={searchPassengers.children}
        />
      )}
    </div>
    </>
  );
}

export default App;
