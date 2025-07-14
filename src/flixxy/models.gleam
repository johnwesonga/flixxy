// Core data models and types for the Flixxy movie search application

import gleam/option.{type Option, None, Some}

// Movie data structure from TMDB API
pub type Movie {
  Movie(
    id: Int,
    title: String,
    overview: String,
    release_date: String,
    poster_path: Option(String),
    vote_average: Float,
  )
}

// Application state model
pub type Model {
  Model(
    search_query: String,
    movies: List(Movie),
    loading: Bool,
    error: Option(String),
  )
}

// Messages for state updates in MVU pattern
pub type Msg {
  SearchQueryChanged(String)
  SearchSubmitted
  MoviesLoaded(Result(List(Movie), String))
  ClearError
}

// Initialize the application model with default values
pub fn init() -> Model {
  Model(search_query: "", movies: [], loading: False, error: None)
}

// Helper function to create a new movie instance
pub fn new_movie(
  id: Int,
  title: String,
  overview: String,
  release_date: String,
  poster_path: Option(String),
  vote_average: Float,
) -> Movie {
  Movie(
    id: id,
    title: title,
    overview: overview,
    release_date: release_date,
    poster_path: poster_path,
    vote_average: vote_average,
  )
}

// Helper function to update search query in model
pub fn set_search_query(model: Model, query: String) -> Model {
  Model(..model, search_query: query)
}

// Helper function to set loading state
pub fn set_loading(model: Model, loading: Bool) -> Model {
  Model(..model, loading: loading)
}

// Helper function to set movies and clear loading/error states
pub fn set_movies(model: Model, movies: List(Movie)) -> Model {
  Model(..model, movies: movies, loading: False, error: None)
}

// Helper function to set error state and clear loading
pub fn set_error(model: Model, error: String) -> Model {
  Model(..model, error: Some(error), loading: False)
}

// Helper function to clear error state
pub fn clear_error(model: Model) -> Model {
  Model(..model, error: None)
}
