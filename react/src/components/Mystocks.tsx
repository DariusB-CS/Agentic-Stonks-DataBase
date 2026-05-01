import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StockTicker from "./StockTicker";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface ChartData {
    date: string;
    price: number;
}

interface StockWithHistory {
    ticker: string;
    history: ChartData[];
    loading: boolean;
    error: string;
    currentPrice: number | null;
    change: number | null;
}

function MyStocks() {
    const [stocks, setStocks] = useState<StockWithHistory[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [pageError, setPageError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        // Step 1: Get list of followed tickers from backend
        fetch("/api/userStocks")
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setPageError(data.error);
                    setPageLoading(false);
                    return;
                }

                const tickers: string[] = data.tickers || [];

                if (tickers.length === 0) {
                    setPageLoading(false);
                    return;
                }

                // Step 2: Set up initial state for each ticker
                const initial: StockWithHistory[] = tickers.map((ticker) => ({
                    ticker,
                    history: [],
                    loading: true,
                    error: "",
                    currentPrice: null,
                    change: null,
                }));
                setStocks(initial);
                setPageLoading(false);

                // Step 3: Fetch 30-day history for each ticker
                tickers.forEach((ticker) => {
                    fetch(`/api/stock/${ticker}`)
                        .then((res) => res.json())
                        .then((histData) => {
                            const history: ChartData[] = histData.history || [];
                            const currentPrice =
                                history.length > 0
                                    ? history[history.length - 1].price
                                    : null;
                            const change =
                                history.length > 1
                                    ? history[history.length - 1].price - history[0].price
                                    : null;

                            setStocks((prev) =>
                                prev.map((s) =>
                                    s.ticker === ticker
                                        ? { ...s, history, loading: false, currentPrice, change }
                                        : s
                                )
                            );
                        })
                        .catch(() => {
                            setStocks((prev) =>
                                prev.map((s) =>
                                    s.ticker === ticker
                                        ? { ...s, loading: false, error: "Failed to load chart" }
                                        : s
                                )
                            );
                        });
                });
            })
            .catch(() => {
                setPageError("Failed to load your stocks. Are you logged in?");
                setPageLoading(false);
            });
    }, []);

    const handleUnfollow = async (ticker: string) => {
        const res = await fetch("/api/unfollow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticker }),
        });
        if (res.ok) {
            setStocks((prev) => prev.filter((s) => s.ticker !== ticker));
        }
    };

    const handleLogout = async () => {
        await fetch("/logout");
        window.location.href = "/";
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#3c7a18" }}>
            <StockTicker />

            {/* Navbar */}
            <nav
                className="navbar px-4 py-2 d-flex justify-content-between align-items-center"
                style={{ backgroundColor: "#2d5e12" }}
            >
                <span style={{ color: "#fff", fontSize: "1.5rem", fontWeight: "bold" }}>
                    📊 My Stocks
                </span>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-light btn-sm"
                        onClick={() => navigate("/dashboard")}
                    >
                        ← Dashboard
                    </button>
                    <button
                        className="btn btn-outline-light btn-sm"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="container py-4">
                {/* Page Loading */}
                {pageLoading ? (
                    <div className="text-center text-white mt-5">
                        <div className="spinner-border" role="status" />
                        <p className="mt-2">Loading your stocks...</p>
                    </div>

                /* Error */
                ) : pageError ? (
                    <div className="alert alert-danger mt-4">{pageError}</div>

                /* Empty State */
                ) : stocks.length === 0 ? (
                    <div className="text-center text-white mt-5">
                        <h3>You haven't followed any stocks yet!</h3>
                        <p style={{ color: "#d4edda" }}>
                            Go to the dashboard and click "+ Follow" on any stock.
                        </p>
                        <button
                            className="btn btn-light mt-3"
                            onClick={() => navigate("/dashboard")}
                        >
                            Go to Dashboard
                        </button>
                    </div>

                /* Stock Grid */
                ) : (
                    <>
                        {/* Summary bar */}
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 style={{ color: "#fff", margin: 0 }}>
                                Your Followed Stocks ({stocks.length})
                            </h4>
                            <span style={{ color: "#d4edda", fontSize: "0.9rem" }}>
                                📈 Showing last 30 days
                            </span>
                        </div>

                        {/* 2-column chart grid */}
                        <div className="row g-4">
                            {stocks.map((stock) => {
                                const isPositive =
                                    stock.change !== null && stock.change >= 0;
                                const chartColor = isPositive ? "#2d5e12" : "#dc3545";

                                return (
                                    <div className="col-md-6" key={stock.ticker}>
                                        <div style={{
                                            backgroundColor: "#fff",
                                            borderRadius: "8px",
                                            padding: "20px",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                                            height: "100%",
                                        }}>
                                            {/* Card Header */}
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div>
                                                    <h5 style={{ color: "#2d5e12", margin: 0, fontWeight: "bold" }}>
                                                        {stock.ticker}
                                                    </h5>
                                                    {stock.currentPrice !== null && (
                                                        <div style={{ marginTop: "4px" }}>
                                                            <span style={{ fontSize: "1.3rem", fontWeight: "bold" }}>
                                                                ${stock.currentPrice.toFixed(2)}
                                                            </span>
                                                            {stock.change !== null && (
                                                                <span style={{
                                                                    color: chartColor,
                                                                    marginLeft: "8px",
                                                                    fontWeight: "bold",
                                                                    fontSize: "0.95rem"
                                                                }}>
                                                                    {isPositive ? "▲" : "▼"} {Math.abs(stock.change).toFixed(2)}
                                                                    <span style={{ fontSize: "0.8rem", marginLeft: "4px" }}>
                                                                        ({stock.history.length > 1
                                                                            ? (((stock.history[stock.history.length - 1].price - stock.history[0].price) / stock.history[0].price) * 100).toFixed(2)
                                                                            : "0.00"}%)
                                                                    </span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleUnfollow(stock.ticker)}
                                                >
                                                    Unfollow
                                                </button>
                                            </div>

                                            {/* Chart */}
                                            {stock.loading ? (
                                                <div className="text-center py-4">
                                                    <div className="spinner-border text-success spinner-border-sm" />
                                                    <p className="mt-2 text-muted small">Loading chart...</p>
                                                </div>
                                            ) : stock.error ? (
                                                <div className="alert alert-warning py-2 small">
                                                    {stock.error}
                                                </div>
                                            ) : (
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <LineChart
                                                        data={stock.history}
                                                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                        <XAxis
                                                            dataKey="date"
                                                            tick={{ fontSize: 10 }}
                                                            tickFormatter={(val) => val.slice(5)}
                                                            interval={6}
                                                        />
                                                        <YAxis
                                                            domain={["auto", "auto"]}
                                                            tick={{ fontSize: 10 }}
                                                            tickFormatter={(val) => `$${val}`}
                                                            width={55}
                                                        />
                                                        <Tooltip
                                                            formatter={(val: number) => [`$${val.toFixed(2)}`, "Price"]}
                                                            labelFormatter={(label) => `Date: ${label}`}
                                                            contentStyle={{
                                                                borderRadius: "8px",
                                                                border: `1px solid ${chartColor}`,
                                                                fontSize: "12px"
                                                            }}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="price"
                                                            stroke={chartColor}
                                                            strokeWidth={2}
                                                            dot={false}
                                                            activeDot={{ r: 4, fill: chartColor }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            )}

                                            <p className="text-muted small text-center mt-1 mb-0">
                                                Last 30 days
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default MyStocks;