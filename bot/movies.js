import fs from 'fs';
import path from 'path';

const moviesFile = path.join('./data/movies.json');


const MOVIES_PATH = path.join('./data/movies.json');

export let movies = [];

try {
  const data = fs.readFileSync(MOVIES_PATH, 'utf8');
  movies = JSON.parse(data);
  console.log(`🔥 Loaded ${movies.length} movies from file.`);
} catch (err) {
  console.error('❌ Failed to load movie list:', err);
}

export const saveMovie = (movie) => {
  const currentMovies = loadMovies();
  const exists = currentMovies.find(m =>
    m.file_id === movie.file_id ||
    (m.title.toLowerCase() === movie.title.toLowerCase() && m.year === movie.year)
  );
  if (exists) return false;

  currentMovies.push(movie);
  fs.writeFileSync(MOVIES_PATH, JSON.stringify(currentMovies, null, 2));
  movies = currentMovies; // update global
  return true;
};


export function loadMovies() {
  try {
    const data = fs.readFileSync(moviesFile, 'utf8');
    const movies = JSON.parse(data);
    if (!Array.isArray(movies)) {
      console.warn('[loadMovies] JSON is not an array, resetting to []');
      return [];
    }
    return movies;
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('[loadMovies] File not found, returning empty array');
      return [];
    }
    throw err;
  }}