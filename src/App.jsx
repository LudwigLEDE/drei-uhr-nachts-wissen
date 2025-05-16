// src/App.jsx
import React, { useEffect } from "react"; // React und useEffect importiert
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./contexts/AuthContext";
import {
  AiOutlineLogin,
  AiOutlineLogout,
  AiOutlineUser,
  AiOutlineEdit,
  AiOutlineSetting,
  AiOutlineHome,
  AiOutlineTeam,
  AiOutlineLayout,
  AiOutlineQuestionCircle,
} from "react-icons/ai"; // Beispiel-Icons

// Seiten-Imports (stellen Sie sicher, dass diese Pfade korrekt sind)
import Start from "./pages/Start";
import TeamSetupPage from "./pages/TeamSetupPage";
import QuestionEditPage from "./pages/QuestionEditPage"; // Ihr Pfad für "/fragen"
import Settings from "./pages/Settings";
import BoardPage from "./pages/BoardPage";
import AuthPage from "./pages/AuthPage";
// Falls Sie die QuestionPage (für die Anzeige einzelner Fragen im Spiel) verwenden:
// import QuestionPage from "./pages/QuestionPage";

// Komponente für geschützte Routen (Helper Component)
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Die aktuelle Location, zu der der Benutzer navigieren wollte

  // Dieser useEffect wird bei jedem Rendern von ProtectedRoute aufgerufen (nach dem Commit).
  // Die Logik *innerhalb* des Effekts ist jedoch konditional.
  useEffect(() => {
    // Wir leiten nur weiter, wenn der Ladevorgang abgeschlossen ist UND kein Benutzer vorhanden ist.
    if (!loading && !user) {
      // console.log("ProtectedRoute: Kein Benutzer, Weiterleitung zu /auth von:", location.pathname);
      navigate("/auth", { state: { from: location }, replace: true });
    }
  }, [loading, user, navigate, location]); // Abhängigkeiten des Effekts

  // Während des Ladens eine Nachricht anzeigen.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-green-300 to-emerald-300">
        <p className="text-xl text-emerald-900">
          Benutzerdaten werden geladen...
        </p>
      </div>
    );
  }

  // Wenn der Ladevorgang abgeschlossen ist und ein Benutzer vorhanden ist, die Kinder rendern.
  if (user) {
    return children;
  }

  // Wenn der Ladevorgang abgeschlossen ist, aber kein Benutzer vorhanden ist,
  // wird der useEffect oben die Weiterleitung auslösen.
  // In der Zwischenzeit nichts oder eine "Weiterleitung..."-Nachricht rendern, um Flackern zu vermeiden.
  // console.log("ProtectedRoute: Kein Benutzer, warte auf Weiterleitung durch useEffect.");
  return null; // Oder eine Ladeanzeige wie <p>Weiterleitung...</p>
}

