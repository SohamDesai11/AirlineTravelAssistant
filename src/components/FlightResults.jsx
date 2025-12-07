// FlightResults.jsx
import React, { useState } from "react";
import "./FlightResults.css";

// FlightResults component
// - Renders a list of flight groups (one group can contain multiple legs)
// - Accepts props: `flights` (array), `adults` (number), `children` (number), `addToCart` (callback)
// - Designed to be robust to varying API formats (lots of safe lookups)

const FlightResults = ({ flights, adults = 1, children = 0, addToCart }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Total passengers (adults + children)
  const totalPassengers = adults + children;

  if (!flights || flights.length === 0) {
    return (
      <div className="flight-results">
        <p className="no-flights-text">
          No flights found. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  // Helper: Extract time (HH:MM) from a datetime string.
  // Supports ISO (`YYYY-MM-DDTHH:MM:SS`) and space-separated formats.
  const extractTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    try {
      return (
        dateTimeString.split("T")[1]?.substring(0, 5) ||
        dateTimeString.split(" ")[1]?.substring(0, 5) ||
        "N/A"
      );
    } catch {
      return "N/A";
    }
  };

  // Helper: Get airport code from an airport object that may use different keys
  // Falls back to "??" when the code cannot be determined.
  const getAirportCode = (airport) => {
    if (!airport) return "??";
    return airport.code || airport.iata || airport.id || "??";
  };

  // Helper: Map numeric travel class codes to human readable names.
  // Accepts strings or numbers (e.g., "1" or 1).
  const getTravelClass = (travelClass) => {
    const map = { "1": "Economy", "2": "Premium Economy", "3": "Business", "4": "First Class" };
    return map[travelClass] || "Economy";
  };

  // Calculate total price for all passengers and format to two decimals.
  const calculateTotalPrice = (basePrice) => {
    const price = parseFloat(basePrice) || 0;
    return (price * totalPassengers).toFixed(2);
  };

  // Format passenger text for display, handling pluralization.
  // Examples: "1 adult", "2 adults, 1 child".
  const getPassengerText = () => {
    if (totalPassengers === 1) {
      return children === 1 ? "1 child" : "1 adult";
    }

    const parts = [];
    if (adults > 0) parts.push(`${adults} adult${adults > 1 ? "s" : ""}`);
    if (children > 0) parts.push(`${children} child${children > 1 ? "ren" : ""}`);

    return parts.join(", ");
  };

  // Format duration given in minutes into "Xh Ym" form.
  const formatDuration = (minutes) => {
    if (typeof minutes !== "number") return minutes || "N/A";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ""}`;
  };

  return (
    <div className="flight-results">
      <h2 className="results-title">Available Flights ({flights.length})</h2>

    
      {flights.map((group, index) => {
        const legs = group.flights || [];
        const firstLeg = legs[0];
        const lastLeg = legs[legs.length - 1];

        // Normalize common fields from either the group or its first leg.
        const airline = firstLeg?.airline || group.airline || "Unknown Airline";
        const airlineLogo = firstLeg?.airline_logo || group.airline_logo;
        const basePrice = group.price || group.total_price || 0;
        const totalPrice = calculateTotalPrice(basePrice);
        const duration = group.total_duration || firstLeg?.duration || 0;

        // Safely extract departure/arrival codes and times.
        const departureCode = getAirportCode(firstLeg?.departure_airport);
        const arrivalCode = getAirportCode(lastLeg?.arrival_airport);
        const departureTime = extractTime(firstLeg?.departure_airport?.time || firstLeg?.departure_time);
        const arrivalTime = extractTime(lastLeg?.arrival_airport?.time || lastLeg?.arrival_time);
        const flightNumber = firstLeg?.flight_number || "N/A";

        // Build layover summary (which airports the flight stops at).
        const layoverAirports = legs.slice(0, -1).map(leg => getAirportCode(leg.arrival_airport));
        const stopsCount = layoverAirports.length;
        const layoverLabel =
          stopsCount === 0
            ? "Non-stop"
            : stopsCount === 1
            ? `1 stop • ${layoverAirports[0]}`
            : `${stopsCount} stops • ${layoverAirports.join(" • ")}`;

        const aircraft = firstLeg?.airplane || "Unknown aircraft";
        const travelClass = group.travel_class || "1";
        const legroom = firstLeg?.legroom || "Standard";

        return (
          <div key={index} className="flight-card">
            {/* LEFT: Flight Info */}
            <div className="flight-left">
              {/* Airline & Toggle */}
              <div className="airline-section">
                {airlineLogo ? (
                  <img src={airlineLogo} alt={airline} className="airline-logo" />
                ) : (
                  <div className="plane-icon">Plane</div>
                )}
                <div>
                  <div className="airline-name">{airline}</div>
                  <div className="flight-number">{flightNumber}</div>
                  <div
                    className="aircraft-toggle"
                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  >
                    {expandedIndex === index ? "Hide details" : "View details"}
                  </div>
                  {expandedIndex === index && (
                    <div className="aircraft-info">
                      <div className="aircraft-title">{aircraft}</div>
                      <div className="aircraft-details">
                        {getTravelClass(travelClass)} • {legroom} legroom
                      </div>
                      <ul className="amenities-list">
                        <li>Wi-Fi available</li>
                        <li>In-seat power & USB</li>
                        <li>On-demand entertainment</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Times & Route */}
              <div className="flight-time-section">
                <div className="time-block">
                  <div className="flight-time">{departureTime}</div>
                  <div className="airport-code">{departureCode}</div>
                </div>

                <div className="flight-path">
                  <span className="circle"></span>
                  <span className="line"></span>
                  <span className="circle filled"></span>
                  <div className="duration-text">{formatDuration(duration)}</div>
                  <div className="layover-text">{layoverLabel}</div>
                </div>

                <div className="time-block">
                  <div className="flight-time">{arrivalTime}</div>
                  <div className="airport-code">{arrivalCode}</div>
                </div>
              </div>
            </div>

            {/* RIGHT: Price & Select */}
            <div className="flight-right">
              <div className="price-box">
                <span className="best-deal">BEST DEAL</span>
                <div className="price">${totalPrice}</div>
                <div className="price-breakdown">
                  ${parseFloat(basePrice).toFixed(2)} × {totalPassengers} passengers
                </div>
                <div className="per-person">Total • {getPassengerText()}</div>
              </div>
              {/* Select button will call `addToCart` with the selected flight group. */}
              <button
                className="select-btn"
                onClick={() => {
                  if (typeof addToCart === 'function') {
                    const payload = {
                      airline,
                      flightNumber,
                      legs,
                      passengers: totalPassengers,
                      basePrice: parseFloat(basePrice) || 0,
                      total_price: parseFloat(totalPrice) || 0,
                      travelClass,
                    };
                    // We pass the original `group` to preserve any extra metadata.
                    addToCart(group);
                  } else {
                    console.warn('addToCart not provided');
                  }
                }}
              >
                Select Flight
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FlightResults;