import React, { useState, useEffect } from "react";
import "./FlightSearch.css";
import data from "../data/airportCodes.json";

const FlightSearch = ({ onSearch }) => {
  const [tripType, setTripType] = useState("round");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [travelClass, setTravelClass] = useState("1");
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [children, setChildren] = useState(0);
  const [adults, setAdults] = useState(1);
  const [showPassengerPopup, setShowPassengerPopup] = useState(false);

  // Load airport data once
  const airports = data;

  const handleFromChange = (e) => {
    const value = e.target.value;
    setFrom(value);

    if (value.length > 1) {
      const filtered = airports.filter(
        (a) =>
          a.city.toLowerCase().includes(value.toLowerCase()) ||
          a.name.toLowerCase().includes(value.toLowerCase()) ||
          a.code.toLowerCase().includes(value.toLowerCase())
      );
      setFromSuggestions(filtered.slice(0, 6)); // Limit to 6 suggestions
    } else {
      setFromSuggestions([]);
    }
  };

  const handleToChange = (e) => {
    const value = e.target.value;
    setTo(value);

    if (value.length > 1) {
      const filtered = airports.filter(
        (a) =>
          a.city.toLowerCase().includes(value.toLowerCase()) ||
          a.name.toLowerCase().includes(value.toLowerCase()) ||
          a.code.toLowerCase().includes(value.toLowerCase())
      );
      setToSuggestions(filtered.slice(0, 6));
    } else {
      setToSuggestions([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!from || !to || !departure) {
      alert("Please fill out From, To, and Departure date.");
      return;
    }
    onSearch({ 
      from, 
      to, 
      departure, 
      returnDate, 
      passengers: adults + children, 
      adults,
      children,
      tripType, 
      travel_class: travelClass  
    });
  };

  const handleAdultIncrement = () => {
    setAdults(prev => prev + 1);
  };

  const handleAdultDecrement = () => {
    setAdults(prev => prev > 1 ? prev - 1 : 1);
  };

  const handleChildrenIncrement = () => {
    setChildren(prev => prev + 1);
  };

  const handleChildrenDecrement = () => {
    setChildren(prev => prev > 0 ? prev - 1 : 0);
  };

  const getPassengerSummary = () => {
    const total = adults + children;
    let summary = `${total} Passenger${total > 1 ? 's' : ''}`;
    if (children > 0) {
      summary += ` (${adults} Adult${adults > 1 ? 's' : ''}, ${children} Child${children > 1 ? 'ren' : ''})`;
    }
    return summary;
  };

  return (
    <form className="flight-form" onSubmit={handleSubmit}>
      <div className="trip-type">
        <label>
          <input
            type="radio"
            name="trip"
            checked={tripType === "round"}
            onChange={() => setTripType("round")}
          />
          Round Trip
        </label>
        <label>
          <input
            type="radio"
            name="trip"
            checked={tripType === "oneway"}
            onChange={() => setTripType("oneway")}
          />
          One Way
        </label>

        <label className="travel-class-label">
          <select
            value={travelClass}
            onChange={(e) => setTravelClass(e.target.value)}
            className="class-select"
          >
            <option value="1">Economy</option>
            <option value="2">Premium Economy</option>
            <option value="3">Business</option>
            <option value="4">First Class</option>
          </select>
        </label>
      </div>

      <div className="form-row">
        {/* FROM */}
        <div className="input-wrapper">
          <label className="input-label">From</label>
          <input
            type="text"
            placeholder="Departure City"
            value={from}
            onChange={handleFromChange}
          />
          {fromSuggestions.length > 0 && (
            <ul className="suggestions">
              {fromSuggestions.map((a) => (
                <li
                  key={a.code}
                  onClick={() => {
                    setFrom(a.code);
                    setFromSuggestions([]);
                  }}
                >
                  {a.city} ({a.code}) — {a.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* TO */}
        <div className="input-wrapper">
          <label className="input-label">To</label>
          <input
            type="text"
            placeholder="Destination City"
            value={to}
            onChange={handleToChange}
          />
          {toSuggestions.length > 0 && (
            <ul className="suggestions">
              {toSuggestions.map((a) => (
                <li
                  key={a.code}
                  onClick={() => {
                    setTo(a.code);
                    setToSuggestions([]);
                  }}
                >
                  {a.city} ({a.code}) — {a.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      
        {/* DEPARTURE DATE */}
        <div className="input-wrapper">
          <label className="input-label">Departure</label>
          <input
            type="date"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
          />
        </div>

        {/* RETURN DATE */}
        <div className="input-wrapper">
          <label className="input-label">Return</label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            disabled={tripType === "oneway"}
          />
        </div>

        {/* PASSENGERS */}
        <div className="input-wrapper">
          <label className="input-label">Passengers</label>
          <div 
            className="passenger-input"
            onClick={() => setShowPassengerPopup(true)}
          >
            {getPassengerSummary()}
          </div>
          
          {showPassengerPopup && (
            <div className="passenger-popup">
              <div className="passenger-popup-content">
                <div className="passenger-type">
                  <div className="passenger-label">
                    <span className="type">Adults</span>
                    <span className="age">(12+ years)</span>
                  </div>
                  <div className="passenger-controls">
                    <button 
                      type="button" 
                      className="passenger-btn"
                      onClick={handleAdultDecrement}
                    >
                      -
                    </button>
                    <span className="passenger-count">{adults}</span>
                    <button 
                      type="button" 
                      className="passenger-btn"
                      onClick={handleAdultIncrement}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="passenger-type">
                  <div className="passenger-label">
                    <span className="type">Children</span>
                    <span className="age">(2-11 years)</span>
                  </div>
                  <div className="passenger-controls">
                    <button 
                      type="button" 
                      className="passenger-btn"
                      onClick={handleChildrenDecrement}
                    >
                      -
                    </button>
                    <span className="passenger-count">{children}</span>
                    <button 
                      type="button" 
                      className="passenger-btn"
                      onClick={handleChildrenIncrement}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <button 
                  type="button" 
                  className="done-btn"
                  onClick={() => setShowPassengerPopup(false)}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <button type="submit" className="search-btn">
        Search Flights
      </button>
    </form>
  );
};

export default FlightSearch;