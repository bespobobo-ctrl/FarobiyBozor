import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'c:/Users/PRESTIGE/.gemini/antigravity/scratch/Farobiy_Bozor/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
    console.log("Checking tables...");

    const tables = ['fb_shops', 'fb_products', 'fb_logs', 'fb_categories'];

    for (const table of tables) {
        console.log(`\n--- Table: ${table} ---`);
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                console.error(`Error fetching ${table}:`, error.message);
            } else if (data && data.length > 0) {
                console.log(`Columns for ${table}:`, JSON.stringify(Object.keys(data[0])));
            } else {
                console.log(`Table ${table} is empty or not accessible.`);
            }
        } catch (e) {
            console.error(`Exception checking ${table}:`, e.message);
        }
    }
}

checkSchema();
