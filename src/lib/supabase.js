import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wwolqmhpzttpjhuwhqmh.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3b2xxbWhwenR0cGpodXdocW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNzIzNjksImV4cCI6MjA5Mjg0ODM2OX0.MM84O72-nUjgxZC5I9jYPmBy1yLDmcjLC8d5VbZgFnY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
