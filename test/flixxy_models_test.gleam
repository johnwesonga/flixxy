import flixxy/models
import gleam/option.{None, Some}
import gleeunit
import gleeunit/should

pub fn main() {
  gleeunit.main()
}

// Test model initialization
pub fn init_model_test() {
  let model = models.init()

  model.search_query |> should.equal("")
  model.movies |> should.equal([])
  model.loading |> should.equal(False)
  model.error |> should.equal(None)
}

// Test movie creation
pub fn new_movie_test() {
  let movie =
    models.new_movie(
      123,
      "Test Movie",
      "A test movie overview",
      "2023-01-01",
      Some("/test-poster.jpg"),
      7.5,
    )

  movie.id |> should.equal(123)
  movie.title |> should.equal("Test Movie")
  movie.overview |> should.equal("A test movie overview")
  movie.release_date |> should.equal("2023-01-01")
  movie.poster_path |> should.equal(Some("/test-poster.jpg"))
  movie.vote_average |> should.equal(7.5)
}

// Test movie creation with no poster
pub fn new_movie_no_poster_test() {
  let movie =
    models.new_movie(
      456,
      "No Poster Movie",
      "A movie without a poster",
      "2023-02-01",
      None,
      6.0,
    )

  movie.poster_path |> should.equal(None)
}

// Test search query update
pub fn set_search_query_test() {
  let model = models.init()
  let updated_model = models.set_search_query(model, "batman")

  updated_model.search_query |> should.equal("batman")
  // Other fields should remain unchanged
  updated_model.movies |> should.equal([])
  updated_model.loading |> should.equal(False)
  updated_model.error |> should.equal(None)
}

// Test loading state update
pub fn set_loading_test() {
  let model = models.init()
  let loading_model = models.set_loading(model, True)

  loading_model.loading |> should.equal(True)
  // Other fields should remain unchanged
  loading_model.search_query |> should.equal("")
  loading_model.movies |> should.equal([])
  loading_model.error |> should.equal(None)
}

// Test movies update
pub fn set_movies_test() {
  let model =
    models.init()
    |> models.set_loading(True)
    |> models.set_error("Previous error")

  let test_movie =
    models.new_movie(
      1,
      "Test",
      "Test overview",
      "2023-01-01",
      Some("/test.jpg"),
      8.0,
    )

  let updated_model = models.set_movies(model, [test_movie])

  updated_model.movies |> should.equal([test_movie])
  updated_model.loading |> should.equal(False)
  updated_model.error |> should.equal(None)
}

// Test error state update
pub fn set_error_test() {
  let model =
    models.init()
    |> models.set_loading(True)

  let error_model = models.set_error(model, "Network error")

  error_model.error |> should.equal(Some("Network error"))
  error_model.loading |> should.equal(False)
}

// Test error clearing
pub fn clear_error_test() {
  let model =
    models.init()
    |> models.set_error("Some error")

  let cleared_model = models.clear_error(model)

  cleared_model.error |> should.equal(None)
}

// Test model state transitions
pub fn model_state_transitions_test() {
  let model = models.init()

  // Start search
  let searching_model =
    model
    |> models.set_search_query("avengers")
    |> models.set_loading(True)

  searching_model.search_query |> should.equal("avengers")
  searching_model.loading |> should.equal(True)

  // Complete search successfully
  let test_movie =
    models.new_movie(
      24_428,
      "The Avengers",
      "Earth's mightiest heroes must come together...",
      "2012-04-25",
      Some("/avengers-poster.jpg"),
      7.7,
    )

  let completed_model = models.set_movies(searching_model, [test_movie])

  completed_model.movies |> should.equal([test_movie])
  completed_model.loading |> should.equal(False)
  completed_model.error |> should.equal(None)
}

// Test model validation with empty values
pub fn model_validation_test() {
  let empty_model = models.init()

  // Should handle empty search query
  empty_model.search_query |> should.equal("")

  // Should handle empty movie list
  empty_model.movies |> should.equal([])

  // Should start with no error
  empty_model.error |> should.equal(None)
}
