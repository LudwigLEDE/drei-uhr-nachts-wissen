// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

// Lade die Variablen aus der .env Datei (für Vite Projekte)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL oder Anon Key fehlen. Stellen Sie sicher, dass Ihre .env Datei korrekt konfiguriert ist mit VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
