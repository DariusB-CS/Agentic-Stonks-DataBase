import { useState } from "react";

type AuthMode = "login" | "signup";

function Login() {
    const [mode, setMode] = useState<AuthMode>("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setError("");
        setSuccess("");
    };

    const switchMode = (newMode: AuthMode) => {
        resetForm();
        setMode(newMode);
    };

    const handleLogin = async () => {
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                window.location.href = "/dashboard";
            } else {
                setError(data.error || "Invalid username or password.");
            }
        } catch (err) {
            setLoading(false);
            setError("Something went wrong. Please try again.");
        }
    };

    const handleSignUp = async () => {
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                setSuccess("Account created! You can now log in.");
                switchMode("login");
            } else {
                setError(data.error || "Username already taken.");
            }
        } catch (err) {
            setLoading(false);
            setError("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">

                {/* Tab Toggle */}
                <div className="d-flex mb-4">
                    <button
                        className={`btn w-50 ${mode === "login" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => switchMode("login")}
                    >
                        Login
                    </button>
                    <button
                        className={`btn w-50 ${mode === "signup" ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => switchMode("signup")}
                    >
                        Sign Up
                    </button>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <div className="mb-3">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        className="form-control"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        className="form-control"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {mode === "signup" && (
                    <div className="mb-3">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="form-control"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                )}

                <button
                    className="btn btn-primary w-100"
                    onClick={mode === "login" ? handleLogin : handleSignUp}
                    disabled={loading}
                >
                    {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
                </button>

            </div>
        </div>
    );
}

export default Login;