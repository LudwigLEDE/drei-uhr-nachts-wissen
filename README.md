# Jeopardy Style Quiz Show

## beschreibung

Eine webbasierte Anwendung, mit der Benutzer ein Quizspiel im Jeopardy-Stil erstellen und spielen können. Die Anwendung umfasst Benutzerauthentifizierung, die Erstellung von Teams, ein Werkzeug zur Bearbeitung von Fragenrunden und ein interaktives Spielbrett. Als Backend-Dienste wird Supabase verwendet.

## Features

- **Benutzerauthentifizierung:**
  - Registrierung mit E-Mail und Passwort.
  - Anmeldung und Abmeldung.
  - Anonyme Anmeldung ("Als Gast spielen").
- **Fragen-Editor:**
  - Erstellen und Verwalten mehrerer Fragenrunden.
  - Jede Runde besteht aus einem 5x5-Raster (5 Kategorien mit je 5 Fragen).
  - Bearbeiten von Kategorienamen.
  - Bearbeiten von Fragetexten und Antworten für jede Zelle im Raster.
  - Speicherung der Fragenrunden in der Supabase-Datenbank.
- **Team-Setup:**
  - Erstellen von Teams für ein Spiel.
  - Teamnamen werden für die Dauer des Spiels (oder im `localStorage`) gespeichert.
- **Spielbrett (`BoardPage`):**
  - Anzeige des Jeopardy-Rasters mit Kategorien und Punktwerten basierend auf den im Editor erstellten Runden.
  - Verfolgung von bereits beantworteten Fragen.
- **Fragenanzeige (`QuestionPage`):**
  - Anzeige der ausgewählten Frage und ihrer Antwort.
  - (Implizit) Möglichkeit zur Punktevergabe und Aktualisierung der Team-Punktestände.
- **Persistenz:** Daten (Benutzer, Fragenrunden) werden mit Supabase als Backend gespeichert.

## Tech Stack

- **Frontend:**
  - React (mit Vite als Build-Tool)
  - React Router DOM (für das Routing)
  - Tailwind CSS (für das Styling)
  - Framer Motion (für Animationen)
  - React Icons (für Icons)
- **Backend & Datenbank:**
  - Supabase (PostgreSQL-Datenbank, Authentifizierung, Row Level Security)
- **Entwicklungsumgebung:**
  - Node.js
  - npm (oder yarn)

## Voraussetzungen

- Node.js (Version 16.x oder höher empfohlen)
- npm (Version 8.x oder höher empfohlen) oder yarn
- Ein Supabase-Konto und ein eingerichtetes Supabase-Projekt.

## Erste Schritte / Installation

1.  **Repository klonen (falls zutreffend):**

    ```bash
    git clone <URL_IHRES_GIT_REPOSITORIES>
    cd <projekt-ordner>
    ```

2.  **Abhängigkeiten installieren:**

    ```bash
    npm install
    ```

    Oder falls Sie yarn verwenden:

    ```bash
    yarn install
    ```

3.  **Supabase Umgebungsvariablen einrichten:**

    - Erstellen Sie eine Datei namens `.env` im Stammverzeichnis Ihres Projekts.
    - Fügen Sie Ihre Supabase Projekt-URL und den `anon public` API-Key hinzu:
      ```env
      VITE_SUPABASE_URL=IHRE_SUPABASE_PROJEKT_URL
      VITE_SUPABASE_ANON_KEY=IHR_SUPABASE_ANON_KEY
      ```
    - Ersetzen Sie `IHRE_SUPABASE_PROJEKT_URL` und `IHR_SUPABASE_ANON_KEY` mit Ihren tatsächlichen Werten aus Ihrem Supabase Projekt-Dashboard (Einstellungen -> API).
    - **Wichtig:** Fügen Sie `.env` zu Ihrer `.gitignore`-Datei hinzu, um Ihre Schlüssel nicht versehentlich in ein Git-Repository hochzuladen.

4.  **Supabase Datenbank-Schema einrichten:**

    - Gehen Sie zum SQL Editor in Ihrem Supabase-Projekt-Dashboard.
    - Führen Sie die SQL-Skripte aus, die zuvor bereitgestellt wurden, um die Tabellen `profiles` und `question_rounds` sowie die notwendigen Trigger und Row Level Security (RLS) Policies zu erstellen. Stellen Sie sicher, dass die `uuid-ossp`-Erweiterung aktiviert ist.

5.  **Supabase Authentifizierungs-Provider konfigurieren:**
    - Gehen Sie in Ihrem Supabase-Dashboard zu "Authentication" -> "Providers".
    - Stellen Sie sicher, dass der "Email"-Provider aktiviert ist. Konfigurieren Sie ggf. die E-Mail-Bestätigungseinstellungen unter "Authentication" -> "Settings".
    - Aktivieren Sie den "Anonymous"-Provider, wenn Sie die anonyme Anmeldung nutzen möchten.

## Anwendung starten (Entwicklungsmodus)

Führen Sie den folgenden Befehl aus, um den Vite-Entwicklungsserver zu starten:

```bash
npm run dev
```
