// src/pages/BoardPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AiOutlineRollback, AiOutlineHome } from "react-icons/ai"; // Icons

const defaultTeam = [{ name: "Team 1", score: 0, id: "default_team_1" }]; // Fallback Team

function BoardPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [teams, setTeams] = useState(defaultTeam);
  const [currentRoundData, setCurrentRoundData] = useState(null); // Hält die Daten der aktuellen Runde
  const [answeredQuestions, setAnsweredQuestions] = useState({}); // { questionId: true }
  const [isLoading, setIsLoading] = useState(true);

  // Laden der Teamdaten (aus Navigation State oder sessionStorage)
  useEffect(() => {
    const navTeams = location.state?.teams;
    if (navTeams && navTeams.length > 0) {
      setTeams(navTeams.map((t) => ({ ...t, score: t.score || 0 }))); // Scores initialisieren
      sessionStorage.setItem(
        "jeopardyTeams",
        JSON.stringify(navTeams.map((t) => ({ ...t, score: t.score || 0 })))
      );
    } else {
      const sessionTeams = sessionStorage.getItem("jeopardyTeams");
      try {
        const parsedSessionTeams = JSON.parse(sessionTeams);
        if (parsedSessionTeams && parsedSessionTeams.length > 0) {
          setTeams(parsedSessionTeams);
        } else {
          // Wenn nichts da ist, verwende Default oder navigiere zur Team-Setup-Seite
          // Für dieses Beispiel bleiben wir beim Default, aber eine Navigation wäre besser.
          setTeams(defaultTeam);
          if (!location.state?.teams) {
            // Verhindere Loop, falls von TeamSetup ohne Daten gekommen
            console.warn(
              "Keine Teamdaten gefunden, verwende Standardteams. Erwägen Sie, zur Team-Setup-Seite zu navigieren."
            );
          }
        }
      } catch (e) {
        console.error("Fehler beim Parsen der Teamdaten aus sessionStorage", e);
        setTeams(defaultTeam);
      }
    }
  }, [location.state?.teams]);

  // Laden der Fragendaten und des "beantwortet"-Status
  useEffect(() => {
    setIsLoading(true);
    try {
      const allRoundsSaved = localStorage.getItem("jeopardyQuestionsRounds");
      if (allRoundsSaved) {
        const parsedRounds = JSON.parse(allRoundsSaved);
        if (parsedRounds && parsedRounds.length > 0) {
          // Wir nehmen die erste Runde für das Board
          // Stellen sicher, dass die Struktur der ersten Runde gültig ist
          if (
            parsedRounds[0] &&
            parsedRounds[0].categories &&
            Array.isArray(parsedRounds[0].categories)
          ) {
            setCurrentRoundData(parsedRounds[0]);
          } else {
            console.error("Die erste Runde hat eine ungültige Struktur.");
            setCurrentRoundData(null); // oder eine Fallback-Struktur
          }
        } else {
          setCurrentRoundData(null); // Keine Runden gespeichert
        }
      } else {
        setCurrentRoundData(null); // Keine Daten im localStorage
      }

      const savedAnswered = sessionStorage.getItem("jeopardyAnsweredQuestions");
      if (savedAnswered) {
        setAnsweredQuestions(JSON.parse(savedAnswered));
      }
    } catch (error) {
      console.error("Fehler beim Laden der Board-Daten:", error);
      setCurrentRoundData(null); // Setze auf null bei Fehler
    }
    setIsLoading(false);
  }, []);

  // Effekt, um den "answered" Status zu aktualisieren, wenn von QuestionPage zurücknavigiert wird
  useEffect(() => {
    if (location.state?.lastAnsweredQuestionId) {
      setAnsweredQuestions((prev) => ({
        ...prev,
        [location.state.lastAnsweredQuestionId]: true,
      }));
      // Optional: Entferne lastAnsweredQuestionId aus dem location state, um Mehrfachausführung zu vermeiden
      // navigate(location.pathname, { replace: true, state: { ...location.state, lastAnsweredQuestionId: undefined } });
    }
  }, [location.state?.lastAnsweredQuestionId]);

  const handleQuestionSelect = (categoryIndex, questionIndex) => {
    if (!currentRoundData) return;
    const question =
      currentRoundData.categories[categoryIndex].questions[questionIndex];

    if (!answeredQuestions[question.id]) {
      navigate(`/question/${currentRoundData.id}/${question.id}`, {
        // Verwende Runden-ID und Fragen-ID für die Route
        state: {
          questionData: question,
          teamsData: teams,
          roundId: currentRoundData.id, // Übergebe Runden-ID
          // categoryIndex und questionIndex sind weniger robust, wenn sich Daten ändern
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-green-300 to-emerald-300 text-black flex items-center justify-center p-8">
        <p className="text-xl text-emerald-900">Lade Jeopardy Board...</p>
      </div>
    );
  }

  if (!currentRoundData || currentRoundData.categories.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-green-300 to-emerald-300 text-black flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-3xl font-bold text-emerald-900 mb-6">
          Jeopardy Board
        </h1>
        <p className="text-xl text-emerald-800 mb-4">
          Keine Fragenrunden gefunden.
        </p>
        <p className="mb-6 text-emerald-700">
          Bitte erstellen oder konfigurieren Sie zuerst Fragensets im{" "}
          <Link
            to="/fragen"
            className="font-semibold underline hover:text-emerald-900"
          >
            Fragen-Editor
          </Link>
          .
        </p>
        <Link to="/" className="mt-4">
          <button className="flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-md transition-colors">
            <AiOutlineHome className="mr-2" /> Zurück zur Startseite
          </button>
        </Link>
      </div>
    );
  }

  // Stelle sicher, dass categories eine Array ist, bevor auf length zugegriffen wird
  const gridCols = currentRoundData.categories
    ? currentRoundData.categories.length
    : 0;

  return (
    <motion.div
      className="min-h-screen w-full bg-gradient-to-br from-green-300 to-emerald-300 text-black flex flex-col p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-auto">
        {" "}
        {/* Sorgt dafür, dass der Footer unten bleibt, wenn der Inhalt kürzer ist */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 sm:mb-10 text-center text-emerald-900 tracking-tight">
          {currentRoundData.name || "Jeopardy Board"}
        </h1>
        {/* Team Scores */}
        <div className="flex flex-wrap justify-center gap-4 mb-6 sm:mb-10 text-sm sm:text-base">
          {teams.map(
            (
              team // Verwende team.id als Key, wenn vorhanden
            ) => (
              <div
                key={team.id || team.name}
                className="p-3 bg-white bg-opacity-70 rounded-lg shadow-md border border-emerald-300 min-w-[120px] text-center"
              >
                <span className="font-semibold block text-emerald-800">
                  {team.name}
                </span>
                <span className="text-green-700 font-bold text-lg">
                  {team.score || 0}
                </span>
              </div>
            )
          )}
        </div>
        {/* Questions Grid */}
        {gridCols > 0 ? (
          <div
            className={`grid gap-2 sm:gap-3 flex-grow`}
            style={{
              gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
            }}
          >
            {currentRoundData.categories.map((category, catIndex) => (
              <div
                key={category.id || catIndex}
                className="flex flex-col gap-2 sm:gap-3"
              >
                <div className="bg-emerald-700 text-white text-center p-2 sm:p-3 rounded-md shadow-md">
                  <h2 className="font-bold text-xs sm:text-sm md:text-base break-words">
                    {category.name}
                  </h2>
                </div>
                {category.questions &&
                  category.questions.map((q, qIndex) => (
                    <motion.button
                      key={q.id}
                      onClick={() => handleQuestionSelect(catIndex, qIndex)}
                      disabled={answeredQuestions[q.id]}
                      className={`p-3 sm:p-4 h-16 sm:h-20 flex items-center justify-center text-center rounded-md shadow-md font-bold transition-all duration-200 ease-in-out
                                text-base sm:text-lg md:text-xl
                                ${
                                  answeredQuestions[q.id]
                                    ? "bg-gray-400 text-gray-600 cursor-not-allowed border-2 border-gray-500"
                                    : "bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-emerald-600 hover:border-emerald-700 focus:ring-4 focus:ring-green-400 transform hover:scale-105"
                                }`}
                      whileHover={{ scale: answeredQuestions[q.id] ? 1 : 1.03 }}
                      whileTap={{ scale: answeredQuestions[q.id] ? 1 : 0.97 }}
                    >
                      {answeredQuestions[q.id] ? "---" : `$${q.points}`}
                    </motion.button>
                  ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-emerald-700">
            Keine Kategorien in dieser Runde gefunden.
          </p>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <Link to="/">
          <button className="flex items-center px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-md shadow-md transition-colors">
            <AiOutlineRollback className="mr-2" /> Spiel Beenden / Startseite
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

export default BoardPage;
