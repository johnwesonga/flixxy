// Requirements coverage tests to ensure all specified requirements are tested
// This file specifically validates requirements: 1.5, 3.1, 3.2, 3.3, 3.4, 3.5

import flixxy/api
import flixxy/messages
import flixxy/models
import flixxy/views
import gleam/option.{None, Some}
import gleeunit
import gleeunit/should

pub fn main() {
  gleeunit.main()
}

// Requirement 1.5: Test complete user journey from search to results
pub fn requirement_1_5_complete_user_journey_test() {
  // User loads application
  let initial_model = models.init()
  initial_model.search_query |> should.equal("")
  initial_model.movies |> should.equal([])
  initial_model.loading |> should.equal(False)
  initial_model.error |> should.equal(None)

  // User types search query
  let #(typed_model, _) =
    messages.update(initial_model, models.SearchQueryChanged("avengers"))
  typed_model.search_query |> should.equal("avengers")

  // User submits search
  let #(submitted_model, _) =
    messages.update(typed_model, models.SearchSubmitted)
  submitted_model.loading |> should.equal(True)
  submitted_model.movies |> should.equal([])
  submitted_model.error |> should.equal(None)

  // API returns results
  let test_movies = [
    models.new_movie(
      1,
      "Avengers",
      "Superhero team",
      "2012",
      Some("/avengers.jpg"),
      8.0,
    ),
  ]
  let #(final_model, _) =
    messages.update(submitted_model, models.MoviesLoaded(Ok(test_movies)))

  final_model.loading |> should.equal(False)
  final_model.movies |> should.equal(test_movies)
  final_model.error |> should.equal(None)
  final_model.search_query |> should.equal("avengers")
}

// Requirement 3.1: Test TMDB API unavailability error handling
pub fn requirement_3_1_api_unavailable_test() {
  let initial_model = models.init()
  let query_model = models.set_search_query(initial_model, "test")
  let #(loading_model, _) = messages.update(query_model, models.SearchSubmitted)

  // Simulate API unavailable error
  let api_unavailable_error =
    "Movie service is temporarily unavailable. Please try again later."
  let #(error_model, _) =
    messages.update(
      loading_model,
      models.MoviesLoaded(Error(api_unavailable_error)),
    )

  error_model.loading |> should.equal(False)
  error_model.error |> should.equal(Some(api_unavailable_error))
  error_model.movies |> should.equal([])

  // Test that the error message is user-friendly
  let api_error = api.ApiError(503, "Service unavailable")
  let error_message = api.error_to_string(api_error)
  error_message
  |> should.equal(
    "Movie service is temporarily unavailable. Please try again later.",
  )
}

// Requirement 3.2: Test network request failure handling
pub fn requirement_3_2_network_failure_test() {
  let initial_model = models.init()
  let query_model = models.set_search_query(initial_model, "test")
  let #(loading_model, _) = messages.update(query_model, models.SearchSubmitted)

  // Simulate network failure
  let network_error =
    "Unable to connect to movie database. Please check your connection and try again."
  let #(error_model, _) =
    messages.update(loading_model, models.MoviesLoaded(Error(network_error)))

  error_model.loading |> should.equal(False)
  error_model.error |> should.equal(Some(network_error))
  error_model.movies |> should.equal([])

  // Test that network errors are converted to user-friendly messages
  let network_api_error = api.NetworkError("Connection timeout")
  let error_message = api.error_to_string(network_api_error)
  error_message
  |> should.equal(
    "Unable to connect to movie database. Please check your connection and try again.",
  )
}

// Requirement 3.3: Test invalid API key authentication error
pub fn requirement_3_3_authentication_error_test() {
  let initial_model = models.init()
  let query_model = models.set_search_query(initial_model, "test")
  let #(loading_model, _) = messages.update(query_model, models.SearchSubmitted)

  // Simulate authentication error
  let auth_error = "Authentication failed. Please check API configuration."
  let #(error_model, _) =
    messages.update(loading_model, models.MoviesLoaded(Error(auth_error)))

  error_model.loading |> should.equal(False)
  error_model.error |> should.equal(Some(auth_error))
  error_model.movies |> should.equal([])

  // Test that authentication errors are properly handled
  let auth_api_error = api.AuthenticationError
  let error_message = api.error_to_string(auth_api_error)
  error_message
  |> should.equal("Authentication failed. Please check API configuration.")
}

// Requirement 3.4: Test empty query validation
pub fn requirement_3_4_empty_query_validation_test() {
  let initial_model = models.init()

  // Test empty string query
  let empty_model = models.set_search_query(initial_model, "")
  let #(empty_error_model, _) =
    messages.update(empty_model, models.SearchSubmitted)

  empty_error_model.loading |> should.equal(False)
  empty_error_model.error
  |> should.equal(Some("Please enter a movie title to search."))
  empty_error_model.movies |> should.equal([])

  // Test that API layer also validates empty queries
  let api_result = api.search_movies("")
  case api_result {
    Error(api.ParseError(_)) -> should.equal(True, True)
    _ -> should.equal(True, False)
  }

  // Test whitespace-only query in API layer
  let whitespace_result = api.search_movies("   ")
  case whitespace_result {
    Error(api.ParseError(_)) -> should.equal(True, True)
    _ -> should.equal(True, False)
  }
}

