import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/flights", async (req, res) => {
  const { from, to, departure, returnDate, passengers, tripType, travel_class} = req.query;
  console.log("Fetching flights:", req.query);

  try {
    const serpTravelClass = travel_class;
    const response = await axios.get("https://serpapi.com/search", {
      params: {
        engine: "google_flights",
        departure_id: from,
        arrival_id: to,
        outbound_date: departure,
        return_date: tripType === "round" ? returnDate : undefined,
        passengers,
        travel_class: serpTravelClass,
        hl: "en",
        gl: "us",
        api_key: "0ab784c3a40c6a61f286c3baec46bb9c94e6a397d54ed3c2fc255543e155421a",
      },
    });

    // Debug: Log the full response structure
    console.log("Full API response structure:", Object.keys(response.data));
    
    // Extract flights from different possible locations in SerpAPI response
    const flights = 
      response.data.best_flights || 
      response.data.other_flights || 
      response.data.flights || 
      [];
    
      flights.forEach(f => {
        f.travel_class = travel_class;
       
      });

    console.log("Flights array length:", flights.length);
    
    if (flights.length > 0) {
      console.log("First flight object structure:", flights[0]);
    }

    res.json({ 
      success: true,
      flights: flights,
      total: flights.length
    });
    
  } catch (error) {
    console.error("Error fetching flights:", error.message);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch flights",
      details: error.message 
    });
  }
});

app.listen(5000, () => console.log("✅ Server running on port 5000"));
