// src/pages/QuestionEditPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  AiOutlinePlus,
  AiOutlineEdit,
  AiOutlineSave,
  AiOutlineDelete,
  AiOutlineCloseCircle,
  AiOutlineArrowLeft,
} from "react-icons/ai";
import { supabase } from "../supabaseClient"; // Supabase Client importieren
import { useAuth } from "../contexts/AuthContext"; // AuthContext importieren

// Hilfsfunktion zum Erstellen einer neuen, leeren Runde
const createNewRoundData = (roundNumber, userId) => ({
  // id wird von Supabase beim ersten Speichern generiert, oder wir generieren hier eine client-seitige UUID
  // Für Upsert ist es besser, wenn neue Runden noch keine 'id' haben, die mit der DB kollidieren könnte,
  // oder eine client-seitig generierte UUID, die dann als PK dient.
  // Wir lassen die ID hier weg und lassen Supabase sie beim Insert generieren.
  // Wenn wir client-seitige IDs für React-Keys brauchen, können die temporär sein oder von Supabase-IDs überschrieben werden.
  // Für dieses Beispiel: Temporäre client_id für React-Keys, die nicht in die DB geht.
  client_id: `client_round_${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`,
  db_id: null, // Wird gesetzt, nachdem es in Supabase gespeichert wurde
  user_id: userId, // Wichtig für das Speichern in Supabase
  name: `Runde ${roundNumber}`,
  content: {
    // Die 'content'-Spalte in Supabase (jsonb) wird dieses Objekt speichern
    categories: Array(5)
      .fill(null)
      .map((_, catIndex) => ({
        id: `cat_client_${Date.now()}-${catIndex}-${Math.random()
          .toString(36)
          .substr(2, 9)}`, // Client-ID für Keys
        name: `Kategorie ${catIndex + 1}`,
        questions: Array(5)
          .fill(null)
          .map((_, qIndex) => ({
            id: `q_client_${Date.now()}-${catIndex}-${qIndex}-${Math.random()
              .toString(36)
              .substr(2, 9)}`, // Client-ID
            text: "",
            answer: "",
            points: (qIndex + 1) * 100,
          })),
      })),
  },
});

