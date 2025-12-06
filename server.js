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
    // Map tripType from frontend to SerpAPI `type` parameter
    // API expects: 1 = Round trip (default), 2 = One way, 3 = Multi-city
    const serpTravelClass = travel_class;
    const serpType = tripType === "oneway" ? 2 : tripType === "multi" ? 3 : 1;
    const response = await axios.get("https://serpapi.com/search", {
      params: {
        engine: "google_flights",
        departure_id: from,
        arrival_id: to,
        outbound_date: departure,
        // Only include return_date when trip is round trip
        return_date: serpType === 1 ? returnDate : undefined,
        type: serpType,
        passengers,
        travel_class: serpTravelClass,
        hl: "en",
        gl: "us",
        api_key: process.env.SERP_API_KEY,
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

    // If this was a round-trip search and the API indicates a token is required
    // to fetch return-legs, attempt a follow-up request. Some SerpAPI flows
    // return a `departure_token` or `return_token` either at top-level or
    // inside individual flight objects.
    if (serpType === 1) {
      // Try to find a token in top-level response
      const topLevelToken = response.data.return_token || response.data.departure_token || response.data.token || response.data.departureToken || response.data.returnToken;

      // Otherwise, look inside flights for a token field
      let flightToken = null;
      for (const f of flights) {
        if (f.return_token || f.departure_token || f.token || f.departureToken || f.returnToken) {
          flightToken = f.return_token || f.departure_token || f.token || f.departureToken || f.returnToken;
          break;
        }
      }

      const followupToken = topLevelToken || flightToken;
      if (followupToken) {
        try {
          console.log("Found follow-up token, fetching return legs with token:", followupToken);
          const follow = await axios.get("https://serpapi.com/search", {
            params: {
              engine: "google_flights",
              departure_token: followupToken,
              hl: "en",
              gl: "us",
              api_key: process.env.SERP_API_KEY,
            },
          });

          const returnFlights = follow.data.best_flights || follow.data.other_flights || follow.data.flights || [];
          // Tag return flights so frontend can differentiate if needed
          returnFlights.forEach(r => { r.is_return = true; r.travel_class = travel_class; });

          // Append return flights to the main flights array so they will be returned
          flights.push(...returnFlights);
          console.log("Appended return flights, new flights length:", flights.length);
        } catch (err) {
          console.warn("Follow-up request for return legs failed:", err.message);
        }
      } else {
        console.log("No follow-up token found in initial response; returning initial flights only.");
      }
    }

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

// Simple in-memory shopping cart
const cart = [];

// Add flight to cart
app.post("/api/cart", (req, res) => {
  try {
    const item = req.body;
    if (!item) return res.status(400).json({ success: false, error: "No cart item provided" });
    // Assign an id server-side if one isn't provided
    if (!item.id) {
      item.id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
    cart.push(item);
    console.log("Added to cart:", item);
    res.json({ success: true, cart });
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get cart contents
app.get("/api/cart", (req, res) => {
  res.json({ success: true, cart });
});

// Remove item from cart by id
app.delete("/api/cart/:id", (req, res) => {
  try {
    const { id } = req.params;
    const index = cart.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: "Item not found" });
    const removed = cart.splice(index, 1)[0];
    console.log("Removed from cart:", removed);
    res.json({ success: true, cart });
  } catch (err) {
    console.error("Error removing from cart:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(5000, () => console.log("✅ Server running on port 5000"));
