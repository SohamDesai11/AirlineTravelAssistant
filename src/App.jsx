import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import FlightSearch from "./components/FlightSearch.jsx";
import FlightResults from "./components/FlightResults.jsx";

// Backend URL for development; change as needed for production
const BACKEND_URL = "https://airlinetravelassistant.onrender.com";

// Root application component
function App() {
  // App-level state
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  // Track the passenger counts used in the most recent search
  const [searchPassengers, setSearchPassengers] = useState({ adults: 1, children: 0 });
  const [cart, setCart] = useState([]);
  // viewMode: "home" shows search, "cart" shows the cart page
  const [viewMode, setViewMode] = useState("home");

  // Performs the flight search by calling the backend API.
  // `params` is expected to include `from`, `to`, `departure`, `adults`, `children`, etc.
  const handleSearch = async (params) => {
    const { from, to, departure, returnDate, adults = 1, children = 0, tripType, travel_class } = params;
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/flights`, {
        params: { from, to, departure, returnDate, passengers: adults + children, tripType, travel_class },
      });
      // Normalize response: expect `res.data.flights` but gracefully handle missing values
      setFlights(res.data.flights || []);
      setSearchPassengers({ adults, children });
    } catch (err) {
      // Keep error handling simple for now; the UI shows an alert
      alert("No flights found");
    } finally {
      setLoading(false);
    }
  };

  // Fetch persisted cart from backend (if available)
  const fetchCart = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/cart`);
      setCart(res.data.cart || []);
    } catch (err) { /* ignore errors during fetch */ }
  };

  // Add a selected flight group to the cart, both local state and backend
  const addToCart = async (fullFlightGroup) => {
    const item = {
      id: `cart-${Date.now()}`,
      ...fullFlightGroup,
      passengerAdults: searchPassengers.adults,
      passengerChildren: searchPassengers.children,
    };
    setCart(prev => [...prev, item]);
    // Switch to cart view and update browser history
    setViewMode("cart");
    window.history.pushState({}, "", "/cart");
    // Try to persist to the backend but don't block on failure
    axios.post(`${BACKEND_URL}/api/cart`, item).catch(() => {});
  };

  // Remove item from cart locally and on backend
  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
    axios.delete(`${BACKEND_URL}/api/cart/${id}`).catch(() => {});
  };

  // On mount: load cart and set view based on URL path
  useEffect(() => {
    fetchCart();
    if (window.location.pathname === "/cart") setViewMode("cart");
    const onPop = () => setViewMode(window.location.pathname === "/cart" ? "cart" : "home");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Helper utilities — resilient to different API shapes
  const getAirportCode = (airport) => {
    if (!airport) return "??";
    return airport.code || airport.iata || airport.icao || airport.id || "??";
  };

  const getTime = (leg) => {
    if (!leg) return "N/A";
    return (
      leg.departure_time ||
      leg.departure_airport?.time ||
      leg.arrival_time ||
      leg.arrival_airport?.time ||
      "N/A"
    );
  };

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === "N/A") return "N/A";
    try {
      return timeStr.split("T")[1]?.slice(0, 5) ||
             timeStr.split(" ")[1]?.slice(0, 5) ||
             "N/A";
    } catch {
      return "N/A";
    }
  };

  const formatDate = (timeStr) => {
    if (!timeStr || timeStr === "N/A") return "N/A";
    try {
      const date = timeStr.split("T")[0];
      return new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    } catch {
      return "N/A";
    }
  };

  const formatDuration = (mins) => {
    if (!mins) return "N/A";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ""}`;
  };

  const getPassengerText = () => {
    const { adults, children } = searchPassengers;
    const parts = [];
    if (adults) parts.push(`${adults} Adult${adults > 1 ? "s" : ""}`);
    if (children) parts.push(`${children} Child${children > 1 ? "ren" : ""}`);
    return parts.join(", ") || "1 Adult";
  };

  const getClassName = (code) => ["Economy", "Premium Economy", "Business", "First Class"][Number(code) - 1] || "Economy";

  // Render
  return (
    <>
      <nav className="navbar">
        <div className="logo-container">
          <img src="/6192144.png" alt="Skybooker" />
          <span className="logo-text">Skybooker</span>
        </div>
        <button className="cart-container" onClick={() => { window.history.pushState({}, "", "/cart"); setViewMode("cart"); }}>
          Cart  <span className="cart-count">{cart.length}</span>
        </button>
      </nav>

      <div className="app-container">
        <h1 className="app-title">Find Your Perfect Flight</h1>
        <p className="small-paragraph">Book flights to anywhere in the world with the best price and service</p>

        {viewMode === "home" ? (
          <>
            {/* Search form */}
            <FlightSearch onSearch={handleSearch} />
            {/* Results list (or loading state) */}
            {loading ? <p>Loading...</p> : <FlightResults flights={flights} adults={searchPassengers.adults} children={searchPassengers.children} addToCart={addToCart} />}
          </>
        ) : (
          <div className="cart-page-wrapper">
            <button className="back-btn-modern" onClick={() => { window.history.pushState({}, "", "/"); setViewMode("home"); }}>
              Back to Search
            </button>

            <div className="cart-page-modern">
              <div className="cart-header-modern">
                <h2>Your Selected Flights ({cart.length})</h2>
                <div className="cart-actions-modern">
                  <button className="clear-btn-modern" onClick={() => setCart([])}>Clear Cart</button>
                  <button className="checkout-btn-modern">Proceed to Checkout</button>
                </div>
              </div>

              {cart.length === 0 ? (
                <div className="empty-cart-modern">
                  <h3>Your cart is empty</h3>
                </div>
              ) : (
                <>
                  <div className="cart-items-modern">
                    {cart.map((item) => {
                      const legs = item.flights || item.legs || [];
                      const firstLeg = legs[0] || {};
                      const lastLeg = legs[legs.length - 1] || {};

                      return (
                        <div key={item.id} className="detailed-cart-flight">
                          <div className="flight-summary-header">
                            <div className="airline-info">
                              {item.airline_logo && <img src={item.airline_logo} alt={item.airline || "Airline"} className="airline-logo" />}
                              <div>
                                <strong>{item.airline || item.company || "Airline"}</strong>
                                <span className="flight-number"> • {firstLeg.flight_number || "N/A"}</span>
                              </div>
                            </div>
                            <button className="remove-flight-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
                          </div>

                          <div className="flight-route-timeline">
                            <div className="timeline-point">
                              <div className="time">{formatTime(getTime(firstLeg))}</div>
                              <div className="airport">{getAirportCode(firstLeg.departure_airport) || getAirportCode(firstLeg.from)}</div>
                            </div>

                            <div className="timeline-connector">
                              <div className="duration">{formatDuration(item.total_duration || firstLeg.duration)}</div>
                              <div className="layover">
                                {legs.length <= 1 ? "Non-stop" : `${legs.length - 1} stop${legs.length > 2 ? "s" : ""}`}
                              </div>
                            </div>

                            <div className="timeline-point">
                              <div className="time">{formatTime(getTime(lastLeg))}</div>
                              <div className="airport">{getAirportCode(lastLeg.arrival_airport) || getAirportCode(lastLeg.to)}</div>
                            </div>
                          </div>

                          <div className="flight-meta-info">
                            <div className="meta-item"><strong>Date:</strong> {formatDate(getTime(firstLeg))}</div>
                            <div className="meta-item"><strong>Passengers:</strong> {getPassengerText()}</div>
                            <div className="meta-item"><strong>Class:</strong> {getClassName(item.travel_class || item.travelClass || "1")}</div>
                          </div>

                          <div className="flight-price-final">
                            <strong>${parseFloat(item.total_price || item.price || 0).toFixed(2)}</strong>
                            <small>Total for {searchPassengers.adults + searchPassengers.children} traveler{searchPassengers.adults + searchPassengers.children > 1 ? "s" : ""}</small>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="cart-total-summary">
                    <div className="total-line">
                      <span>Total Amount</span>
                      <strong className="grand-total">
                        ${cart.reduce((s, i) => s + parseFloat(i.total_price || i.price || 0), 0).toFixed(2)}
                      </strong>
                    </div>
                    <div className="secure-badge">Secure • Best Price Guarantee</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;