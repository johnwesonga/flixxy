// Comprehensive end-to-end tests for complete search workflow
// Tests all requirements: 1.5, 3.1, 3.2, 3.3, 3.4, 3.5

import flixxy/api
import flixxy/messages
import flixxy/models
import flixxy/views
import gleam/option.{None, Some}
import gleeunit
import gleeunit/should
import lustre/effect

pub fn main() {
  gleeunit.main()
}

// Test complete search workflow from initial state to results display
// Requirements: 1.5, 3.5
pub fn complete_search_workflow_test() {
  // Start with initial model
  let initial_model = models.init()
  initial_model.search_query |> should.equal("")
  initial_model.movies |> should.equal([])
  initial_model.loading |> should.equal(False)
  initial_model.error |> should.equal(None)

  // Step 1: User types in search query
  let #(query_model, query_effect) =
    messages.update(initial_model, models.SearchQueryChanged("batman"))

  query_model.search_query |> should.equal("batman")
  query_model.loading |> should.equal(False)
  query_model.error |> should.equal(None)
  query_effect |> should.equal(effect.none())

  // Step 2: User submits search
  let #(loading_model, _search_effect) =
    messages.update(query_model, models.SearchSubmitted)

  loading_model.search_query |> should.equal("batman")
  loading_model.loading |> should.equal(True)
  loading_model.movies |> should.equal([])
  loading_model.error |> should.equal(None)
  // search_effect should contain API call effect (tested separately)

  // Step 3: API returns successful results
  let test_movies = [
    models.new_movie(
      1,
      "Batman Begins",
      "Young Bruce Wayne becomes Batman",
      "2005-06-15",
      Some("/batman_begins.jpg"),
      8.2,
    ),
    models.new_movie(
      2,
      "The Dark Knight",
      "Batman faces the Joker",
      "2008-07-18",
      Some("/dark_knight.jpg"),
      9.0,
    ),
  ]

  let #(success_model, success_effect) =
    messages.update(loading_model, models.MoviesLoaded(Ok(test_movies)))

  success_model.search_query |> should.equal("batman")
  success_model.loading |> should.equal(False)
  success_model.movies |> should.equal(test_movies)
  success_model.error |> should.equal(None)
  success_effect |> should.equal(effect.none())
}

// Test error handling with simulated API failures
// Requirements: 3.1, 3.2, 3.3, 3.4
pub fn api_error_handling_workflow_test() {
  let initial_model = models.init()
  let query_model = models.set_search_query(initial_model, "test")

  // Test network error handling
  let #(loading_model, _) = messages.update(query_model, models.SearchSubmitted)
  let network_error =
    "Unable to connect to movie database. Please check your connection and try again."

  let #(network_error_model, network_effect) =
    messages.update(loading_model, models.MoviesLoaded(Error(network_error)))

  network_error_model.loading |> should.equal(False)
  network_error_model.movies |> should.equal([])
  network_error_model.error |> should.equal(Some(network_error))
  network_effect |> should.equal(effect.none())

  // Test API service error handling
  let api_error =
    "Movie service is temporarily unavailable. Please try again later."
  let #(api_error_model, api_effect) =
    messages.update(loading_model, models.MoviesLoaded(Error(api_error)))

  api_error_model.loading |> should.equal(False)
  api_error_model.movies |> should.equal([])
  api_error_model.error |> should.equal(Some(api_error))
  api_effect |> should.equal(effect.none())

  // Test authentication error handling
  let auth_error = "Authentication failed. Please check API configuration."
  let #(auth_error_model, auth_effect) =
    messages.update(loading_model, models.MoviesLoaded(Error(auth_error)))

  auth_error_model.loading |> should.equal(False)
  auth_error_model.movies |> should.equal([])
  auth_error_model.error |> should.equal(Some(auth_error))
  auth_effect |> should.equal(effect.none())

  // Test rate limit error handling
  let rate_error = "Too many requests. Please wait a moment and try again."
  let #(rate_error_model, rate_effect) =
    messages.update(loading_model, models.MoviesLoaded(Error(rate_error)))

  rate_error_model.loading |> should.equal(False)
  rate_error_model.movies |> should.equal([])
  rate_error_model.error |> should.equal(Some(rate_error))
  rate_effect |> should.equal(effect.none())
}