function App() {
  const location = useLocation();
  const { user, signOut, loading: authLoading } = useAuth(); // authLoading um Namenskonflikte zu vermeiden
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/"); // Zurück zur Startseite nach dem Logout
    } catch (error) {
      console.error("Fehler beim Logout:", error);
      // Hier könnten Sie dem Benutzer eine Fehlermeldung anzeigen
    }
  };

  // Navigation ausblenden auf bestimmten Seiten (z.B. AuthPage)
  const hideNav = location.pathname === "/auth";

  return (
    <div className="flex flex-col min-h-screen">
      {" "}
      {/* Stellt sicher, dass ein Footer (falls vorhanden) unten bleibt */}
      {!hideNav && (
        <nav className="bg-emerald-800 p-3 sm:p-4 text-white sticky top-0 z-50 shadow-lg">
          <ul className="container mx-auto flex flex-wrap gap-x-4 gap-y-2 sm:gap-x-6 justify-between items-center">
            <li className="flex-shrink-0">
              <Link
                to="/"
                className="hover:text-green-300 text-base sm:text-lg font-semibold flex items-center"
              >
                <AiOutlineHome className="inline mr-1 sm:mr-2" /> Quiz Home
              </Link>
            </li>

            <div className="flex flex-wrap gap-x-3 gap-y-2 sm:gap-x-4 items-center order-3 sm:order-2 w-full sm:w-auto justify-center mt-2 sm:mt-0">
              {user &&
                !authLoading && ( // Links, die einen eingeloggten Benutzer erfordern und wenn nicht gerade geladen wird
                  <>
                    <li>
                      <Link
                        to="/teamSetup"
                        className="hover:text-green-300 font-medium text-sm sm:text-base flex items-center"
                      >
                        <AiOutlineTeam className="inline mr-1 sm:mr-2" /> Teams
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/board"
                        className="hover:text-green-300 font-medium text-sm sm:text-base flex items-center"
                      >
                        <AiOutlineLayout className="inline mr-1 sm:mr-2" />{" "}
                        Spielbrett
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/fragen"
                        className="hover:text-yellow-300 font-medium text-sm sm:text-base flex items-center"
                      >
                        <AiOutlineEdit className="inline mr-1 sm:mr-2" />{" "}
                        Fragen-Editor
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/settings"
                        className="hover:text-gray-300 font-medium text-sm sm:text-base flex items-center"
                      >
                        <AiOutlineSetting className="inline mr-1 sm:mr-2" />{" "}
                        Settings
                      </Link>
                    </li>
                  </>
                )}
              {!user &&
                !authLoading && ( // Wenn nicht eingeloggt und nicht am Laden
                  <li>
                    <Link
                      to="/auth?mode=signup"
                      className="hover:text-green-300 font-medium text-sm sm:text-base flex items-center"
                    >
                      <AiOutlineQuestionCircle className="inline mr-1 sm:mr-2" />{" "}
                      Spiel beginnen? (Registrieren)
                    </Link>
                  </li>
                )}
            </div>

            <li className="flex-shrink-0 order-2 sm:order-3 ml-auto sm:ml-0">
              {authLoading && (
                <span className="text-xs text-gray-400">Lade...</span>
              )}
              {!authLoading && user ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <span
                    className="text-xs sm:text-sm text-gray-300 hidden md:flex items-center"
                    title={user.email}
                  >
                    <AiOutlineUser className="inline mr-1" />{" "}
                    {user.email.length > 15
                      ? `${user.email.substring(0, 15)}...`
                      : user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center bg-red-500 hover:bg-red-600 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm transition-colors"
                    title="Logout"
                  >
                    <AiOutlineLogout className="mr-0 sm:mr-1" />{" "}
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              ) : (
                !authLoading && (
                  <Link
                    to="/auth"
                    className="flex items-center bg-green-500 hover:bg-green-600 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm transition-colors"
                  >
                    <AiOutlineLogin className="mr-1 sm:mr-2" /> Login/Register
                  </Link>
                )
              )}
            </li>
          </ul>
        </nav>
      )}
      <main className="flex-grow">
        {" "}
        {/* Stellt sicher, dass main den verfügbaren Platz einnimmt */}
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Öffentliche Routen */}
            <Route path="/" element={<Start />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Geschützte Routen basierend auf Ihren Pfaden */}
            <Route
              path="/teamSetup"
              element={
                <ProtectedRoute>
                  <TeamSetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fragen"
              element={
                <ProtectedRoute>
                  <QuestionEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/board"
              element={
                <ProtectedRoute>
                  <BoardPage />
                </ProtectedRoute>
              }
            />

            {/* Beispiel für die QuestionPage Route, falls Sie sie noch hinzufügen:
            <Route 
              path="/question/:roundId/:questionId" 
              element={
                <ProtectedRoute>
                  <QuestionPage />
                </ProtectedRoute>
              } 
            />
            */}
          </Routes>
        </AnimatePresence>
      </main>
      {/* Optional: Ein globaler Footer hier */}
      {/* <footer className="p-4 bg-emerald-900 text-emerald-200 text-center text-xs mt-auto">
        © {new Date().getFullYear()} Quiz Show App
      </footer> 
      */}
    </div>
  );
}

export default App;
