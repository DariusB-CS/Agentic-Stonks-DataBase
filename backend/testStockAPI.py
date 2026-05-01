import yfinance as yf
import requests
import pandas as pd
import uuid
from sqlalchemy import create_engine
import bs4 as bs
from flask import Flask, request, render_template, url_for, redirect, session
from supabase import create_client, Client
import os 
from dotenv import load_dotenv, dotenv_values
import uuid
load_dotenv()

# Get the S&P 500 stock information table from the wikipedia website
headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15 Ddg/18.6'}
resp = requests.get('http://en.wikipedia.org/wiki/List_of_S%26P_500_companies', headers=headers)
soup = bs.BeautifulSoup(resp.text, 'lxml')
table = soup.find('table')

# Get all the names in the table
tickers = []
for row in table.find_all('tr')[1:]:
    ticker = row.find_all('td')[0].text
    tickers.append(ticker)
tickers = [s.replace('\n', '') for s in tickers]

# Get all the stock information using the yfinance apo
data = yf.download(tickers, period='1d', auto_adjust=False)


# Format all the information
df = data.stack().reset_index().rename(index=str, columns={"level_1": "Ticker"}).sort_values(['Ticker'])
df = df.drop("Date", axis=1)
df = df.dropna()


# ── Rename columns to match Supabase schema ──────────────────────────────────
df = df.rename(columns={
    "Ticker":    "name",
    "Close":     "price",
    "Open":      "open",
    "Volume":    "volume",
})

# Calculate change_in_price from Close - Open
df["change_in_price"] = df["price"] - df["open"]

# Placeholders for columns yfinance doesn't provide in daily data
df["market_cap"]  = None
df["p_to_e_ratio"] = None

# Keep only columns Supabase expects (drop open since it's not in schema)
df = df[["name", "price", "change_in_price", "market_cap", "volume", "p_to_e_ratio"]]

# ─────────────────────────────────────────────────────────────────────────────

# Round numeric columns to match Supabase types
df["price"] = df["price"].round(2)
df["change_in_price"] = df["change_in_price"].round(2)
df["volume"] = df["volume"].astype(int) # bigint needs whole numbers

# Get the url and key from the .env file to access the Supabase schema
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

# Upload stock data to Supabase
response = (
    supabase.table("stocks")
    .upsert(df.to_dict('records'), on_conflict="name",)
    .execute()
)


# Get users from Supabase
response = (supabase.table("users")
        .select("*")
        .execute()
)
table_df = pd.DataFrame(response.data)
# ── Flask App ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = 'nananabobo'

@app.route('/register', methods=["GET", "POST"])
def register():
    if request.method == "POST":
        # Handle both JSON and form data
        if request.is_json:
            data = request.get_json()
            email = data.get("username") or data.get("email")
            password = data.get("password")
        else:
            email = request.form.get("username") or request.form.get("email")
            password = request.form.get("password")

       

        if not email or not password:
            return {"error": "Email and password required"}, 400

        # Query Supabase directly instead of using stale table_df
        existing = (
            supabase.table("users")
            .select("*")
            .eq("email", email)
            .execute()
        )

        

        if existing.data:  # Username already exists
            return {"error": "Email already taken!"}, 409

        # Insert new user
        result = supabase.table("users").insert({
            "id": str(uuid.uuid4()),
            "email": email,
            "password": password
        }).execute()

        
        return {"success": True}, 200

    return render_template("sign_up.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        # Get the password and email
        if request.is_json:
            data = request.get_json()
            email = data.get("username") or data.get("email")
            password = data.get("password")
        else:
            email = request.form.get("username") or request.form.get("email")
            password = request.form.get("password")

       
        # Check if the email password are in the schema table
        result = (
            supabase.table("users")
            .select("*")
            .eq("email", email)
            .eq("password", password)
            .execute()
        )

        

        if result.data:
            session['username'] = email
            return {"success": True}, 200
        else:
            return {"error": "Invalid email or password"}, 401

    return render_template("login.html")



@app.route("/api/stocks")
def get_stocks(): # Give all the stock data to the frontend
    response = supabase.table("stocks").select("*").execute()
    return {"stocks": response.data}, 200

@app.route("/api/add", methods=["GET", "POST"])
def add_stocks():
    email = session.get('username')
    if request.method == "POST":
        # Get the user choice from the front end
        data = request.get_json()
        ticker = data.get("name")
        # Check if the user already chose that stock
        result = (
            supabase.table("tracked_stocks")
            .select("*")
            .eq("ticker", ticker)
            .execute()
        )
        if result.data:
            return {"Failure": False}, 401
        # If the stock has not already been chosen then add it to the table
        else:
            # Get the key from the user and stocks table
            userTable = (
                supabase.table("users")
                .select("id")
                .eq("email", email)
                .execute()
            )
            stockTable = (
                supabase.table("stocks")
                .select("id")
                .eq("name", ticker)
                .execute()
           )
            userid = userTable.data[0]['id']
            stockid = stockTable.data[0]['id']
            # Insert the information into the tracked stocks table
            result = supabase.table("tracked_stocks").insert({
                "id": str(uuid.uuid4()),
                "user_id": userid,
                "stock_id": stockid,
                "ticker": ticker
            }).execute()

            return {"success": True}, 200

    

@app.route("/api/userStocks", methods=["GET"])
def userStocks():
    email = session.get('username')
    if not email:
        return {"error": "Not logged in"}, 401
        
    userTable = (
        supabase.table("users")
        .select("id")
        .eq("email", email)
        .execute()
    )
    userid = userTable.data[0]['id']
    response = (
        supabase.table("tracked_stocks")
        .select("ticker")
        .eq("user_id", userid)
        .execute()
    )
    tickers = [row['ticker'] for row in response.data]
    return {"tickers": tickers}, 200

@app.route("/api/stock/<ticker>")
def get_stock_history(ticker):
    import datetime
    
    stock = yf.Ticker(ticker)
    hist = stock.history(period="1mo")
    
    if hist.empty:
        return {"error": "No data found"}, 404
    
    history = []
    for date, row in hist.iterrows():
        history.append({
            "date": date.strftime("%Y-%m-%d"),
            "price": round(float(row["Close"]), 2)
        })
    
    return {"history": history}, 200

@app.route("/api/unfollow", methods=["POST"])
def unfollow_stock():
    data = request.get_json()
    email = session.get('username')
    ticker = data.get("ticker")
    userTable = (
        supabase.table("users")
        .select("id")
        .eq("email", email)
        .execute()
    )
    userid = userTable.data[0]['id']
    supabase.table("tracked_stocks").delete()\
        .eq("user_id", userid)\
        .eq("ticker", ticker)\
        .execute()
    return {"success": True}, 200

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

if __name__ == "__main__":
    app.run(debug=True)
    

