import React, { useState } from "react";
import "./FlightResults.css";

const FlightResults = ({ flights }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!flights || flights.length === 0) {
    return (
      <p className="no-flights-text">
        No flights found. Try a different search.
      </p>
    );
  }

  // Extract time from datetime
  const extractTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    try {
      if (dateTimeString.includes("T")) {
        return dateTimeString.split("T")[1].substring(0, 5);
      } else if (dateTimeString.includes(" ")) {
        return dateTimeString.split(" ")[1].substring(0, 5);
      } else {
        return dateTimeString.length > 5
          ? dateTimeString.substring(11, 16)
          : dateTimeString;
      }
    } catch {
      return "N/A";
    }
  };

  // Get airport code from nested objects
  const getAirportCode = (a) => {
    if (!a) return "??";
    return a.code || a.iata || a.id || "??";
  };

  // Function to get the travel class 
  const getTravelClass = (travelClass) => {
    const classMap = {
      1: "Economy",
      2: "Premium Economy",
      3: "Business",
      4: "First Class",
    };
    return classMap[travelClass] || "Economy";
  };

  return (
    <div className="flight-results">
      <h2 className="results-title">Available Flights ({flights.length})</h2>

      {flights.map((group, index) => {
        const legs = group.flights || [];
        const firstLeg = legs[0];
        const lastLeg = legs[legs.length - 1];

        const airline = firstLeg?.airline || group.airline || "Unknown Airline";
        const airlineLogo = firstLeg?.airline_logo || group.airline_logo;
        const price = group.price || group.total_price || "N/A";
        const duration = group.total_duration || firstLeg?.duration || "N/A";

        const departureCode = getAirportCode(firstLeg?.departure_airport);
        const arrivalCode = getAirportCode(lastLeg?.arrival_airport);
        

        const departureTime = extractTime(
          firstLeg?.departure_airport?.time || firstLeg?.departure_time
        );
        const arrivalTime = extractTime(
          lastLeg?.arrival_airport?.time || lastLeg?.arrival_time
        );

        const flightNumber = firstLeg?.flight_number || "N/A";

        // -------------------------------
        // LAYOVER LOGIC
        // -------------------------------
        const layoverCodes = legs
          .slice(0, -1)
          .map((leg) => getAirportCode(leg.arrival_airport));

        const stopsCount = layoverCodes.length;
        const layoverLabel =
          stopsCount === 0
            ? "Non-stop"
            : stopsCount === 1
            ? `1 Stop • ${layoverCodes[0]}`
            : `${stopsCount} Stops • ${layoverCodes.join(" • ")}`;

        // -------------------------------
        // AIRCRAFT INFO
        // -------------------------------
        const aircraftName =
          firstLeg?.airplane || "Aircraft information unavailable";
        const travelClass = group.travel_class || "1";
        const legroom = firstLeg?.legroom || "N/A";

        const formattedDuration =
          typeof duration === "number"
            ? `${Math.floor(duration / 60)}h ${duration % 60}m`
            : duration;

        return (
          <div key={index} className="flight-card">
            
            {/* LEFT SECTION */}
            <div className="flight-left">

              {/* AIRLINE + AIRCRAFT INFO */}
              <div>
                <div className="airline-section">
                  {airlineLogo ? (
                    <img src={airlineLogo} alt={airline} className="airline-logo" />
                  ) : (
                    <div className="plane-icon">✈️</div>
                  )}

                  <div>
                    <div className="airline-name">{airline}</div>
                    <div className="flight-number">{flightNumber}</div>

                    {/* Expand/Collapse Button */}
                    <div
                      className="aircraft-toggle"
                      onClick={() =>
                        setExpandedIndex(expandedIndex === index ? null : index)
                      }
                    >
                      {expandedIndex === index
                        ? "Hide details ▲"
                        : "View details ▼"}
                    </div>
                  </div>
                </div>

                {/* EXPANDED AIRCRAFT DETAILS */}
                {expandedIndex === index && (
                  <div className="aircraft-info">
                    <div className="aircraft-title">{aircraftName}</div>
                    <div className="aircraft-details">
                      {travelClass} • {legroom} • {formattedDuration}
                    </div>
                    <ul className="amenities-list">
                      <li>Above average legroom ({legroom})</li>
                      <li>In-seat power & USB outlets</li>
                      <li>On-demand video</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* TIME + LAYOVER SECTION */}
              <div className="flight-time-section">
                <div className="time-block">
                  <div className="flight-time">{departureTime}</div>
                  <div className="airport-code">{departureCode}</div>
                </div>

                <div className="flight-path">
                  <span className="circle"></span>
                  <span className="line"></span>
                  <span className="circle filled"></span>

                  <div className="duration-text">{formattedDuration}</div>

                  {/* Layover Info */}
                  <div className="layover-text">{layoverLabel}</div>
                </div>

                <div className="time-block">
                  <div className="flight-time">{arrivalTime}</div>
                  <div className="airport-code">{arrivalCode}</div>
                </div>
              </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="flight-right">
              <div className="price-box">
                <span className="best-deal">BEST DEAL</span>
                <div className="price">${price}</div>
                <span className="per-person">per person</span>
              </div>
              <button className="select-btn">Select Flight</button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FlightResults;
