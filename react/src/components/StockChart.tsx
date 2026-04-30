import { useState, useEffect } from "react";
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

interface Props {
  ticker: string;
  onClose: () => void;
}

// Mock historical data generator for testing without backend
const generateMockHistory = (ticker: string): ChartData[] => {
  const history: ChartData[] = [];
  const basePrice: Record<string, number> = {
    AAPL: 255,
    TSLA: 250,
    MSFT: 420,
    NVDA: 180,
    NFLX: 90,
    SOFI: 18,
    MARA: 9,
    GOOGL: 170,
    AMZN: 200,
    META: 505,
    AMD: 145,
    PYPL: 67,
    INTC: 22,
    NU: 15,
    PSKY: 12,
  };
  let price = basePrice[ticker] || 100;
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    price += (Math.random() - 0.48) * (price * 0.02);
    history.push({
      date: date.toISOString().split("T")[0],
      price: Math.round(price * 100) / 100,
    });
  }
  return history;
};

function StockChart({ ticker, onClose }: Props) {
  const [history, setHistory] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    fetch(`/api/userStocks`)
      .then((res) => res.json())
      .then((data) => {
        setHistory(data.history);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load chart data.");
        setLoading(false);
      });
  }, [ticker]);

  const isPositive =
    history.length > 1 && history[history.length - 1].price >= history[0].price;

  const chartColor = isPositive ? "#2d5e12" : "#dc3545";

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "8px",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginTop: "8px",
      }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 style={{ color: "#2d5e12", margin: 0 }}>
            📈 {ticker} — Last 30 Days
          </h5>
          {!loading && history.length > 1 && (
            <small style={{ color: isPositive ? "#2d5e12" : "#dc3545" }}>
              {isPositive ? "▲" : "▼"}{" "}
              {Math.abs(
                history[history.length - 1].price - history[0].price,
              ).toFixed(2)}{" "}
              (
              {(
                ((history[history.length - 1].price - history[0].price) /
                  history[0].price) *
                100
              ).toFixed(2)}
              %) over 30 days
            </small>
          )}
        </div>
        <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
          ✕ Close
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-success" role="status" />
          <p className="mt-2 text-muted">Loading chart...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={history}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(val) => val.slice(5)}
              interval={4}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 11 }}
              tickFormatter={(val) => `$${val}`}
              width={60}
            />
            <Tooltip
              formatter={(val: number) => [`$${val.toFixed(2)}`, "Price"]}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                borderRadius: "8px",
                border: `1px solid ${chartColor}`,
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: chartColor }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default StockChart;