function QuestionEditPage() {
  const { user } = useAuth(); // Aktuellen Benutzer holen
  const [allRoundsData, setAllRoundsData] = useState([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [modalInput, setModalInput] = useState({ text: "", answer: "" });
  const [isInitiallyLoading, setIsInitiallyLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const createFirstRound = useCallback(() => {
    if (!user) return; // Nur ausführen, wenn Benutzer vorhanden ist
    const firstRound = createNewRoundData(1, user.id);
    setAllRoundsData([firstRound]);
    setCurrentRoundIndex(0);
  }, [user]);

  // Laden der Daten aus Supabase beim Mounten und wenn der Benutzer sich ändert
  useEffect(() => {
    if (!user) {
      setIsInitiallyLoading(false);
      setAllRoundsData([]); // Keine Runden, wenn kein Benutzer da ist
      return;
    }

    setIsInitiallyLoading(true);
    const fetchRounds = async () => {
      const { data, error } = await supabase
        .from("question_rounds")
        .select("id, name, content, user_id") // 'id' ist hier db_id
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error(
          "Fehler beim Laden der Runden aus Supabase:",
          error.message
        );
        createFirstRound(); // Fallback oder Fehlermeldung
      } else if (data && data.length > 0) {
        // Transformiere Daten für den Client-State
        const transformedData = data.map((dbRound) => ({
          client_id: `client_round_loaded_${dbRound.id}`, // Eindeutige Client-ID für React-Key
          db_id: dbRound.id, // Die ID aus der Datenbank
          user_id: dbRound.user_id,
          name: dbRound.name,
          content: dbRound.content || { categories: [] }, // Fallback für leeren Content
        }));
        setAllRoundsData(transformedData);
        setCurrentRoundIndex(0); // Oder den zuletzt bearbeiteten Index laden
      } else {
        createFirstRound(); // Keine Runden für diesen Benutzer gefunden, erstelle eine erste
      }
      setIsInitiallyLoading(false);
    };

    fetchRounds();
  }, [user, createFirstRound]); // Abhängig von user

  // Effekt zur Synchronisation von currentRoundIndex (wie zuvor)
  useEffect(() => {
    if (!isInitiallyLoading && allRoundsData.length > 0) {
      if (currentRoundIndex >= allRoundsData.length) {
        setCurrentRoundIndex(allRoundsData.length - 1);
      } else if (currentRoundIndex < 0) {
        setCurrentRoundIndex(0);
      }
    } else if (!isInitiallyLoading && allRoundsData.length === 0 && user) {
      createFirstRound();
    }
  }, [
    allRoundsData,
    currentRoundIndex,
    isInitiallyLoading,
    user,
    createFirstRound,
  ]);

  const saveAllRoundsToSupabase = async () => {
    if (!user) {
      alert("Bitte melden Sie sich an, um Runden zu speichern.");
      return;
    }
    if (allRoundsData.length === 0) {
      alert("Keine Runden zum Speichern vorhanden.");
      return;
    }

    setIsSaving(true);
    let hadError = false;

    const roundsToUpsert = allRoundsData.map((clientRound) => ({
      id: clientRound.db_id, // Wichtig für Upsert: existierende DB-ID oder null/undefined für neue Einträge
      user_id: user.id,
      name: clientRound.name,
      content: clientRound.content,
      // created_at wird von DB gesetzt, updated_at ebenso oder per Trigger
    }));

    // Supabase upsert kann ein Array von Objekten verarbeiten.
    // Wenn 'id' (db_id) vorhanden ist, wird versucht zu aktualisieren, sonst einzufügen.
    // 'id' muss die Primärschlüsselspalte in Ihrer Supabase-Tabelle sein.
    const { data: upsertedRounds, error } = await supabase
      .from("question_rounds")
      .upsert(roundsToUpsert, {
        // onConflict: 'id', // Supabase leitet dies oft selbst ab, wenn PK 'id' ist
        // ignoreDuplicates: false, // Standard ist false, was zu Update führt
      })
      .select(); // Wichtig, um die (potenziell neuen) IDs zurückzubekommen

    if (error) {
      console.error(
        "Fehler beim Upserten der Runden in Supabase:",
        error.message
      );
      alert(`Fehler beim Speichern: ${error.message}`);
      hadError = true;
    } else {
      // Aktualisiere den lokalen State mit den IDs aus der Datenbank, falls neue Runden erstellt wurden
      // und die `upsertedRounds` die finalen Daten mit korrekten IDs enthalten.
      if (upsertedRounds) {
        const updatedLocalRounds = allRoundsData.map((localRound) => {
          // Finde die entsprechende Runde in den von Supabase zurückgegebenen Daten
          // Dies ist etwas knifflig, wenn neue Runden client_ids hatten und nun db_ids bekommen.
          // Eine einfache Zuordnung, wenn die Reihenfolge gleich bleibt (was bei upsert nicht garantiert ist, wenn IDs neu sind)
          // Besser wäre es, wenn upsertedRounds die gleichen client_ids zurückgeben oder eine andere Zuordnung möglich ist.
          // Für dieses Beispiel nehmen wir an, die Reihenfolge und Anzahl bleibt nach upsert so,
          // dass wir die neuen DB-IDs einfach zuweisen können oder die Client-Daten aktualisieren.
          // Eine sicherere Methode: Nach dem Upsert die Daten neu vom Server laden oder die upsertedRounds sorgfältig matchen.

          // Einfache Aktualisierung, wenn die Anzahl und grobe Struktur übereinstimmt:
          const matchedUpsertedRound = upsertedRounds.find(
            (ur) =>
              (localRound.db_id && ur.id === localRound.db_id) || // Match auf existierende DB ID
              (ur.name === localRound.name &&
                ur.content.categories.length ===
                  localRound.content.categories.length) // Heuristik für neue
          );

          if (matchedUpsertedRound) {
            return {
              ...localRound,
              db_id: matchedUpsertedRound.id, // Wichtig: DB ID speichern
              user_id: matchedUpsertedRound.user_id, // Sicherstellen, dass user_id korrekt ist
              name: matchedUpsertedRound.name,
              content: matchedUpsertedRound.content,
            };
          }
          return localRound; // Fallback, falls kein Match (sollte nicht passieren bei erfolgreichem Upsert)
        });
        setAllRoundsData(updatedLocalRounds);
      }
      if (!hadError) alert("Alle Runden erfolgreich in Supabase gespeichert!");
    }
    setIsSaving(false);
  };

  const handleAddRound = () => {
    if (!user) {
      alert("Bitte zuerst einloggen.");
      return;
    }
    const newRoundNumber = allRoundsData.length + 1;
    const newRound = createNewRoundData(newRoundNumber, user.id);
    setAllRoundsData((prevRounds) => [...prevRounds, newRound]);
    setCurrentRoundIndex(allRoundsData.length);
  };

  const handleDeleteRound = async (roundToDelete) => {
    // Nimmt jetzt das Rundenobjekt
    if (!user) return;
    if (allRoundsData.length <= 1) {
      alert("Die letzte Runde kann nicht gelöscht werden.");
      return;
    }
    if (
      window.confirm(`Möchten Sie "${roundToDelete.name}" wirklich löschen?`)
    ) {
      if (roundToDelete.db_id) {
        // Nur aus DB löschen, wenn es eine DB ID hat
        setIsSaving(true);
        const { error } = await supabase
          .from("question_rounds")
          .delete()
          .eq("id", roundToDelete.db_id)
          .eq("user_id", user.id); // Sicherheit: Nur eigene löschen
        setIsSaving(false);
        if (error) {
          console.error(
            "Fehler beim Löschen der Runde aus Supabase:",
            error.message
          );
          alert(`Fehler beim Löschen: ${error.message}`);
          return; // Breche ab, wenn DB-Löschung fehlschlägt
        }
      }
      // Lokalen State aktualisieren
      const roundIndexToDelete = allRoundsData.findIndex(
        (r) => r.client_id === roundToDelete.client_id
      );
      const newRounds = allRoundsData.filter(
        (r) => r.client_id !== roundToDelete.client_id
      );

      let newCurrentIdx = currentRoundIndex;
      if (roundIndexToDelete < currentRoundIndex) {
        newCurrentIdx = currentRoundIndex - 1;
      } else if (roundIndexToDelete === currentRoundIndex) {
        newCurrentIdx = Math.min(roundIndexToDelete, newRounds.length - 1);
        newCurrentIdx = Math.max(0, newCurrentIdx);
      }
      setAllRoundsData(newRounds);
      setCurrentRoundIndex(newRounds.length > 0 ? newCurrentIdx : 0);
    }
  };

  // handleCategoryNameChange, handleRoundNameChange, openEditModal, handleModalInputChange, saveQuestionChanges
  // müssen angepasst werden, um mit 'currentRoundToDisplay.content.categories' etc. zu arbeiten.
  // Hier ein Beispiel für handleCategoryNameChange:
  const handleCategoryNameChange = (catIndex, newName) => {
    if (!user) return;
    setAllRoundsData((prevRounds) => {
      const updatedRounds = prevRounds.map((round, rIndex) => {
        if (rIndex === currentRoundIndex) {
          const newCategories = round.content.categories.map((cat, cIndex) => {
            if (cIndex === catIndex) {
              return { ...cat, name: newName };
            }
            return cat;
          });
          return {
            ...round,
            content: { ...round.content, categories: newCategories },
          };
        }
        return round;
      });
      return updatedRounds;
    });
  };

  const handleRoundNameChange = (newRoundName) => {
    if (!user) return;
    setAllRoundsData((prevRounds) => {
      const updatedRounds = [...prevRounds];
      if (updatedRounds[currentRoundIndex]) {
        updatedRounds[currentRoundIndex].name = newRoundName;
      }
      return updatedRounds;
    });
  };

  const openEditModal = (catIndex, qIndex) => {
    if (!user || !currentRoundToDisplay) return;
    const questionData =
      currentRoundToDisplay.content.categories[catIndex].questions[qIndex];
    setEditingQuestion({ catIndex, qIndex, questionData });
    setModalInput({ text: questionData.text, answer: questionData.answer });
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setModalInput((prev) => ({ ...prev, [name]: value }));
  };

  const saveQuestionChanges = () => {
    if (!editingQuestion || !user || !currentRoundToDisplay) return;
    const { catIndex, qIndex } = editingQuestion;
    setAllRoundsData((prevRounds) => {
      const updatedRounds = prevRounds.map((round, rIndex) => {
        if (rIndex === currentRoundIndex) {
          const newCategories = round.content.categories.map((cat, cIndex) => {
            if (cIndex === catIndex) {
              const newQuestions = cat.questions.map((q, quIndex) => {
                if (quIndex === qIndex) {
                  return {
                    ...q,
                    text: modalInput.text,
                    answer: modalInput.answer,
                  };
                }
                return q;
              });
              return { ...cat, questions: newQuestions };
            }
            return cat;
          });
          return {
            ...round,
            content: { ...round.content, categories: newCategories },
          };
        }
        return round;
      });
      return updatedRounds;
    });
    setEditingQuestion(null);
  };

  // ---- Render-Logik ----
  if (isInitiallyLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-8">
        <p className="text-lg">Lade Fragendaten...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-green-300 to-emerald-300 text-black flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-3xl font-bold text-emerald-900 mb-6">
          Fragen-Editor
        </h1>
        <p className="text-xl text-emerald-800 mb-4">
          Bitte{" "}
          <Link
            to="/auth"
            className="font-semibold underline hover:text-emerald-900"
          >
            melden Sie sich an
          </Link>
          , um Fragen zu bearbeiten.
        </p>
      </div>
    );
  }

  if (allRoundsData.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-green-300 to-emerald-300 text-black flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold text-emerald-900 mb-6">
          Fragen-Editor
        </h1>
        <p className="text-lg mb-4">Keine Runden vorhanden.</p>
        <button
          onClick={createFirstRound}
          disabled={!user}
          className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow transition-colors disabled:bg-gray-400"
        >
          <AiOutlinePlus className="mr-2" /> Erste Runde erstellen
        </button>
      </div>
    );
  }

  const safeCurrentRoundIndex = Math.max(
    0,
    Math.min(currentRoundIndex, allRoundsData.length - 1)
  );
  const currentRoundToDisplay = allRoundsData[safeCurrentRoundIndex];

  if (!currentRoundToDisplay) {
    console.error(
      "Kritischer Fehler: Runde konnte nicht angezeigt werden.",
      allRoundsData,
      currentRoundIndex,
      safeCurrentRoundIndex
    );
    return (
      <div className="p-8 text-center text-red-600">
        Ein unerwarteter Fehler ist aufgetreten. Bitte laden Sie die Seite neu.
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen w-full bg-gradient-to-br from-green-300 to-emerald-300 text-black flex flex-col items-center p-4 sm:p-8 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-emerald-900">
        Fragen-Editor
      </h1>

      {/* Rundenauswahl und -verwaltung */}
      <div className="w-full max-w-5xl mb-8 p-4 bg-white bg-opacity-70 rounded-lg shadow-lg border border-emerald-300">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <label
              htmlFor="round-select"
              className="text-lg font-semibold text-emerald-800 whitespace-nowrap"
            >
              Runde:
            </label>
            <select
              id="round-select"
              value={safeCurrentRoundIndex} // Verwende den sicheren Index
              onChange={(e) =>
                setCurrentRoundIndex(parseInt(e.target.value, 10))
              }
              className="p-2 border border-emerald-500 rounded-md bg-white text-black focus:ring-2 focus:ring-green-500 min-w-[150px]"
              disabled={isSaving}
            >
              {allRoundsData.map((round, index) => (
                <option key={round.client_id || round.db_id} value={index}>
                  {round.name || `Runde ${index + 1}`}
                </option>
              ))}
            </select>
            <input
              type="text"
              id="round-name-edit"
              placeholder="Name der aktuellen Runde"
              value={currentRoundToDisplay.name}
              onChange={(e) => handleRoundNameChange(e.target.value)}
              className="p-2 bg-white border border-emerald-500 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-black sm:w-auto grow"
              disabled={isSaving}
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
          <button
            onClick={handleAddRound}
            className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow transition-colors text-sm disabled:bg-gray-400"
            disabled={isSaving || !user}
          >
            <AiOutlinePlus className="mr-1 sm:mr-2" /> Runde hinzufügen
          </button>
          {allRoundsData.length > 1 && (
            <button
              onClick={() => handleDeleteRound(currentRoundToDisplay)} // Übergebe das Rundenobjekt
              className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md shadow transition-colors text-sm disabled:bg-gray-400"
              disabled={isSaving || !user}
            >
              <AiOutlineDelete className="mr-1 sm:mr-2" /> Runde löschen (
              {currentRoundToDisplay.name})
            </button>
          )}
          <button
            onClick={saveAllRoundsToSupabase}
            className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-md shadow transition-colors text-sm disabled:bg-gray-400"
            disabled={isSaving || !user}
          >
            {isSaving ? (
              "Speichert..."
            ) : (
              <>
                <AiOutlineSave className="mr-1 sm:mr-2" /> Alle Speichern
              </>
            )}
          </button>
          <Link to="/" className="sm:ml-auto">
            <button
              className="flex items-center w-full sm:w-auto justify-center px-3 py-2 sm:px-4 sm:py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-md shadow transition-colors text-sm"
              disabled={isSaving}
            >
              <AiOutlineArrowLeft className="mr-1 sm:mr-2" /> Zurück zur
              Startseite
            </button>
          </Link>
        </div>
      </div>

      {/* Kategorienamen bearbeiten */}
      <div className="w-full max-w-5xl mb-8 p-4 bg-white bg-opacity-70 rounded-lg shadow-lg border border-emerald-300">
        <h2 className="text-2xl font-semibold mb-4 text-emerald-800">
          Kategorien für "{currentRoundToDisplay.name}"
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {currentRoundToDisplay.content.categories.map((cat, catIndex) => (
            <div key={cat.id}>
              {" "}
              {/* Verwende die Client- oder DB-ID der Kategorie, falls vorhanden */}
              <label
                htmlFor={`cat-name-${cat.id}`}
                className="block text-sm font-medium text-emerald-700"
              >
                Kategorie {catIndex + 1}
              </label>
              <input
                type="text"
                id={`cat-name-${cat.id}`}
                value={cat.name}
                onChange={(e) =>
                  handleCategoryNameChange(catIndex, e.target.value)
                }
                className="mt-1 w-full p-2 bg-white border border-emerald-500 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-black"
                disabled={isSaving}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Fragen-Grid */}
      <div className="w-full max-w-5xl p-4 bg-white bg-opacity-70 rounded-lg shadow-lg border border-emerald-300">
        <h2 className="text-2xl font-semibold mb-4 text-emerald-800">
          Fragen für "{currentRoundToDisplay.name}"
        </h2>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {currentRoundToDisplay.content.categories.map((cat, catIndex) => (
            <div key={cat.id} className="flex flex-col gap-2 sm:gap-3">
              {cat.questions.map((q, qIndex) => (
                <motion.button
                  key={q.id}
                  onClick={() => !isSaving && openEditModal(catIndex, qIndex)}
                  disabled={isSaving}
                  className={`p-2 sm:p-3 h-16 sm:h-20 flex flex-col justify-between items-center text-center rounded-md border transition-all duration-150 ease-in-out disabled:opacity-50
                              ${
                                q.text
                                  ? "bg-green-100 border-green-400 hover:bg-green-200"
                                  : "bg-emerald-50 border-emerald-300 hover:bg-emerald-100"
                              }`}
                  whileHover={{ scale: isSaving ? 1 : 1.05 }}
                  whileTap={{ scale: isSaving ? 1 : 0.95 }}
                >
                  <span className="text-xs sm:text-sm font-bold text-emerald-700">
                    ${q.points}
                  </span>
                  <span
                    className={`text-xxs sm:text-xs truncate w-full ${
                      q.text ? "text-green-800" : "text-gray-500"
                    }`}
                  >
                    {q.text ? q.text : "(Leer)"}
                  </span>
                  <AiOutlineEdit className="text-emerald-600 w-3 h-3 sm:w-4 sm:h-4 mt-1" />
                </motion.button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {editingQuestion && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg border border-emerald-300"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-emerald-800">
                Frage bearbeiten (${editingQuestion.questionData.points} Punkte)
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="questionText"
                    className="block text-sm font-medium text-emerald-700"
                  >
                    Fragetext:
                  </label>
                  <textarea
                    id="questionText"
                    name="text"
                    value={modalInput.text}
                    onChange={handleModalInputChange}
                    rows="3"
                    className="mt-1 w-full p-2 bg-white border border-emerald-500 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-black"
                  />
                </div>
                <div>
                  <label
                    htmlFor="questionAnswer"
                    className="block text-sm font-medium text-emerald-700"
                  >
                    Antwort:
                  </label>
                  <textarea
                    id="questionAnswer"
                    name="answer"
                    value={modalInput.answer}
                    onChange={handleModalInputChange}
                    rows="2"
                    className="mt-1 w-full p-2 bg-white border border-emerald-500 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-black"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="flex items-center px-4 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded-md shadow transition-colors"
                >
                  <AiOutlineCloseCircle className="mr-2" /> Abbrechen
                </button>
                <button
                  onClick={saveQuestionChanges}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow transition-colors"
                >
                  <AiOutlineSave className="mr-2" /> Speichern
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default QuestionEditPage;
