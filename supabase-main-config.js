// Configuração Unificada do Supabase
const SUPABASE_URL = 'https://xjtkatmixfhxllummglk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqdGthdG1peGZoeGxsdW1tZ2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMDQ5ODMsImV4cCI6MjA5MTg4MDk4M30.yfRNrXvUJAA5_wcYow86coR4e1wyM05psSieH59JDns';

// Inicializa o cliente do Supabase
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Exporta para uso global (caso necessário)
window.ENV_CONFIG = {
    SUPABASE_URL: SUPABASE_URL,
    SUPABASE_KEY: SUPABASE_KEY
};
