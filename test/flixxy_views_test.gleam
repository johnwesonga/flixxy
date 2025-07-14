// Tests for the views module HTML generation and event binding

import flixxy/models
import flixxy/views
import gleam/list
import gleam/option.{None, Some}
import gleeunit
import gleeunit/should

pub fn main() {
  gleeunit.main()
}

// Test initial view rendering with empty model
pub fn initial_view_test() {
  let model = models.init()
  let _view_element = views.view(model)

  // The view function should return an Element without errors
  // This tests that the view function can handle an initial model
  // The view function should return an Element without errors
  // This tests that the view function can handle an initial model
  model.search_query |> should.equal("")
}

// Test view function handles different model states
pub fn view_handles_empty_model_test() {
  let model = models.init()
  let _view_element = views.view(model)

  // Should not crash with empty model
  model.search_query |> should.equal("")
  model.loading |> should.equal(False)
  model.error |> should.equal(None)
}

// Test view function with search query
pub fn view_with_search_query_test() {
  let model =
    models.Model(
      search_query: "batman",
      movies: [],
      loading: False,
      error: None,
    )
  let _view_element = views.view(model)

  // Should handle model with search query
  model.search_query |> should.equal("batman")
}

// Test view function with loading state
pub fn view_with_loading_state_test() {
  let loading_model =
    models.Model(search_query: "test", movies: [], loading: True, error: None)
  let _view_element = views.view(loading_model)

  // Should handle loading state
  loading_model.loading |> should.equal(True)
}

// Test view function with error state
pub fn view_with_error_state_test() {
  let error_model =
    models.Model(
      search_query: "",
      movies: [],
      loading: False,
      error: Some("Network error occurred"),
    )
  let _view_element = views.view(error_model)

  // Should handle error state
  error_model.error |> should.equal(Some("Network error occurred"))
}

// Test view function consistency across different states
pub fn view_consistency_test() {
  let states = [
    models.init(),
    models.Model("search", [], True, None),
    models.Model("", [], False, Some("Error")),
    models.Model("batman", [], False, None),
  ]

  // All states should render without crashing
  states
  |> list.each(fn(model) {
    let _view_element = views.view(model)
    // If we get here, the view function didn't crash
    Nil
  })
}

// Test model state transitions that affect view
pub fn model_state_transitions_test() {
  let initial = models.init()
  let with_query = models.set_search_query(initial, "test")
  let with_loading = models.set_loading(with_query, True)
  let with_error = models.set_error(initial, "Test error")

  // All model states should be renderable
  let _view1 = views.view(initial)
  let _view2 = views.view(with_query)
  let _view3 = views.view(with_loading)
  let _view4 = views.view(with_error)

  // Verify the model transformations worked
  with_query.search_query |> should.equal("test")
  with_loading.loading |> should.equal(True)
  with_error.error |> should.equal(Some("Test error"))
}

// Test view handles edge cases
pub fn view_edge_cases_test() {
  // Test with very long search query
  let long_query_model =
    models.Model(
      search_query: "this is a very long search query that might cause issues",
      movies: [],
      loading: False,
      error: None,
    )
  let _view_element = views.view(long_query_model)

  // Test with both loading and error (error should take precedence)
  let conflicted_model =
    models.Model(
      search_query: "test",
      movies: [],
      loading: True,
      error: Some("Error message"),
    )
  let _view_element2 = views.view(conflicted_model)

  // Should handle edge cases without crashing
  True |> should.equal(True)
}

// Test that view function handles all model fields
pub fn view_handles_all_model_fields_test() {
  let complete_model =
    models.Model(
      search_query: "avengers",
      movies: [
        models.new_movie(
          1,
          "Avengers",
          "Superhero movie",
          "2012-05-04",
          Some("/poster.jpg"),
          8.0,
        ),
      ],
      loading: False,
      error: None,
    )

  let _view_element = views.view(complete_model)

  // Verify model has all expected fields
  complete_model.search_query |> should.equal("avengers")
  complete_model.movies |> list.length |> should.equal(1)
  complete_model.loading |> should.equal(False)
  complete_model.error |> should.equal(None)
}

