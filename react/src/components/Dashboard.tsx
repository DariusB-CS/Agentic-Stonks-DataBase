import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import StockTicker from "./StockTicker";

interface Stock {
  name: string;
  price: number;
  change_in_price: number;
  volume: number;
  market_cap: number | null;
  p_to_e_ratio: number | null;
}

function Dashboard() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [followMsg, setFollowMsg] = useState("");

  useEffect(() => {
    fetch("/api/stocks")
      .then((res) => res.json())
      .then((data) => {
        setStocks(data.stocks);
        setFiltered(data.stocks);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toUpperCase();
    setSearch(query);
    setFiltered(stocks.filter((s) => s.name.toUpperCase().includes(query)));
  };

  const handleLogout = async () => {
    await fetch("/logout");
    window.location.href = "/";
  };

  const sendStock = async (name: string) => {
    setFollowMsg("");
    try {
      const res = await fetch("/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setFollowing((prev) => new Set([...prev, name]));
        setFollowMsg(`✓ ${name} added to your stocks!`);
      } else {
        setFollowMsg(`${name} is already in your stocks.`);
      }
    } catch (err) {
      setFollowMsg("Something went wrong. Please try again.");
    }

    setTimeout(() => setFollowMsg(""), 3000);
  };

  const totalGainers = stocks.filter((s) => s.change_in_price >= 0).length;
  const totalLosers = stocks.filter((s) => s.change_in_price < 0).length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#3c7a18" }}>
      <StockTicker />

      {/* Navbar */}
      <nav
        className="navbar px-4 py-2 d-flex justify-content-between align-items-center"
        style={{ backgroundColor: "#2d5e12" }}
      >
        <span style={{ color: "#fff", fontSize: "1.5rem", fontWeight: "bold" }}>
          📈 Social Stonks
        </span>
        <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <div className="container py-4">
        {/* Summary Cards */}
        <div className="row mb-4 g-3">
          <div className="col-md-4">
            <div
              style={{
                backgroundColor: "#2d5e12",
                borderRadius: "8px",
                padding: "20px",
                color: "#fff",
                textAlign: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
            >
              <h6 style={{ color: "#a8d5a2" }}>Total Stocks</h6>
              <h2>{stocks.length}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div
              style={{
                backgroundColor: "#2d5e12",
                borderRadius: "8px",
                padding: "20px",
                color: "#00ff9f",
                textAlign: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
            >
              <h6 style={{ color: "#a8d5a2" }}>Gainers</h6>
              <h2>▲ {totalGainers}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div
              style={{
                backgroundColor: "#2d5e12",
                borderRadius: "8px",
                padding: "20px",
                color: "#ff4d6d",
                textAlign: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
            >
              <h6 style={{ color: "#a8d5a2" }}>Losers</h6>
              <h2>▼ {totalLosers}</h2>
            </div>
          </div>
        </div>

        {/* My Followed Stocks button */}
        <Link to="/mystocks">
          <button className="btn btn-light mb-3">📊 My Followed Stocks</button>
        </Link>

        {/* Follow feedback message */}
        {followMsg && (
          <div
            className={`alert py-2 mb-3 ${
              followMsg.startsWith("✓") ? "alert-success" : "alert-warning"
            }`}
          >
            {followMsg}
          </div>
        )}

        {/* Search Bar */}
        <div className="row mb-4">
          <div className="col-md-6 mx-auto">
            <input
              type="text"
              className="form-control form-control-lg"
              placeholder="🔍 Search stocks e.g. AAPL, TSLA..."
              value={search}
              onChange={handleSearch}
              style={{
                backgroundColor: "#fff",
                border: "2px solid #2d5e12",
                borderRadius: "8px",
              }}
            />
          </div>
        </div>

        {/* Stock Table */}
        {loading ? (
          <div className="text-center text-white">
            <div className="spinner-border" role="status" />
            <p className="mt-2">Loading stocks...</p>
          </div>
        ) : (
          <div className="row">
            <div className="col">
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
              >
                <table className="table table-hover mb-0">
                  <thead style={{ backgroundColor: "#2d5e12", color: "#fff" }}>
                    <tr>
                      <th>Ticker</th>
                      <th>Price</th>
                      <th>Change</th>
                      <th>Volume</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length > 0 ? (
                      filtered.map((stock) => (
                        <tr key={stock.name}>
                          <td>
                            <strong>{stock.name}</strong>
                          </td>
                          <td>${stock.price.toFixed(2)}</td>
                          <td
                            style={{
                              color:
                                stock.change_in_price >= 0
                                  ? "#2d5e12"
                                  : "#dc3545",
                              fontWeight: "bold",
                            }}
                          >
                            {stock.change_in_price >= 0 ? "▲" : "▼"}{" "}
                            {Math.abs(stock.change_in_price).toFixed(2)}
                          </td>
                          <td>{stock.volume.toLocaleString()}</td>
                          <td>
                            <button
                              className="btn btn-sm"
                              style={{
                                backgroundColor: following.has(stock.name)
                                  ? "#a8d5a2"
                                  : "#2d5e12",
                                color: "#fff",
                                border: "none",
                                minWidth: "100px",
                              }}
                              onClick={() => sendStock(stock.name)}
                              disabled={following.has(stock.name)}
                            >
                              {following.has(stock.name)
                                ? "✓ Following"
                                : "+ Follow"}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          No stocks found for "<strong>{search}</strong>"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;