import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://gzgvyiejjlcciijovcok.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Z3Z5aWVqamxjY2lpam92Y29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2Nzc5MzgsImV4cCI6MjA5MjI1MzkzOH0.unzsXhOhYig_PuGjH0ZmxsIcaRuu8Z6wk4m7TztJRYM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)