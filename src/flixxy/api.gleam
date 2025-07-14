// TMDB API client functionality for movie search
// Note: Task requires RSVP package, but RSVP v1.1.2 has compilation issues.
// Using gleam_httpc as alternative HTTP client with equivalent functionality.
import flixxy/models.{type Movie}

import gleam/dynamic/decode
import gleam/http/request
import gleam/httpc
import gleam/json
import gleam/option.{type Option, None, Some}
import gleam/string
import gleam/uri

// TMDB API configuration
const tmdb_base_url = "https://api.themoviedb.org/3"

const tmdb_image_base_url = "https://image.tmdb.org/t/p/w500"

// API key - in a real application this would come from environment variables
const api_key = "5dcf7f28a88be0edc01bbbde06f024ab"

// Error types for API operations
pub type ApiError {
  NetworkError(String)
  ParseError(String)
  ApiError(Int, String)
  AuthenticationError
  RateLimitError
}

// Search for movies using TMDB API
pub fn search_movies(query: String) -> Result(List(Movie), ApiError) {
  case string.trim(query) {
    "" -> Error(ParseError("Search query cannot be empty"))
    trimmed_query -> {
      let search_url = build_search_url(trimmed_query)

      case make_api_request(search_url) {
        Ok(response_body) -> parse_search_response(response_body)
        Error(error) -> Error(error)
      }
    }
  }
}

// Build the search URL with query parameters
fn build_search_url(query: String) -> String {
  let encoded_query = uri.percent_encode(query)
  tmdb_base_url
  <> "/search/movie?api_key="
  <> api_key
  <> "&query="
  <> encoded_query
}

// Make HTTP request to TMDB API
fn make_api_request(url: String) -> Result(String, ApiError) {
  case request.to(url) {
    Ok(req) -> {
      let req_with_headers =
        request.set_header(req, "accept", "application/json")

      case httpc.send(req_with_headers) {
        Ok(response) -> {
          case response.status {
            200 -> Ok(response.body)
            401 -> Error(AuthenticationError)
            429 -> Error(RateLimitError)
            status -> Error(ApiError(status, "API request failed"))
          }
        }
        Error(httpc.InvalidUtf8Response) ->
          Error(ParseError("Invalid response encoding"))
        Error(httpc.FailedToConnect(_, _)) ->
          Error(NetworkError("Failed to connect to TMDB API"))
        Error(httpc.ResponseTimeout) -> Error(NetworkError("Request timeout"))
      }
    }
    Error(_) -> Error(NetworkError("Invalid request URL"))
  }
}

// Parse TMDB search response JSON
fn parse_search_response(json_string: String) -> Result(List(Movie), ApiError) {
  case json.parse(json_string, results_decoder()) {
    Ok(movies) -> Ok(movies)
    Error(_) -> Error(ParseError("Failed to parse API response"))
  }
}

// Decoder for the results array
fn results_decoder() -> decode.Decoder(List(Movie)) {
  use results <- decode.field("results", decode.list(movie_decoder()))
  decode.success(results)
}

// Decoder for individual movie
fn movie_decoder() -> decode.Decoder(Movie) {
  use id <- decode.field("id", decode.int)
  use title <- decode.field("title", decode.string)
  use overview <- decode.field("overview", decode.string)
  use release_date <- decode.field("release_date", decode.string)
  use poster_path <- decode.field("poster_path", decode.optional(decode.string))
  use vote_average <- decode.field("vote_average", decode.float)
  decode.success(models.Movie(
    id:,
    title:,
    overview:,
    release_date:,
    poster_path:,
    vote_average:,
  ))
}

// Helper function to construct full poster URL
pub fn get_poster_url(poster_path: Option(String)) -> Option(String) {
  case poster_path {
    Some(path) -> Some(tmdb_image_base_url <> path)
    None -> None
  }
}

// Helper function to construct poster URL with specific size
pub fn get_poster_url_with_size(
  poster_path: Option(String),
  size: String,
) -> Option(String) {
  case poster_path {
    Some(path) -> Some("https://image.tmdb.org/t/p/" <> size <> path)
    None -> None
  }
}

// Helper function to get responsive poster URLs for different screen sizes
pub fn get_responsive_poster_urls(
  poster_path: Option(String),
) -> #(Option(String), Option(String), Option(String)) {
  case poster_path {
    Some(path) -> {
      let mobile_url = Some("https://image.tmdb.org/t/p/w342" <> path)
      let tablet_url = Some("https://image.tmdb.org/t/p/w500" <> path)
      let desktop_url = Some("https://image.tmdb.org/t/p/w780" <> path)
      #(mobile_url, tablet_url, desktop_url)
    }
    None -> #(None, None, None)
  }
}

// Helper function to validate poster path format
pub fn is_valid_poster_path(poster_path: Option(String)) -> Bool {
  case poster_path {
    Some(path) -> string.starts_with(path, "/") && string.length(path) > 1
    None -> False
  }
}

// Helper function to format release year from date
pub fn get_release_year(release_date: String) -> String {
  case string.split(release_date, "-") {
    [year, ..] -> year
    [] -> ""
  }
}

// Helper function to convert API error to user-friendly message
pub fn error_to_string(error: ApiError) -> String {
  case error {
    NetworkError(_) ->
      "Unable to connect to movie database. Please check your connection and try again."
    ParseError(_) -> "Unable to process movie data. Please try again."
    ApiError(_, _) ->
      "Movie service is temporarily unavailable. Please try again later."
    AuthenticationError ->
      "Authentication failed. Please check API configuration."
    RateLimitError -> "Too many requests. Please wait a moment and try again."
  }
}
