// src/pages/TeamSetupPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; // Link importieren
import { motion, AnimatePresence } from "framer-motion";
import {
  AiOutlineClose,
  AiOutlinePlus,
  AiOutlineArrowLeft,
} from "react-icons/ai"; // AiOutlineArrowLeft importieren

let nextId = 0;
const getSessionUniqueId = () => nextId++;

function TeamSetupPage() {
  const initialTeams = () => [
    { id: getSessionUniqueId(), name: "", score: 0 },
    { id: getSessionUniqueId(), name: "", score: 0 },
  ];

  const [teams, setTeams] = useState(initialTeams);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTeamsData = localStorage.getItem("quizTeams");
    if (savedTeamsData) {
      try {
        const parsedTeams = JSON.parse(savedTeamsData);
        if (Array.isArray(parsedTeams) && parsedTeams.length > 0) {
          setTeams(
            parsedTeams.map((team) => ({
              id: getSessionUniqueId(),
              name: team.name,
              score: team.score || 0,
            }))
          );
        } else if (Array.isArray(parsedTeams) && parsedTeams.length === 0) {
          setTeams([{ id: getSessionUniqueId(), name: "", score: 0 }]);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Teams aus localStorage:", error);
        setTeams(initialTeams());
      }
    }
  }, []);

  const handleTeamNameChange = (indexInArray, event) => {
    const newTeams = teams.map((team, i) => {
      if (i === indexInArray) {
        return { ...team, name: event.target.value };
      }
      return team;
    });
    setTeams(newTeams);
  };

  const addTeam = () => {
    setTeams([...teams, { id: getSessionUniqueId(), name: "", score: 0 }]);
  };

  const removeTeam = (idToRemove) => {
    const newTeams = teams.filter((team) => team.id !== idToRemove);
    if (newTeams.length === 0) {
      setTeams([{ id: getSessionUniqueId(), name: "", score: 0 }]);
    } else {
      setTeams(newTeams);
    }
  };

  const startGame = () => {
    if (teams.length === 0) {
      alert("Bitte fügen Sie zuerst mindestens ein Team hinzu.");
      return;
    }
    const allNamesFilled = teams.every((team) => team.name.trim() !== "");
    if (!allNamesFilled) {
      alert(
        "Bitte füllen Sie die Namen für alle erstellten Teams aus oder entfernen Sie leere Team-Felder."
      );
      return;
    }
    const validTeamsWithName = teams.filter((team) => team.name.trim() !== "");
    if (validTeamsWithName.length === 0) {
      alert(
        "Obwohl alle Felder geprüft wurden, konnte kein Team mit gültigem Namen gefunden werden. Bitte überprüfen Sie Ihre Eingaben."
      );
      return;
    }
    const teamsToSave = teams.map((team) => ({
      name: team.name,
      score: team.score || 0,
    }));
    try {
      localStorage.setItem("quizTeams", JSON.stringify(teamsToSave));
      const teamsForNavigation = teams.map((team) => ({
        id: team.id,
        name: team.name,
        score: team.score || 0,
      }));
      navigate("/board", { state: { teams: teamsForNavigation } });
    } catch (error) {
      console.error("Fehler beim Speichern der Teams im localStorage:", error);
      alert(
        "Die Teams konnten nicht gespeichert werden. Bitte versuchen Sie es erneut."
      );
    }
  };

  return (
    <motion.div
      className="min-h-screen w-full bg-gradient-to-br from-green-300 to-emerald-300 text-black flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 sm:mb-10 lg:mb-12 text-center tracking-tight text-emerald-900"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
      >
        TEAMS KONFIGURIEREN
      </motion.h1>

      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-6 sm:mb-8">
        <AnimatePresence>
          {teams.map((team, index) => (
            <motion.div
              key={team.id}
              layout
              className="bg-white bg-opacity-80 rounded-lg shadow-xl border border-emerald-300 flex flex-col min-h-[10rem] transition-all duration-300 ease-in-out hover:shadow-2xl"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                scale: 0.8,
                x: "-20%",
                transition: { duration: 0.3, ease: "easeOut" },
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="flex p-2.5 gap-1.5 border-b border-emerald-200">
                <button
                  onClick={() => removeTeam(team.id)}
                  title="Team entfernen"
                  disabled={teams.length <= 1 && team.name.trim() === ""}
                  className="group bg-red-500 hover:bg-red-600 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <AiOutlineClose className="w-2.5 h-2.5 text-white group-hover:text-opacity-80 transition-opacity" />
                </button>
                <span className="bg-yellow-400 inline-block w-3.5 h-3.5 rounded-full"></span>
                <span className="bg-green-500 inline-block w-3.5 h-3.5 rounded-full"></span>
              </div>
              <div className="p-3 sm:p-4 flex flex-col flex-grow space-y-2">
                <label
                  htmlFor={`team-${team.id}`}
                  className="text-xs font-bold text-emerald-700 uppercase tracking-wider"
                >
                  Team {index + 1}
                </label>
                <input
                  id={`team-${team.id}`}
                  type="text"
                  placeholder="Teamname..."
                  value={team.name}
                  onChange={(e) => handleTeamNameChange(index, e)}
                  className="w-full p-2.5 bg-white border border-emerald-400 rounded-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none placeholder-gray-400 text-black text-sm shadow-sm"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 sm:mb-10 flex-wrap">
        <motion.button
          onClick={addTeam}
          className="w-full xs:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-md shadow-md transition-colors transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75 text-sm sm:text-base"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AiOutlinePlus className="inline mr-2 mb-px" />
          Weiteres Team hinzufügen
        </motion.button>
        <motion.button
          onClick={startGame}
          className="w-full xs:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-base sm:text-lg rounded-md shadow-lg transform hover:scale-105 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
          whileHover={{
            scale: 1.05,
            boxShadow: "0px 0px 12px rgba(0, 0, 0, 0.2)",
          }}
          whileTap={{ scale: 0.95 }}
        >
          Spiel Starten!
        </motion.button>
        {/* Neuer Zurück-Button */}
        <Link to="/" className="w-full xs:w-auto">
          <motion.button
            className="w-full px-6 py-3 bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-semibold rounded-md shadow-md transition-colors transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 text-sm sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AiOutlineArrowLeft className="inline mr-2 mb-px" />
            Zurück zur Startseite
          </motion.button>
        </Link>
      </div>

      <footer className="text-center text-xs text-emerald-800 mt-auto pt-4">
        Jeopardy Style Quiz Show - Team Setup
      </footer>
    </motion.div>
  );
}
export default TeamSetupPage;
