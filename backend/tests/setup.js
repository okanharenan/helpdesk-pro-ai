// Valores falsos só para os testes: o Jest não lê o .env, e alguns módulos
// (Supabase, Resend) exigem essas variáveis já na hora do require.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://test-project.supabase.co";
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "test-anon-key";
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "test-service-key";
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "re_test_key";