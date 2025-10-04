import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vyalbnxrxlhindldezhq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YWxibnhyeGxoaW5kbGRlemhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTcxNzcsImV4cCI6MjA3NDQ5MzE3N30.khe9gkuYTBnb50d6SMtoJkqbKU8NKzIJ-j2Pd7_yDHE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