// Test state management throughout user interactions
// Requirements: 1.5, 3.5
pub fn state_management_workflow_test() {
  let initial_model = models.init()

  // Test multiple query changes
  let #(model1, _) =
    messages.update(initial_model, models.SearchQueryChanged("bat"))
  let #(model2, _) =
    messages.update(model1, models.SearchQueryChanged("batman"))
  let #(model3, _) =
    messages.update(model2, models.SearchQueryChanged("batman begins"))

  model3.search_query |> should.equal("batman begins")
  model3.loading |> should.equal(False)
  model3.error |> should.equal(None)

  // Test search submission clears previous results
  let model_with_results =
    models.Model(
      search_query: "batman begins",
      movies: [models.new_movie(1, "Old Movie", "Old", "2000", None, 5.0)],
      loading: False,
      error: Some("Previous error"),
    )

  let #(cleared_model, _) =
    messages.update(model_with_results, models.SearchSubmitted)

  cleared_model.loading |> should.equal(True)
  cleared_model.movies |> should.equal([])
  cleared_model.error |> should.equal(None)
  cleared_model.search_query |> should.equal("batman begins")

  // Test error clearing functionality
  let error_model =
    models.Model(
      search_query: "test",
      movies: [],
      loading: False,
      error: Some("Test error"),
    )

  let #(cleared_error_model, clear_effect) =
    messages.update(error_model, models.ClearError)

  cleared_error_model.error |> should.equal(None)
  cleared_error_model.search_query |> should.equal("test")
  cleared_error_model.loading |> should.equal(False)
  clear_effect |> should.equal(effect.none())
}

// Test edge cases like empty searches and no results
// Requirements: 3.1, 3.4
pub fn edge_cases_workflow_test() {
  let initial_model = models.init()

  // Test empty search query
  let empty_model = models.set_search_query(initial_model, "")
  let #(empty_error_model, empty_effect) =
    messages.update(empty_model, models.SearchSubmitted)

  empty_error_model.loading |> should.equal(False)
  empty_error_model.movies |> should.equal([])
  empty_error_model.error
  |> should.equal(Some("Please enter a movie title to search."))
  empty_effect |> should.equal(effect.none())

  // Test whitespace-only search query
  let whitespace_model = models.set_search_query(initial_model, "   ")
  let #(whitespace_loading_model, _) =
    messages.update(whitespace_model, models.SearchSubmitted)

  // Should proceed to loading since trimming happens in API layer
  whitespace_loading_model.loading |> should.equal(True)
  whitespace_loading_model.error |> should.equal(None)

  // Test no results scenario
  let #(no_results_model, no_results_effect) =
    messages.update(whitespace_loading_model, models.MoviesLoaded(Ok([])))

  no_results_model.loading |> should.equal(False)
  no_results_model.movies |> should.equal([])
  no_results_model.error |> should.equal(None)
  no_results_effect |> should.equal(effect.none())

  // Test very long search query
  let long_query =
    "this is a very long movie title that might cause issues with the API or URL encoding and should be handled gracefully"
  let long_query_model = models.set_search_query(initial_model, long_query)
  let #(long_query_loading_model, _) =
    messages.update(long_query_model, models.SearchSubmitted)

  long_query_loading_model.search_query |> should.equal(long_query)
  long_query_loading_model.loading |> should.equal(True)
  long_query_loading_model.error |> should.equal(None)
}

// Test API client error conversion and handling
// Requirements: 3.1, 3.2, 3.3, 3.4
pub fn api_error_conversion_comprehensive_test() {
  // Test all API error types are properly converted
  let network_error = api.NetworkError("Connection timeout")
  api.error_to_string(network_error)
  |> should.equal(
    "Unable to connect to movie database. Please check your connection and try again.",
  )

  let parse_error = api.ParseError("Invalid JSON format")
  api.error_to_string(parse_error)
  |> should.equal("Unable to process movie data. Please try again.")

  let api_error_500 = api.ApiError(500, "Internal server error")
  api.error_to_string(api_error_500)
  |> should.equal(
    "Movie service is temporarily unavailable. Please try again later.",
  )

  let api_error_404 = api.ApiError(404, "Not found")
  api.error_to_string(api_error_404)
  |> should.equal(
    "Movie service is temporarily unavailable. Please try again later.",
  )

  let auth_error = api.AuthenticationError
  api.error_to_string(auth_error)
  |> should.equal("Authentication failed. Please check API configuration.")

  let rate_limit_error = api.RateLimitError
  api.error_to_string(rate_limit_error)
  |> should.equal("Too many requests. Please wait a moment and try again.")
}

