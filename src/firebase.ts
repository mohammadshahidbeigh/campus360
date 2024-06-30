import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const appSettings = {
  databaseURL: import.meta.env.VITE_DATABASE_URL,
};

const app = initializeApp(appSettings);
const database = getDatabase(app);

export { database };