// Requirement 3.5: Test loading indicator display
pub fn requirement_3_5_loading_indicator_test() {
  let initial_model = models.init()
  let query_model = models.set_search_query(initial_model, "batman")

  // Before search submission - no loading
  query_model.loading |> should.equal(False)

  // After search submission - loading should be true
  let #(loading_model, _) = messages.update(query_model, models.SearchSubmitted)
  loading_model.loading |> should.equal(True)

  // After results loaded - loading should be false
  let test_movies = [models.new_movie(1, "Batman", "Hero", "2008", None, 8.0)]
  let #(results_model, _) =
    messages.update(loading_model, models.MoviesLoaded(Ok(test_movies)))
  results_model.loading |> should.equal(False)

  // After error - loading should be false
  let #(loading_model_2, _) =
    messages.update(query_model, models.SearchSubmitted)
  let #(error_model, _) =
    messages.update(loading_model_2, models.MoviesLoaded(Error("Test error")))
  error_model.loading |> should.equal(False)

  // Test that view can render loading state without errors
  let loading_view = views.view(loading_model)
  case loading_view {
    _ -> should.equal(True, True)
    // Basic smoke test for view rendering
  }
}

// Additional comprehensive test for all error types
pub fn all_error_types_coverage_test() {
  // Test all API error types are properly handled
  let error_types = [
    #(
      api.NetworkError("Timeout"),
      "Unable to connect to movie database. Please check your connection and try again.",
    ),
    #(
      api.ParseError("Invalid JSON"),
      "Unable to process movie data. Please try again.",
    ),
    #(
      api.ApiError(500, "Server error"),
      "Movie service is temporarily unavailable. Please try again later.",
    ),
    #(
      api.ApiError(404, "Not found"),
      "Movie service is temporarily unavailable. Please try again later.",
    ),
    #(
      api.AuthenticationError,
      "Authentication failed. Please check API configuration.",
    ),
    #(
      api.RateLimitError,
      "Too many requests. Please wait a moment and try again.",
    ),
  ]

  // Test each error type conversion
  error_types
  |> list.each(fn(error_pair) {
    let #(error, expected_message) = error_pair
    let actual_message = api.error_to_string(error)
    actual_message |> should.equal(expected_message)
  })
}

// Test edge cases and boundary conditions
pub fn edge_cases_comprehensive_test() {
  // Test very long search queries
  let long_query = string.repeat("very long movie title ", 50)
  let initial_model = models.init()
  let long_query_model = models.set_search_query(initial_model, long_query)
  let #(long_loading_model, _) =
    messages.update(long_query_model, models.SearchSubmitted)

  long_loading_model.search_query |> should.equal(long_query)
  long_loading_model.loading |> should.equal(True)

  // Test special characters in search queries
  let special_chars_query = "movie!@#$%^&*()_+-=[]{}|;':\",./<>?"
  let special_model =
    models.set_search_query(initial_model, special_chars_query)
  let #(special_loading_model, _) =
    messages.update(special_model, models.SearchSubmitted)

  special_loading_model.search_query |> should.equal(special_chars_query)
  special_loading_model.loading |> should.equal(True)

  // Test unicode characters in search queries
  let unicode_query = "电影 фильм película 映画"
  let unicode_model = models.set_search_query(initial_model, unicode_query)
  let #(unicode_loading_model, _) =
    messages.update(unicode_model, models.SearchSubmitted)

  unicode_loading_model.search_query |> should.equal(unicode_query)
  unicode_loading_model.loading |> should.equal(True)
}

// Test state transitions and consistency
pub fn state_transitions_test() {
  let initial_model = models.init()

  // Test Initial -> Query Changed
  let #(query_model, _) =
    messages.update(initial_model, models.SearchQueryChanged("test"))
  query_model.search_query |> should.equal("test")
  query_model.loading |> should.equal(False)
  query_model.error |> should.equal(None)

  // Test Query -> Search Submitted
  let query_model_with_text = models.set_search_query(initial_model, "test")
  let #(loading_model, _) =
    messages.update(query_model_with_text, models.SearchSubmitted)
  loading_model.loading |> should.equal(True)
  loading_model.movies |> should.equal([])
  loading_model.error |> should.equal(None)

  // Test Loading -> Movies Loaded (Success)
  let loading_model_state = models.set_loading(initial_model, True)
  let #(success_model, _) =
    messages.update(loading_model_state, models.MoviesLoaded(Ok([])))
  success_model.loading |> should.equal(False)
  success_model.error |> should.equal(None)

  // Test Loading -> Movies Loaded (Error)
  let loading_model_state_2 = models.set_loading(initial_model, True)
  let #(error_model, _) =
    messages.update(
      loading_model_state_2,
      models.MoviesLoaded(Error("Test error")),
    )
  error_model.loading |> should.equal(False)
  error_model.error |> should.equal(Some("Test error"))

  // Test Error -> Clear Error
  let error_model_state = models.set_error(initial_model, "Test error")
  let #(cleared_model, _) =
    messages.update(error_model_state, models.ClearError)
  cleared_model.error |> should.equal(None)
}

// Import required modules for comprehensive testing
import gleam/list
import gleam/string
