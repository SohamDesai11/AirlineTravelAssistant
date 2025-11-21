import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

import FlightSearch from "./components/FlightSearch.jsx";
import FlightResults from "./components/FlightResults.jsx";

function App() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPassengers, setSearchPassengers] = useState({ adults: 1, children: 0 });
  const [cart, setCart] = useState([]);
  const [viewMode, setViewMode] = useState("home"); // 'home' or 'cart'

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

  // Fetch cart from server
  const fetchCart = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/cart");
      if (res?.data?.cart) setCart(res.data.cart);
    } catch (err) {
      console.error("Failed to fetch cart:", err.message || err);
    }
  };

  // Add item to cart optimistically (so UI works even if server is down)
  const addToCart = async (flight) => {
    try {
      // Ensure an id exists for remove operations
      const item = { ...flight };
      if (!item.id) item.id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      // optimistic update
      setCart(prev => [...prev, item]);
      setViewMode("cart");
      // attempt to persist on server; don't block the UI
      axios.post("http://localhost:5000/api/cart", item).catch((err) => {
        console.warn("Server add to cart failed (cart kept locally):", err.message || err);
      });
    } catch (err) {
      console.error("Failed to add to cart:", err.message || err);
    }
  };

  // Remove item from cart (optimistic; also tries server delete)
  const removeFromCart = async (id) => {
    try {
      setCart(prev => prev.filter(item => item.id !== id));
      // try server delete
      axios.delete(`http://localhost:5000/api/cart/${id}`).catch(err => {
        console.warn('Server delete failed (local cart updated):', err.message || err);
      });
    } catch (err) {
      console.error('Failed to remove from cart:', err.message || err);
    }
  };

  // load cart on mount
  useEffect(() => {
    // fetch current cart
    fetchCart();
    // set initial viewMode based on URL
    if (window.location.pathname === "/cart") setViewMode("cart");

    // listen for back/forward navigation
    const onPop = () => {
      if (window.location.pathname === "/cart") setViewMode("cart");
      else setViewMode("home");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <>
    <nav className="navbar">
      <div className="logo-container">
        <img src="/6192144.png" alt="Flight Booker Logo"/>
        <span className="logo-text">Skybooker</span>
      </div>
      <button
        className="cart-container"
        type="button"
        onClick={() => {
          // navigate to cart page and update URL
          window.history.pushState({}, '', '/cart');
          setViewMode("cart");
          if (!cart.length) fetchCart();
        }}
      >
        <div className="cart-icon">🛒</div>
        <div className="cart-count">{cart.length}</div>
      </button>
    </nav>
      <div className="app-container">
      <h1 className="app-title">Find Your Perfect Flight</h1>
      <p className="small-paragraph">Book flights to anywhere in the world with the best price and service</p>
      {viewMode === "home" ? (
        <>
          <FlightSearch onSearch={handleSearch} />
          {loading ? (
            <p className="text-center mt-4">Loading...</p>
          ) : (
            <FlightResults
              flights={flights}
              adults={searchPassengers.adults}
              children={searchPassengers.children}
              addToCart={addToCart}
            />
          )}
        </>
      ) : (
        // Cart page (separate view without search or results)
        <div className="cart-page-wrapper">
          <button className="back-btn" onClick={() => { window.history.pushState({}, '', '/'); setViewMode("home"); }}>← Back to Search</button>
          <div className="cart-page">
            <div className="cart-header">
              <h2>Your Cart</h2>
              <div className="cart-actions">
                <button className="clear-btn" onClick={async () => {
                  // optimistic clear: try server deletes if possible
                  try {
                    const ids = cart.map(c => c.id).filter(Boolean);
                    await Promise.all(ids.map(id => axios.delete(`http://localhost:5000/api/cart/${id}`).catch(()=>{})));
                  } catch (e) {
                    // ignore server errors
                  }
                  setCart([]);
                }}>Clear Cart</button>
                <button className="checkout-btn" onClick={() => alert('Checkout placeholder')}>Checkout</button>
              </div>
            </div>

            <div className="cart-body">
              <p className="cart-count-text">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
              {cart.length === 0 ? (
                <p className="empty-cart">No flights in cart yet.</p>
              ) : (
                <ul className="cart-list">
                  {cart.map((c) => (
                    <li key={c.id} className="cart-item">
                      <button className="remove-x" onClick={() => removeFromCart(c.id)} aria-label={`Remove ${c.airline}`}>✕</button>
                      <div className="cart-desc">
                        <div className="cart-airline">{c.airline || 'Flight'}</div>
                        <div className="cart-price">${(parseFloat(c.total_price) || parseFloat(c.basePrice) || 0).toFixed(2)}</div>
                        <div className="cart-passengers">{c.passengers || ''}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="cart-footer">
                <div className="subtotal">
                  <span>Subtotal</span>
                  <strong>${cart.reduce((s, c) => s + (parseFloat(c.total_price) || parseFloat(c.basePrice) || 0), 0).toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default App;
