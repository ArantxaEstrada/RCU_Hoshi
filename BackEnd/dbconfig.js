import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Preferir service role para evitar problemas con RLS en catálogos; caer a ANON si no está.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE (o SUPABASE_ANON) deben estar definidas en el archivo .env');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    db: {
        schema: 'RCU'
    }
});

export default supabase;
