import flixxy/messages
import flixxy/models
import gleam/option.{None, Some}
import gleeunit
import gleeunit/should

pub fn main() {
  gleeunit.main()
}

// Test SearchQueryChanged message handling
pub fn search_query_changed_test() {
  let initial_model = models.init()
  let #(updated_model, _effect) =
    messages.update(initial_model, models.SearchQueryChanged("batman"))

  updated_model.search_query |> should.equal("batman")
  updated_model.movies |> should.equal([])
  updated_model.loading |> should.equal(False)
  updated_model.error |> should.equal(None)
}

pub fn search_query_changed_empty_test() {
  let initial_model = models.init()
  let #(updated_model, _effect) =
    messages.update(initial_model, models.SearchQueryChanged(""))

  updated_model.search_query |> should.equal("")
  updated_model.movies |> should.equal([])
  updated_model.loading |> should.equal(False)
  updated_model.error |> should.equal(None)
}

// Test SearchSubmitted message handling
pub fn search_submitted_valid_query_test() {
  let model_with_query =
    models.Model(
      search_query: "batman",
      movies: [
        models.new_movie(1, "Old Movie", "Old overview", "2020", None, 7.5),
      ],
      loading: False,
      error: Some("Previous error"),
    )

  let #(updated_model, _effect) =
    messages.update(model_with_query, models.SearchSubmitted)

  updated_model.search_query |> should.equal("batman")
  updated_model.movies |> should.equal([])
  updated_model.loading |> should.equal(True)
  updated_model.error |> should.equal(None)
}

pub fn search_submitted_empty_query_test() {
  let model_with_empty_query =
    models.Model(search_query: "", movies: [], loading: False, error: None)

  let #(updated_model, _effect) =
    messages.update(model_with_empty_query, models.SearchSubmitted)

  updated_model.search_query |> should.equal("")
  updated_model.movies |> should.equal([])
  updated_model.loading |> should.equal(False)
  updated_model.error
  |> should.equal(Some("Please enter a movie title to search."))
}

// Test MoviesLoaded success message handling
pub fn movies_loaded_success_test() {
  let loading_model =
    models.Model(search_query: "batman", movies: [], loading: True, error: None)

  let test_movies = [
    models.new_movie(
      1,
      "Batman Begins",
      "Batman origin story",
      "2005",
      Some("/batman.jpg"),
      8.2,
    ),
    models.new_movie(
      2,
      "The Dark Knight",
      "Batman vs Joker",
      "2008",
      Some("/dark_knight.jpg"),
      9.0,
    ),
  ]

  let #(updated_model, _effect) =
    messages.update(loading_model, models.MoviesLoaded(Ok(test_movies)))

  updated_model.search_query |> should.equal("batman")
  updated_model.movies |> should.equal(test_movies)
  updated_model.loading |> should.equal(False)
  updated_model.error |> should.equal(None)
}

pub fn movies_loaded_empty_results_test() {
  let loading_model =
    models.Model(
      search_query: "nonexistentmovie",
      movies: [],
      loading: True,
      error: None,
    )

  let #(updated_model, _effect) =
    messages.update(loading_model, models.MoviesLoaded(Ok([])))

  updated_model.search_query |> should.equal("nonexistentmovie")
  updated_model.movies |> should.equal([])
  updated_model.loading |> should.equal(False)
  updated_model.error |> should.equal(None)
}

// Test MoviesLoaded error message handling
pub fn movies_loaded_network_error_test() {
  let loading_model =
    models.Model(search_query: "batman", movies: [], loading: True, error: None)

  let error_message =
    "Unable to connect to movie database. Please check your connection and try again."
  let #(updated_model, _effect) =
    messages.update(loading_model, models.MoviesLoaded(Error(error_message)))

  updated_model.search_query |> should.equal("batman")
  updated_model.movies |> should.equal([])
  updated_model.loading |> should.equal(False)
  updated_model.error |> should.equal(Some(error_message))
}

pub fn movies_loaded_api_error_test() {
  let loading_model =
    models.Model(search_query: "batman", movies: [], loading: True, error: None)

  let error_message =
    "Movie service is temporarily unavailable. Please try again later."
  let #(updated_model, _effect) =
    messages.update(loading_model, models.MoviesLoaded(Error(error_message)))

  updated_model.search_query |> should.equal("batman")
  updated_model.movies |> should.equal([])
  updated_model.loading |> should.equal(False)
  updated_model.error |> should.equal(Some(error_message))
}

// Test ClearError message handling
pub fn clear_error_test() {
  let model_with_error =
    models.Model(
      search_query: "batman",
      movies: [],
      loading: False,
      error: Some("Some error message"),
    )

  let #(updated_model, _effect) =
    messages.update(model_with_error, models.ClearError)

  updated_model.search_query |> should.equal("batman")
  updated_model.movies |> should.equal([])
  updated_model.loading |> should.equal(False)
  updated_model.error |> should.equal(None)
}

