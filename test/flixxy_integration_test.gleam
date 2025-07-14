// Integration tests for complete search workflow
import flixxy/api
import flixxy/messages
import flixxy/models
import gleam/option.{None, Some}
import gleeunit
import gleeunit/should

pub fn main() {
  gleeunit.main()
}

// Test complete search flow from SearchSubmitted to MoviesLoaded
pub fn complete_search_flow_test() {
  let initial_model = models.init()
  let model_with_query = models.set_search_query(initial_model, "batman")

  // Test SearchSubmitted creates proper loading state and effect
  let #(loading_model, _effect) =
    messages.update(model_with_query, models.SearchSubmitted)

  // Verify loading state is set correctly
  loading_model.loading |> should.equal(True)
  loading_model.movies |> should.equal([])
  loading_model.error |> should.equal(None)
  loading_model.search_query |> should.equal("batman")
}

// Test API error conversion to user-friendly messages
pub fn api_error_conversion_test() {
  // Test network error conversion
  let network_error = api.NetworkError("Connection failed")
  let network_message = api.error_to_string(network_error)
  network_message
  |> should.equal(
    "Unable to connect to movie database. Please check your connection and try again.",
  )

  // Test parse error conversion
  let parse_error = api.ParseError("Invalid JSON")
  let parse_message = api.error_to_string(parse_error)
  parse_message
  |> should.equal("Unable to process movie data. Please try again.")

  // Test API error conversion
  let api_error = api.ApiError(500, "Server error")
  let api_message = api.error_to_string(api_error)
  api_message
  |> should.equal(
    "Movie service is temporarily unavailable. Please try again later.",
  )

  // Test authentication error conversion
  let auth_error = api.AuthenticationError
  let auth_message = api.error_to_string(auth_error)
  auth_message
  |> should.equal("Authentication failed. Please check API configuration.")

  // Test rate limit error conversion
  let rate_error = api.RateLimitError
  let rate_message = api.error_to_string(rate_error)
  rate_message
  |> should.equal("Too many requests. Please wait a moment and try again.")
}

// Test empty search query validation
pub fn empty_search_validation_test() {
  let initial_model = models.init()
  let model_with_empty_query = models.set_search_query(initial_model, "")

  // Test SearchSubmitted with empty query
  let #(error_model, _effect) =
    messages.update(model_with_empty_query, models.SearchSubmitted)

  // Verify error state is set correctly
  error_model.loading |> should.equal(False)
  error_model.movies |> should.equal([])
  error_model.error
  |> should.equal(Some("Please enter a movie title to search."))
  error_model.search_query |> should.equal("")
}

// Test successful movie loading flow
pub fn successful_movie_loading_test() {
  let loading_model =
    models.Model(search_query: "batman", movies: [], loading: True, error: None)

  let test_movies = [
    models.new_movie(
      1,
      "Batman Begins",
      "Origin story",
      "2005",
      Some("/batman.jpg"),
      8.2,
    ),
    models.new_movie(
      2,
      "The Dark Knight",
      "Joker story",
      "2008",
      Some("/joker.jpg"),
      9.0,
    ),
  ]

  // Test MoviesLoaded with successful results
  let #(success_model, _effect) =
    messages.update(loading_model, models.MoviesLoaded(Ok(test_movies)))

  // Verify success state is set correctly
  success_model.loading |> should.equal(False)
  success_model.movies |> should.equal(test_movies)
  success_model.error |> should.equal(None)
  success_model.search_query |> should.equal("batman")
}

// Test error movie loading flow
pub fn error_movie_loading_test() {
  let loading_model =
    models.Model(search_query: "batman", movies: [], loading: True, error: None)

  let error_message =
    "Unable to connect to movie database. Please check your connection and try again."

  // Test MoviesLoaded with error
  let #(error_model, _effect) =
    messages.update(loading_model, models.MoviesLoaded(Error(error_message)))

  // Verify error state is set correctly
  error_model.loading |> should.equal(False)
  error_model.movies |> should.equal([])
  error_model.error |> should.equal(Some(error_message))
  error_model.search_query |> should.equal("batman")
}
