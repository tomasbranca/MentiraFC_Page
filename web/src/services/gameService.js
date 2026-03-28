import { getGame } from "../lib/sanity";

export const fetchGame = async () => {
  try {
    const data = await getGame();
    return data;
  } catch (error) {
    console.error("Error fetching game:", error);
    throw error;
  }
};