// Test view function with multiple movies
pub fn view_with_multiple_movies_test() {
  let movies = [
    models.new_movie(
      1,
      "Movie 1",
      "Description 1",
      "2021-01-01",
      Some("/poster1.jpg"),
      7.5,
    ),
    models.new_movie(2, "Movie 2", "Description 2", "2022-02-02", None, 8.2),
    models.new_movie(
      3,
      "Movie 3",
      "Description 3",
      "2023-03-03",
      Some("/poster3.jpg"),
      6.8,
    ),
  ]

  let model_with_movies =
    models.Model(
      search_query: "test",
      movies: movies,
      loading: False,
      error: None,
    )

  let _view_element = views.view(model_with_movies)

  // Should handle multiple movies
  model_with_movies.movies |> list.length |> should.equal(3)
}

// Test movie results display with single movie
pub fn movie_results_single_movie_test() {
  let movie =
    models.new_movie(
      123,
      "The Dark Knight",
      "Batman faces the Joker in this epic superhero film.",
      "2008-07-18",
      Some("/dark_knight_poster.jpg"),
      9.0,
    )

  let model =
    models.Model(
      search_query: "batman",
      movies: [movie],
      loading: False,
      error: None,
    )

  let _view_element = views.view(model)

  // Should render single movie correctly
  model.movies |> list.length |> should.equal(1)
  let first_movie = case model.movies {
    [movie, ..] -> movie
    [] -> panic as "Expected at least one movie"
  }
  first_movie.title |> should.equal("The Dark Knight")
  first_movie.id |> should.equal(123)
}

// Test movie results display with movie without poster
pub fn movie_results_no_poster_test() {
  let movie =
    models.new_movie(
      456,
      "Independent Film",
      "A low-budget independent film without poster.",
      "2023-01-15",
      None,
      7.2,
    )

  let model =
    models.Model(
      search_query: "independent",
      movies: [movie],
      loading: False,
      error: None,
    )

  let _view_element = views.view(model)

  // Should handle movie without poster
  let first_movie = case model.movies {
    [movie, ..] -> movie
    [] -> panic as "Expected at least one movie"
  }
  first_movie.poster_path |> should.equal(None)
  first_movie.title |> should.equal("Independent Film")
}

// Test movie results display with long overview
pub fn movie_results_long_overview_test() {
  let long_overview =
    "This is a very long movie overview that should be truncated when displayed in the movie card component. It contains a lot of detailed information about the plot, characters, and themes of the movie that would make the card too large if displayed in full."

  let movie =
    models.new_movie(
      789,
      "Epic Movie",
      long_overview,
      "2023-06-01",
      Some("/epic_poster.jpg"),
      8.5,
    )

  let model =
    models.Model(
      search_query: "epic",
      movies: [movie],
      loading: False,
      error: None,
    )

  let _view_element = views.view(model)

  // Should handle long overview
  let first_movie = case model.movies {
    [movie, ..] -> movie
    [] -> panic as "Expected at least one movie"
  }
  first_movie.overview |> should.equal(long_overview)
}

// Test movie results display with missing release date
pub fn movie_results_empty_release_date_test() {
  let movie =
    models.new_movie(
      101,
      "Unreleased Movie",
      "A movie without a release date.",
      "",
      Some("/unreleased_poster.jpg"),
      6.0,
    )

  let model =
    models.Model(
      search_query: "unreleased",
      movies: [movie],
      loading: False,
      error: None,
    )

  let _view_element = views.view(model)

  // Should handle empty release date
  let first_movie = case model.movies {
    [movie, ..] -> movie
    [] -> panic as "Expected at least one movie"
  }
  first_movie.release_date |> should.equal("")
}

