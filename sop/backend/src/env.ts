try {
  process.loadEnvFile();
} catch {
  /* no .env file, use the real environment */
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing in backend/.env');
}