import json
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI()

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
# Mount static files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.mount("/frontend", StaticFiles(directory=os.path.join(BASE_DIR, "../frontend")), name="frontend")

DATA_FILE_MOVIES = os.path.join(BASE_DIR, "movies.json")
DATA_FILE_RESTAURANTS = os.path.join(BASE_DIR, "restaurants.json")

class Movie(BaseModel):
    id: int
    title: str
    image: str
    ratingDavid: int = 0
    ratingLena: int = 0
    seen: bool = False
    genres: List[str] = []
    releaseYear: str = ""
    createdDate: str = ""
    type: str = "Film"  # Film, Serie, Anime
    imagePosition: str = "center"

class Restaurant(BaseModel):
    id: int
    name: str
    image: str
    ratingDavid: int = 0
    ratingLena: int = 0
    visited: bool = False
    city: str = ""
    cuisine: List[str] = []
    price: str = "" # Low, Mid, High
    createdDate: str = ""
    imagePosition: str = "center"

def load_movies() -> List[Movie]:
    if not os.path.exists(DATA_FILE_MOVIES):
        return []
    try:
        with open(DATA_FILE_MOVIES, "r") as f:
            data = json.load(f)
            return [Movie(**m) for m in data]
    except (json.JSONDecodeError, FileNotFoundError):
        return []

def save_movies(movies: List[Movie]):
    with open(DATA_FILE_MOVIES, "w") as f:
        json.dump([m.dict() for m in movies], f, indent=4)

def load_restaurants() -> List[Restaurant]:
    if not os.path.exists(DATA_FILE_RESTAURANTS):
        return []
    try:
        with open(DATA_FILE_RESTAURANTS, "r") as f:
            data = json.load(f)
            return [Restaurant(**m) for m in data]
    except (json.JSONDecodeError, FileNotFoundError):
        return []

def save_restaurants(restaurants: List[Restaurant]):
    with open(DATA_FILE_RESTAURANTS, "w") as f:
        json.dump([m.dict() for m in restaurants], f, indent=4)

@app.get("/movies", response_model=List[Movie])
async def get_movies():
    return load_movies()

@app.post("/movies", response_model=Movie)
async def create_movie(movie: Movie):
    movies = load_movies()
    if any(m.id == movie.id for m in movies):
        pass 
    movies.append(movie)
    save_movies(movies)
    return movie

@app.put("/movies/{movie_id}", response_model=Movie)
async def update_movie(movie_id: int, updated_movie: Movie):
    movies = load_movies()
    for i, movie in enumerate(movies):
        if movie.id == movie_id:
            movies[i] = updated_movie
            save_movies(movies)
            return updated_movie
    raise HTTPException(status_code=404, detail="Movie not found")

@app.delete("/movies/{movie_id}")
async def delete_movie(movie_id: int):
    print(f"Deleting movie with ID: {movie_id}")
    movies = load_movies()
    initial_len = len(movies)
    print(f"Initial movies count: {initial_len}")
    movies = [m for m in movies if m.id != movie_id]
    final_len = len(movies)
    print(f"Final movies count: {final_len}")
    
    if final_len == initial_len:
        print("Movie not found")
        raise HTTPException(status_code=404, detail="Movie not found")
    
    save_movies(movies)
    print("Movie saved successfully")
    return {"message": "Movie deleted successfully"}

# Restaurant Endpoints
@app.get("/restaurants", response_model=List[Restaurant])
async def get_restaurants():
    return load_restaurants()

@app.post("/restaurants", response_model=Restaurant)
async def create_restaurant(restaurant: Restaurant):
    restaurants = load_restaurants()
    if any(r.id == restaurant.id for r in restaurants):
        pass
    restaurants.append(restaurant)
    save_restaurants(restaurants)
    return restaurant

@app.put("/restaurants/{restaurant_id}", response_model=Restaurant)
async def update_restaurant(restaurant_id: int, updated_restaurant: Restaurant):
    restaurants = load_restaurants()
    for i, restaurant in enumerate(restaurants):
        if restaurant.id == restaurant_id:
            restaurants[i] = updated_restaurant
            save_restaurants(restaurants)
            return updated_restaurant
    raise HTTPException(status_code=404, detail="Restaurant not found")

@app.delete("/restaurants/{restaurant_id}")
async def delete_restaurant(restaurant_id: int):
    print(f"Deleting restaurant with ID: {restaurant_id}")
    restaurants = load_restaurants()
    initial_len = len(restaurants)
    print(f"Initial restaurants count: {initial_len}")
    restaurants = [r for r in restaurants if r.id != restaurant_id]
    final_len = len(restaurants)
    print(f"Final restaurants count: {final_len}")

    if final_len == initial_len:
        print("Restaurant not found")
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    save_restaurants(restaurants)
    print("Restaurant saved successfully")
    return {"message": "Restaurant deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