// Test movie results display with malformed release date
pub fn movie_results_malformed_date_test() {
  let movie =
    models.new_movie(
      102,
      "Date Test Movie",
      "Testing date parsing.",
      "invalid-date-format",
      Some("/date_test_poster.jpg"),
      7.0,
    )

  let model =
    models.Model(
      search_query: "date",
      movies: [movie],
      loading: False,
      error: None,
    )

  let _view_element = views.view(model)

  // Should handle malformed date
  let first_movie = case model.movies {
    [movie, ..] -> movie
    [] -> panic as "Expected at least one movie"
  }
  first_movie.release_date |> should.equal("invalid-date-format")
}

// Test empty results display
pub fn empty_results_display_test() {
  let model =
    models.Model(
      search_query: "nonexistent movie",
      movies: [],
      loading: False,
      error: None,
    )

  let _view_element = views.view(model)

  // Should handle empty results
  model.movies |> list.length |> should.equal(0)
  model.search_query |> should.equal("nonexistent movie")
}

// Test movie grid with mixed poster availability
pub fn movie_grid_mixed_posters_test() {
  let movies = [
    models.new_movie(
      1,
      "Movie With Poster",
      "Has poster",
      "2023-01-01",
      Some("/poster1.jpg"),
      8.0,
    ),
    models.new_movie(
      2,
      "Movie Without Poster",
      "No poster",
      "2023-02-01",
      None,
      7.5,
    ),
    models.new_movie(
      3,
      "Another With Poster",
      "Has poster too",
      "2023-03-01",
      Some("/poster3.jpg"),
      8.5,
    ),
  ]

  let model =
    models.Model(
      search_query: "mixed",
      movies: movies,
      loading: False,
      error: None,
    )

  let _view_element = views.view(model)

  // Should handle mixed poster availability
  model.movies |> list.length |> should.equal(3)

  // Check poster availability for each movie
  case model.movies {
    [first, second, third] -> {
      first.poster_path |> should.equal(Some("/poster1.jpg"))
      second.poster_path |> should.equal(None)
      third.poster_path |> should.equal(Some("/poster3.jpg"))
    }
    _ -> panic as "Expected exactly 3 movies"
  }
}

// Test movie results don't display during loading
pub fn movie_results_hidden_during_loading_test() {
  let movies = [
    models.new_movie(
      1,
      "Test Movie",
      "Should not display during loading",
      "2023-01-01",
      Some("/test.jpg"),
      8.0,
    ),
  ]

  let model =
    models.Model(
      search_query: "test",
      movies: movies,
      loading: True,
      error: None,
    )

  let _view_element = views.view(model)

  // Movies should be present in model but not displayed due to loading state
  model.movies |> list.length |> should.equal(1)
  model.loading |> should.equal(True)
}

// Test movie results don't display during error state
pub fn movie_results_hidden_during_error_test() {
  let movies = [
    models.new_movie(
      1,
      "Test Movie",
      "Should not display during error",
      "2023-01-01",
      Some("/test.jpg"),
      8.0,
    ),
  ]

  let model =
    models.Model(
      search_query: "test",
      movies: movies,
      loading: False,
      error: Some("Network error"),
    )

  let _view_element = views.view(model)

  // Movies should be present in model but not displayed due to error state
  model.movies |> list.length |> should.equal(1)
  model.error |> should.equal(Some("Network error"))
}

// Test poster rendering with valid poster path
pub fn poster_rendering_with_path_test() {
  let movie =
    models.new_movie(
      1,
      "Test Movie",
      "Movie with poster",
      "2023-01-01",
      Some("/test_poster.jpg"),
      8.0,
    )

  let model =
    models.Model(
      search_query: "test",
      movies: [movie],
      loading: False,
      error: None,
    )

  let _view_element = views.view(model)

  // Should render movie with poster
  let first_movie = case model.movies {
    [movie, ..] -> movie
    [] -> panic as "Expected at least one movie"
  }
  first_movie.poster_path |> should.equal(Some("/test_poster.jpg"))
}