pub fn clear_error_no_error_test() {
  let model_without_error =
    models.Model(
      search_query: "batman",
      movies: [],
      loading: False,
      error: None,
    )

  let #(updated_model, _effect) =
    messages.update(model_without_error, models.ClearError)

  updated_model.search_query |> should.equal("batman")
  updated_model.movies |> should.equal([])
  updated_model.loading |> should.equal(False)
  updated_model.error |> should.equal(None)
}

// Test state transitions and edge cases
pub fn multiple_search_query_changes_test() {
  let initial_model = models.init()

  let #(model1, _effect1) =
    messages.update(initial_model, models.SearchQueryChanged("bat"))
  model1.search_query |> should.equal("bat")

  let #(model2, _effect2) =
    messages.update(model1, models.SearchQueryChanged("batman"))
  model2.search_query |> should.equal("batman")

  let #(model3, _effect3) =
    messages.update(model2, models.SearchQueryChanged(""))
  model3.search_query |> should.equal("")
}

pub fn search_submitted_clears_previous_state_test() {
  let model_with_data =
    models.Model(
      search_query: "new search",
      movies: [
        models.new_movie(1, "Old Movie", "Old overview", "2020", None, 7.5),
      ],
      loading: False,
      error: Some("Previous error"),
    )

  let updated_model = messages.update(model_with_data, models.SearchSubmitted)

  updated_model.search_query |> should.equal("new search")
  updated_model.movies |> should.equal([])
  updated_model.loading |> should.equal(True)
  updated_model.error |> should.equal(None)
}

pub fn error_state_overrides_loading_test() {
  let loading_model =
    models.Model(search_query: "batman", movies: [], loading: True, error: None)

  let error_message = "Network error"
  let updated_model =
    messages.update(loading_model, models.MoviesLoaded(Error(error_message)))

  updated_model.loading |> should.equal(False)
  updated_model.error |> should.equal(Some(error_message))
}

// Test loading state transitions - immediate loading on search submit
pub fn loading_state_immediate_transition_test() {
  let model =
    models.Model(
      search_query: "batman",
      movies: [],
      loading: False,
      error: None,
    )

  let updated_model = messages.update(model, models.SearchSubmitted)

  // Loading should be set to True immediately when search is submitted
  updated_model.loading |> should.equal(True)
  updated_model.error |> should.equal(None)
  updated_model.movies |> should.equal([])
}

// Test loading state clears on successful results
pub fn loading_state_clears_on_success_test() {
  let loading_model =
    models.Model(search_query: "batman", movies: [], loading: True, error: None)

  let test_movies = [
    models.new_movie(1, "Batman", "Dark Knight", "2008", None, 9.0),
  ]

  let updated_model =
    messages.update(loading_model, models.MoviesLoaded(Ok(test_movies)))

  // Loading should be False after successful results
  updated_model.loading |> should.equal(False)
  updated_model.movies |> should.equal(test_movies)
  updated_model.error |> should.equal(None)
}

// Test loading state clears on error
pub fn loading_state_clears_on_error_test() {
  let loading_model =
    models.Model(search_query: "batman", movies: [], loading: True, error: None)

  let error_message = "API Error"
  let updated_model =
    messages.update(loading_model, models.MoviesLoaded(Error(error_message)))

  // Loading should be False after error
  updated_model.loading |> should.equal(False)
  updated_model.error |> should.equal(Some(error_message))
  updated_model.movies |> should.equal([])
}

// Test multiple rapid search submissions maintain loading state properly
pub fn multiple_search_submissions_loading_test() {
  let initial_model = models.init()

  // First search
  let model1 = models.set_search_query(initial_model, "batman")
  let loading_model1 = messages.update(model1, models.SearchSubmitted)
  loading_model1.loading |> should.equal(True)

  // Second search while first is loading (simulates rapid user input)
  let model2 = models.set_search_query(loading_model1, "superman")
  let loading_model2 = messages.update(model2, models.SearchSubmitted)

  // Should still be loading and previous results cleared
  loading_model2.loading |> should.equal(True)
  loading_model2.movies |> should.equal([])
  loading_model2.search_query |> should.equal("superman")
}

// Test loading state with empty query validation
pub fn loading_state_empty_query_validation_test() {
  let model =
    models.Model(search_query: "", movies: [], loading: False, error: None)

  let updated_model = messages.update(model, models.SearchSubmitted)

  // Should not set loading state for empty query
  updated_model.loading |> should.equal(False)
  updated_model.error
  |> should.equal(Some("Please enter a movie title to search."))
}
