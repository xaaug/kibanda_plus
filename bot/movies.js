import { getDB } from "../data/db.js";
import { ObjectId } from "mongodb";

export async function loadMovies() {
  const db = await getDB();
  const movies = await db.collection("movies").find({}).toArray();
  // console.log(movies)
  return movies;
}

export async function saveMovie(movie) {
  const db = await getDB();

  // Check if movie already exists by file_id or title+year combo
  const exists = await db.collection("movies").findOne({
    $or: [
      { file_id: movie.file_id },
      { title: movie.title.toLowerCase(), year: movie.year },
    ],
  });

  if (exists) return false;

  // Add initial popularity and timestamps
  const newMovie = {
    ...movie,
    popularity: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection("movies").insertOne(newMovie);

  return true;
}

export async function getMovies() {
  const db = await getDB();
  return db.collection("movies").find({}).toArray();
}

export async function incrementPopularity(movieId) {
  const db = await getDB();

  const result = await db
    .collection("movies")
    .findOneAndUpdate(
      { _id: new ObjectId(movieId) },
      { $inc: { popularity: 1 }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" },
    );

  return result.value;
}

export async function searchMovies(query) {
  const db = await getDB();
  const regex = new RegExp(query, "i");

  // Find matching movies
  const movies = await db
    .collection("movies")
    .find({
      $or: [{ title: regex }, { genre: regex }],
    })
    .toArray();

  // Increment popularity for all matches (async in parallel)
  await Promise.all(movies.map((movie) => incrementPopularity(movie._id)));

  return movies;
}