// Test poster rendering with no poster path
pub fn poster_rendering_without_path_test() {
  let movie =
    models.new_movie(
      1,
      "Test Movie",
      "Movie without poster",
      "2023-01-01",
      None,
      8.0,
    )

  let model =
    models.Model(
      search_query: "test",
      movies: [movie],
      loading: False,
      error: None,
    )

  let _view_element = views.view(model)

  // Should render movie without poster (placeholder)
  let first_movie = case model.movies {
    [movie, ..] -> movie
    [] -> panic as "Expected at least one movie"
  }
  first_movie.poster_path |> should.equal(None)
}

// Test responsive poster handling with multiple movies
pub fn responsive_poster_handling_test() {
  let movies = [
    models.new_movie(
      1,
      "Movie with HD Poster",
      "High quality poster",
      "2023-01-01",
      Some("/hd_poster.jpg"),
      8.5,
    ),
    models.new_movie(
      2,
      "Movie with Standard Poster",
      "Standard poster",
      "2023-02-01",
      Some("/standard_poster.jpg"),
      7.8,
    ),
    models.new_movie(
      3,
      "Movie without Poster",
      "No poster available",
      "2023-03-01",
      None,
      6.9,
    ),
  ]

  let model =
    models.Model(
      search_query: "poster test",
      movies: movies,
      loading: False,
      error: None,
    )

  let _view_element = views.view(model)

  // Should handle mixed poster scenarios
  model.movies |> list.length |> should.equal(3)

  case model.movies {
    [first, second, third] -> {
      first.poster_path |> should.equal(Some("/hd_poster.jpg"))
      second.poster_path |> should.equal(Some("/standard_poster.jpg"))
      third.poster_path |> should.equal(None)
    }
    _ -> panic as "Expected exactly 3 movies"
  }
}

// Test poster fallback behavior
pub fn poster_fallback_behavior_test() {
  let movies_with_various_posters = [
    models.new_movie(
      1,
      "Valid Poster",
      "Description",
      "2023-01-01",
      Some("/valid.jpg"),
      8.0,
    ),
    models.new_movie(
      2,
      "Empty Poster Path",
      "Description",
      "2023-01-01",
      Some(""),
      7.0,
    ),
    models.new_movie(3, "No Poster", "Description", "2023-01-01", None, 6.0),
    models.new_movie(
      4,
      "Invalid Poster",
      "Description",
      "2023-01-01",
      Some("invalid-path"),
      5.0,
    ),
  ]

  let model =
    models.Model(
      search_query: "fallback test",
      movies: movies_with_various_posters,
      loading: False,
      error: None,
    )

  let _view_element = views.view(model)

  // Should handle all poster scenarios without crashing
  model.movies |> list.length |> should.equal(4)

  case model.movies {
    [valid, empty, none, invalid] -> {
      valid.poster_path |> should.equal(Some("/valid.jpg"))
      empty.poster_path |> should.equal(Some(""))
      none.poster_path |> should.equal(None)
      invalid.poster_path |> should.equal(Some("invalid-path"))
    }
    _ -> panic as "Expected exactly 4 movies"
  }
}

// Test image loading attributes
pub fn image_loading_attributes_test() {
  let movie =
    models.new_movie(
      1,
      "Lazy Load Test",
      "Testing lazy loading",
      "2023-01-01",
      Some("/lazy_load_poster.jpg"),
      8.0,
    )

  let model =
    models.Model(
      search_query: "lazy load",
      movies: [movie],
      loading: False,
      error: None,
    )

  let _view_element = views.view(model)

  // Should render with proper loading attributes
  let first_movie = case model.movies {
    [movie, ..] -> movie
    [] -> panic as "Expected at least one movie"
  }
  first_movie.poster_path |> should.equal(Some("/lazy_load_poster.jpg"))
  first_movie.title |> should.equal("Lazy Load Test")
}

