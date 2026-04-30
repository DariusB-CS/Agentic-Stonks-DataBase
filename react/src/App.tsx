import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import StockTicker from "./components/StockTicker";
import Banner from "./components/Banner";
import "./App.css";
import MonthlyStockPage from "./components/MonthlyStockPage";
import StockChart from "./components/StockChart";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home page with login */}
        <Route
          path="/"
          element={
            <div>
              <StockTicker />
              <Banner />
              <div className="container text-center">
                <div className="row">
                  <div className="col myCol">
                    <h2>Stock Images</h2>
                  </div>
                  <div className="col myCol">
                    <h2>Login:</h2>
                    <img
                      src="./src/assets/stock_bear.gif"
                      className="img-fluid"
                      style={{ width: "50%", height: "auto" }}
                    />
                    <Login />
                  </div>
                </div>
              </div>
            </div>
          }
        />

        {/* Dashboard after login */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/stockChart" element={<StockChart />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
