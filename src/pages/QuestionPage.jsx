// src/pages/QuestionPage.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

function QuestionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId, questionId } = useParams(); // Falls IDs direkt aus URL kommen

  // Frage- und Teamdaten aus dem Navigationsstate oder Standardwerte
  const [questionData, setQuestionData] = useState(
    location.state?.questionData
  );
  const [teams, setTeams] = useState(location.state?.teamsData || []);
  const [showAnswer, setShowAnswer] = useState(false);

  const catIndex = location.state?.categoryIndex;
  const qIndex = location.state?.questionIndex;

  useEffect(() => {
    if (!questionData) {
      // Lade Daten, falls nicht über State übergeben (z.B. bei direktem Aufruf der URL)
      // Dies ist eine Vereinfachung. Normalerweise würden Sie die Daten hier basierend auf categoryId/questionId fetchen.
      // Und auch den Board-Status aktualisieren.
      console.warn(
        "Keine Fragendaten beim direkten Aufruf gefunden. Zurück zum Board."
      );
      navigate("/board");
    }
  }, [questionData, navigate, categoryId, questionId]);

  const handleAwardPoints = (teamIndex, points) => {
    const updatedTeams = teams.map((team, idx) => {
      if (idx === teamIndex) {
        return { ...team, score: (team.score || 0) + points };
      }
      return team;
    });
    setTeams(updatedTeams);
    // Markiere Frage als beantwortet und navigiere zurück
    markQuestionAsAnsweredAndReturn(updatedTeams);
  };

  const handleNoAward = () => {
    markQuestionAsAnsweredAndReturn(teams); // Keine Punkteänderung, nur als beantwortet markieren
  };

  const markQuestionAsAnsweredAndReturn = (currentTeams) => {
    // Lade das aktuelle Board aus dem Session Storage
    const boardString = sessionStorage.getItem("jeopardyBoard");
    let board = boardString ? JSON.parse(boardString) : null; // initialCategories wenn nichts da ist (besser aus props/context)

    if (board && board[catIndex] && board[catIndex].questions[qIndex]) {
      board[catIndex].questions[qIndex].answered = true;
      sessionStorage.setItem("jeopardyBoard", JSON.stringify(board));
    } else {
      // Fallback: Wenn das Board nicht im Session Storage ist,
      // versuchen wir, ein "frisches" Board zu nehmen und es zu aktualisieren.
      // Dies ist nicht ideal und zeigt die Notwendigkeit eines besseren State Managements.
      console.warn(
        "Board nicht im Session Storage gefunden. Verwende initialCategories."
      );
      // let tempBoard = JSON.parse(JSON.stringify(initialCategories)); // Tiefe Kopie
      // if (tempBoard[catIndex] && tempBoard[catIndex].questions[qIndex]) {
      //    tempBoard[catIndex].questions[qIndex].answered = true;
      //    sessionStorage.setItem('jeopardyBoard', JSON.stringify(tempBoard));
      // }
    }
    sessionStorage.setItem("jeopardyTeams", JSON.stringify(currentTeams));
    navigate("/board", { state: { teams: currentTeams } }); // Teams-Daten für BoardPage aktualisieren
  };

  if (!questionData) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        Frage wird geladen...
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen w-full bg-gradient-to-br from-indigo-700 to-purple-800 text-white flex flex-col items-center justify-center p-6 sm:p-10"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-3xl bg-slate-800 p-6 sm:p-10 rounded-xl shadow-2xl">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-2 text-cyan-300">
          Frage für ${questionData.points}
        </h2>
        <motion.p
          className="text-xl sm:text-2xl md:text-3xl min-h-[100px] sm:min-h-[150px] flex items-center justify-center text-center mb-8 p-4 bg-slate-700 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {questionData.text}
        </motion.p>

        {!showAnswer && (
          <motion.button
            onClick={() => setShowAnswer(true)}
            className="w-full mb-8 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold text-lg rounded-lg shadow-md transition-colors transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Antwort Anzeigen
          </motion.button>
        )}

        {showAnswer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h3 className="text-xl sm:text-2xl font-semibold mb-2 text-green-400">
              Antwort:
            </h3>
            <p className="text-lg sm:text-xl md:text-2xl p-4 bg-slate-700 rounded-lg min-h-[60px] flex items-center justify-center text-center">
              {questionData.answer}
            </p>
          </motion.div>
        )}

        {showAnswer && (
          <div className="mt-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-center">
              Punkte vergeben:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teams.map((team, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleAwardPoints(index, questionData.points)}
                  className="px-5 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-base sm:text-lg font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {team.name} hat Recht (+{questionData.points})
                </motion.button>
              ))}
            </div>
            <motion.button
              onClick={handleNoAward}
              className="w-full mt-4 px-5 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-base sm:text-lg font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Niemand hat Recht / Weiter
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default QuestionPage;
