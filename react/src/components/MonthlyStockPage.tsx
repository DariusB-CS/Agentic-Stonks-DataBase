import React from "react";
import { useState, useEffect } from "react";

const MonthlyStockPage = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/userStocks")
      .then((res) => res.json())
      .then((data) => {
        setStocks(data.stocks);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);
  return (
    <div>
      <h1>Monthly Stock Data</h1>
      <p>The monthly trends of tracked stocks</p>
    </div>
  );
};

export default MonthlyStockPage;
