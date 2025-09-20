import 'dotenv/config';
import connectDB from './config/db.js';
import app from './app.js';

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 API ready on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect DB:', err);
    process.exit(1);
  });