// Test search query validation and sanitization
// Requirements: 3.1, 3.4
pub fn search_query_validation_test() {
  // Test empty query validation in API layer
  let empty_result = api.search_movies("")
  case empty_result {
    Error(api.ParseError(_)) -> should.equal(True, True)
    _ -> should.equal(True, False)
  }

  // Test whitespace-only query validation in API layer
  let whitespace_result = api.search_movies("   ")
  case whitespace_result {
    Error(api.ParseError(_)) -> should.equal(True, True)
    _ -> should.equal(True, False)
  }

  // Test tab and newline characters
  let special_chars_result = api.search_movies("\t\n  \r")
  case special_chars_result {
    Error(api.ParseError(_)) -> should.equal(True, True)
    _ -> should.equal(True, False)
  }
}

// Test complete user interaction flow with multiple searches
// Requirements: 1.5, 3.5
pub fn multiple_searches_workflow_test() {
  let initial_model = models.init()

  // First search
  let #(query1_model, _) =
    messages.update(initial_model, models.SearchQueryChanged("batman"))
  let #(loading1_model, _) =
    messages.update(query1_model, models.SearchSubmitted)

  let movies1 = [
    models.new_movie(1, "Batman", "Dark Knight", "2008", None, 9.0),
  ]
  let #(results1_model, _) =
    messages.update(loading1_model, models.MoviesLoaded(Ok(movies1)))

  results1_model.movies |> should.equal(movies1)
  results1_model.loading |> should.equal(False)
  results1_model.error |> should.equal(None)

  // Second search - should clear previous results
  let #(query2_model, _) =
    messages.update(results1_model, models.SearchQueryChanged("superman"))
  let #(loading2_model, _) =
    messages.update(query2_model, models.SearchSubmitted)

  loading2_model.search_query |> should.equal("superman")
  loading2_model.movies |> should.equal([])
  // Previous results cleared
  loading2_model.loading |> should.equal(True)
  loading2_model.error |> should.equal(None)

  let movies2 = [
    models.new_movie(2, "Superman", "Man of Steel", "2013", None, 7.0),
  ]
  let #(results2_model, _) =
    messages.update(loading2_model, models.MoviesLoaded(Ok(movies2)))

  results2_model.movies |> should.equal(movies2)
  results2_model.search_query |> should.equal("superman")
}

// Test error recovery workflow
// Requirements: 3.1, 3.2, 3.3, 3.4
pub fn error_recovery_workflow_test() {
  let initial_model = models.init()
  let query_model = models.set_search_query(initial_model, "test")
  let #(loading_model, _) = messages.update(query_model, models.SearchSubmitted)

  // Simulate API error
  let error_message = "Network error occurred"
  let #(error_model, _) =
    messages.update(loading_model, models.MoviesLoaded(Error(error_message)))

  error_model.error |> should.equal(Some(error_message))
  error_model.loading |> should.equal(False)

  // User clears error
  let #(cleared_model, _) = messages.update(error_model, models.ClearError)
  cleared_model.error |> should.equal(None)

  // User tries search again
  let #(retry_loading_model, _) =
    messages.update(cleared_model, models.SearchSubmitted)
  retry_loading_model.loading |> should.equal(True)
  retry_loading_model.error |> should.equal(None)

  // This time it succeeds
  let movies = [models.new_movie(1, "Test Movie", "Test", "2023", None, 8.0)]
  let #(success_model, _) =
    messages.update(retry_loading_model, models.MoviesLoaded(Ok(movies)))

  success_model.movies |> should.equal(movies)
  success_model.loading |> should.equal(False)
  success_model.error |> should.equal(None)
}

// Test view rendering with different model states
// Requirements: 1.5, 3.5
pub fn view_rendering_states_test() {
  // Test initial state view
  let initial_model = models.init()
  let initial_view = views.view(initial_model)
  // View should render without errors (basic smoke test)
  case initial_view {
    _ -> should.equal(True, True)
  }

  // Test loading state view
  let loading_model =
    models.Model(search_query: "batman", movies: [], loading: True, error: None)
  let loading_view = views.view(loading_model)
  case loading_view {
    _ -> should.equal(True, True)
  }

  // Test error state view
  let error_model =
    models.Model(
      search_query: "batman",
      movies: [],
      loading: False,
      error: Some("Test error message"),
    )
  let error_view = views.view(error_model)
  case error_view {
    _ -> should.equal(True, True)
  }

  // Test results state view
  let results_model =
    models.Model(
      search_query: "batman",
      movies: [
        models.new_movie(1, "Batman", "Hero", "2008", Some("/poster.jpg"), 9.0),
      ],
      loading: False,
      error: None,
    )
  let results_view = views.view(results_model)
  case results_view {
    _ -> should.equal(True, True)
  }
}
