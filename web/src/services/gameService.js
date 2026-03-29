import { getLatestGame } from "../lib/sanity/services/games.service";

export const fetchGame = async () => {
  try {
    const data = await getLatestGame();
    return data;
  } catch (error) {
    console.error("Error fetching game:", error);
    throw error;
  }
};