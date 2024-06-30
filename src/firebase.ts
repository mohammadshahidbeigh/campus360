import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const appSettings = {
  databaseURL:
    "https://mietbot-2-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

const app = initializeApp(appSettings);
const database = getDatabase(app);

export { database };
