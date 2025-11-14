import { useState } from "react";
import axios from "axios";
import "./App.css";

import FlightSearch from "./components/FlightSearch.jsx";
import FlightResults from "./components/FlightResults.jsx";

function App() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async ({ from, to, departure, returnDate, passengers, tripType }) => {
    setLoading(true);

    // 🧩 Add your console.log here:
    console.log("Searching flights from", from, "to", to, "on", departure, "return:", returnDate);

    try {
      const res = await axios.get("http://localhost:5000/api/flights", {
    params: { 
      from, 
      to, 
      departure, 
      returnDate, 
      passengers, 
      tripType },
  });

      // 🧩 Add another console.log to inspect the response:
      console.log("API Response:", res.data);

      setFlights(res.data.flights || []);
    } catch (error) {
      console.error("Error fetching flights:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Find Your Perfect Flight</h1>
      <FlightSearch onSearch={handleSearch} />
      {loading ? <p className="text-center mt-4">Loading...</p> : <FlightResults flights={flights} />}
    </div>
  );
}

export default App;
