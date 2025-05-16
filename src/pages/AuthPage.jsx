// src/pages/AuthPage.jsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom"; // useLocation importieren
import { motion } from "framer-motion";
import {
  AiOutlineLogin,
  AiOutlineUserAdd,
  AiOutlineArrowLeft,
} from "react-icons/ai";
import { FaUserSecret } from "react-icons/fa"; // Icon für anonymen Login

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(() => {
    // Optional: Modus aus URL-Parametern lesen, z.B. /auth?mode=signup
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "signup";
  });
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false); // Separater Ladezustand für anonymen Login
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const { signUp, signIn, signInAnonymously } = useAuth(); // signInAnonymously aus dem Context holen
  const navigate = useNavigate();
  const location = useLocation(); // Für die Weiterleitung nach dem Login

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // Ziel-URL nach erfolgreichem Login/Signup
    const from = location.state?.from?.pathname || "/teamSetup";

    try {
      let response;
      if (isSignUp) {
        response = await signUp({ email, password });
        if (response.error) throw response.error;
        if (
          response.data.user &&
          response.data.user.identities &&
          response.data.user.identities.length === 0
        ) {
          setMessage(
            "Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse, um sich anzumelden."
          );
        } else if (response.data.session) {
          setMessage("Registrierung erfolgreich! Sie werden weitergeleitet...");
          navigate(from, { replace: true });
        } else {
          setMessage(
            "Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse, um sich anzumelden."
          );
        }
      } else {
        response = await signIn({ email, password });
        if (response.error) throw response.error;
        if (response.data.session) {
          navigate(from, { replace: true });
        } else {
          setError("Login fehlgeschlagen. Bitte versuchen Sie es erneut.");
        }
      }
    } catch (err) {
      setError(err.message || "Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setAuthLoading(true);
    setError("");
    setMessage("");
    const from = location.state?.from?.pathname || "/teamSetup";

    try {
      const { data, error } = await signInAnonymously();
      if (error) throw error;
      // data.user und data.session sollten bei Erfolg vorhanden sein
      if (data.user && data.session) {
        // console.log("Anonymer Benutzer:", data.user);
        // console.log("Anonyme Session:", data.session);
        navigate(from, { replace: true });
      } else {
        setError(
          "Anonymer Login fehlgeschlagen. Bitte versuchen Sie es erneut."
        );
      }
    } catch (err) {
      setError(
        err.message || "Ein Fehler ist beim anonymen Login aufgetreten."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen w-full bg-gradient-to-br from-green-300 to-emerald-300 text-black flex flex-col items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-md p-8 bg-white bg-opacity-80 rounded-xl shadow-2xl border border-emerald-300">
        <h1 className="text-3xl font-bold mb-6 text-center text-emerald-900">
          {isSignUp ? "Konto Erstellen" : "Anmelden"}
        </h1>

        {error && (
          <p className="mb-4 text-center text-red-600 bg-red-100 p-2 rounded-md">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-4 text-center text-green-700 bg-green-100 p-2 rounded-md">
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* E-Mail und Passwort Felder bleiben gleich */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-emerald-700"
            >
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full p-3 bg-white border border-emerald-500 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-emerald-700"
            >
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full p-3 bg-white border border-emerald-500 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-black"
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading || authLoading}
            className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-md transition-colors disabled:bg-emerald-400"
            whileHover={{ scale: loading || authLoading ? 1 : 1.03 }}
            whileTap={{ scale: loading || authLoading ? 1 : 0.97 }}
          >
            {loading ? (
              isSignUp ? (
                "Registriere..."
              ) : (
                "Melde an..."
              )
            ) : isSignUp ? (
              <>
                <AiOutlineUserAdd className="mr-2" /> Registrieren
              </>
            ) : (
              <>
                <AiOutlineLogin className="mr-2" /> Anmelden
              </>
            )}
          </motion.button>
        </form>
        <p className="mt-6 text-center text-sm">
          {isSignUp ? "Bereits ein Konto?" : "Noch kein Konto?"}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setMessage("");
            }}
            className="ml-1 font-semibold text-emerald-700 hover:text-emerald-900 underline"
            disabled={authLoading || loading}
          >
            {isSignUp ? "Hier anmelden" : "Hier registrieren"}
          </button>
        </p>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-400"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-sm">ODER</span>
          <div className="flex-grow border-t border-gray-400"></div>
        </div>

        {/* Button für anonymen Login */}
        <motion.button
          type="button"
          onClick={handleAnonymousSignIn}
          disabled={loading || authLoading} // Auch hier loading Status berücksichtigen
          className="w-full flex items-center justify-center px-4 py-3 bg-slate-500 hover:bg-slate-600 text-white font-semibold rounded-md shadow-md transition-colors disabled:bg-slate-400"
          whileHover={{ scale: loading || authLoading ? 1 : 1.03 }}
          whileTap={{ scale: loading || authLoading ? 1 : 0.97 }}
        >
          {authLoading ? (
            "Lade Gast-Session..."
          ) : (
            <>
              <FaUserSecret className="mr-2" /> Als Gast spielen
            </>
          )}
        </motion.button>
      </div>
      <Link to="/" className="mt-8">
        <motion.button
          className="flex items-center px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-md shadow-md transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AiOutlineArrowLeft className="mr-2" />
          Zurück zur Startseite
        </motion.button>
      </Link>
    </motion.div>
  );
}

export default AuthPage;