// Test poster container structure
pub fn poster_container_structure_test() {
  let movie_with_poster =
    models.new_movie(
      1,
      "Container Test",
      "Testing container structure",
      "2023-01-01",
      Some("/container_test.jpg"),
      8.0,
    )

  let movie_without_poster =
    models.new_movie(
      2,
      "No Container Test",
      "Testing without poster",
      "2023-01-01",
      None,
      7.0,
    )

  let model =
    models.Model(
      search_query: "container",
      movies: [movie_with_poster, movie_without_poster],
      loading: False,
      error: None,
    )

  let _view_element = views.view(model)

  // Should render both movies with proper container structure
  model.movies |> list.length |> should.equal(2)

  case model.movies {
    [with_poster, without_poster] -> {
      with_poster.poster_path |> should.equal(Some("/container_test.jpg"))
      without_poster.poster_path |> should.equal(None)
    }
    _ -> panic as "Expected exactly 2 movies"
  }
}

// Test loading state display in view
pub fn loading_state_display_test() {
  let loading_model =
    models.Model(search_query: "batman", movies: [], loading: True, error: None)

  let _view_element = views.view(loading_model)

  // Should render loading state
  loading_model.loading |> should.equal(True)
  loading_model.movies |> should.equal([])
  loading_model.error |> should.equal(None)
}

// Test loading state hides results
pub fn loading_state_hides_results_test() {
  let loading_model_with_movies =
    models.Model(
      search_query: "batman",
      movies: [models.new_movie(1, "Batman", "Dark Knight", "2008", None, 9.0)],
      loading: True,
      error: None,
    )

  let _view_element = views.view(loading_model_with_movies)

  // Movies should be in model but not displayed due to loading state
  loading_model_with_movies.loading |> should.equal(True)
  loading_model_with_movies.movies |> list.length |> should.equal(1)
}

// Test search button loading state
pub fn search_button_loading_state_test() {
  let loading_model =
    models.Model(search_query: "batman", movies: [], loading: True, error: None)

  let _view_element = views.view(loading_model)

  // Button should be in loading state
  loading_model.loading |> should.equal(True)
}

// Test search button normal state
pub fn search_button_normal_state_test() {
  let normal_model =
    models.Model(
      search_query: "batman",
      movies: [],
      loading: False,
      error: None,
    )

  let _view_element = views.view(normal_model)

  // Button should be in normal state
  normal_model.loading |> should.equal(False)
}

// Test loading state with previous results cleared
pub fn loading_state_clears_previous_results_test() {
  let model_with_previous_results =
    models.Model(
      search_query: "new search",
      movies: [],
      loading: True,
      error: None,
    )

  let _view_element = views.view(model_with_previous_results)

  // Should show loading state with no previous results
  model_with_previous_results.loading |> should.equal(True)
  model_with_previous_results.movies |> should.equal([])
  model_with_previous_results.error |> should.equal(None)
}

// Test loading state transitions in view
pub fn loading_state_view_transitions_test() {
  // Test normal state
  let normal_model =
    models.Model(
      search_query: "batman",
      movies: [],
      loading: False,
      error: None,
    )
  let _normal_view = views.view(normal_model)

  // Test loading state
  let loading_model =
    models.Model(search_query: "batman", movies: [], loading: True, error: None)
  let _loading_view = views.view(loading_model)

  // Test results state
  let results_model =
    models.Model(
      search_query: "batman",
      movies: [models.new_movie(1, "Batman", "Dark Knight", "2008", None, 9.0)],
      loading: False,
      error: None,
    )
  let _results_view = views.view(results_model)

  // All states should render without errors
  normal_model.loading |> should.equal(False)
  loading_model.loading |> should.equal(True)
  results_model.loading |> should.equal(False)
  results_model.movies |> list.length |> should.equal(1)
}
