// View functions for rendering the Flixxy movie search UI

import flixxy/models.{type Model, type Movie, type Msg}
import gleam/list
import gleam/option.{None, Some}
import gleam/string
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/event

// Main view function to render the complete application UI
pub fn view(model: Model) -> Element(Msg) {
  html.div([attribute.class("app")], [
    render_header(model),
    render_main_content(model),
  ])
}

// Render the header section with search functionality
fn render_header(model: Model) -> Element(Msg) {
  html.header([attribute.class("header")], [
    html.h1([attribute.class("app-title")], [
      element.text("Flixxy - Movie Search"),
    ]),
    render_search_section(model),
  ])
}

// Render the search input and button section
fn render_search_section(model: Model) -> Element(Msg) {
  html.div([attribute.class("search-container")], [
    render_search_input(model),
    render_search_button(model),
  ])
}

// Render the search input field with proper event handlers
fn render_search_input(model: Model) -> Element(Msg) {
  html.input([
    attribute.type_("text"),
    attribute.class("search-input"),
    attribute.placeholder("Search for movies..."),
    attribute.value(model.search_query),
    event.on_input(models.SearchQueryChanged),
  ])
}

// Render the search button with click event handling
fn render_search_button(model: Model) -> Element(Msg) {
  let button_class = case model.loading {
    True -> "search-button search-button--loading"
    False -> "search-button"
  }

  html.button(
    [
      attribute.type_("button"),
      attribute.class(button_class),
      attribute.disabled(model.loading),
      event.on_click(models.SearchSubmitted),
    ],
    [
      case model.loading {
        True -> element.text("Searching...")
        False -> element.text("Search")
      },
    ],
  )
}

// Render the main content area
fn render_main_content(model: Model) -> Element(Msg) {
  html.main([attribute.class("main-content")], [
    render_loading_state(model),
    render_error_state(model),
    render_results_section(model),
  ])
}

// Render loading state indicator
fn render_loading_state(model: Model) -> Element(Msg) {
  case model.loading {
    True ->
      html.div([attribute.class("loading-container")], [
        html.div([attribute.class("loading-spinner")], []),
        html.p([attribute.class("loading-text")], [
          element.text("Searching for movies..."),
        ]),
      ])
    False -> html.div([], [])
  }
}

// Render error state with dismiss functionality
fn render_error_state(model: Model) -> Element(Msg) {
  case model.error {
    Some(error_msg) ->
      html.div([attribute.class("error-container")], [
        html.div([attribute.class("error-message")], [
          html.p([], [element.text(error_msg)]),
          html.button(
            [
              attribute.type_("button"),
              attribute.class("error-dismiss-button"),
              event.on_click(models.ClearError),
            ],
            [element.text("Dismiss")],
          ),
        ]),
      ])
    None -> html.div([], [])
  }
}

// Render the results section with movie grid
fn render_results_section(model: Model) -> Element(Msg) {
  case model.loading, model.error {
    True, _ -> html.div([], [])
    _, Some(_) -> html.div([], [])
    False, None ->
      case model.movies {
        [] -> render_empty_results(model)
        movies -> render_movie_grid(movies)
      }
  }
}

// Render empty results state
fn render_empty_results(model: Model) -> Element(Msg) {
  case model.search_query {
    "" -> html.div([], [])
    _ ->
      html.div([attribute.class("empty-results")], [
        html.p([attribute.class("empty-results-text")], [
          element.text("No movies found matching your search."),
        ]),
      ])
  }
}

// Render the movie grid layout
fn render_movie_grid(movies: List(Movie)) -> Element(Msg) {
  html.div([attribute.class("results-container")], [
    html.div(
      [attribute.class("movies-grid")],
      list.map(movies, render_movie_card),
    ),
  ])
}

// Render individual movie card component
fn render_movie_card(movie: Movie) -> Element(Msg) {
  html.div([attribute.class("movie-card")], [
    render_movie_poster(movie),
    render_movie_details(movie),
  ])
}

// Render movie poster with placeholder fallback and responsive sizing
fn render_movie_poster(movie: Movie) -> Element(Msg) {
  html.div([attribute.class("movie-poster-container")], [
    case movie.poster_path {
      Some(poster_path) ->
        html.picture([attribute.class("movie-poster-picture")], [
          // High resolution for larger screens
          html.source([
            attribute.attribute("media", "(min-width: 768px)"),
            attribute.attribute(
              "srcset",
              build_poster_url_with_size(poster_path, "w780"),
            ),
          ]),
          // Medium resolution for tablets
          html.source([
            attribute.attribute("media", "(min-width: 480px)"),
            attribute.attribute(
              "srcset",
              build_poster_url_with_size(poster_path, "w500"),
            ),
          ]),
          // Default resolution for mobile
          html.img([
            attribute.class("movie-poster"),
            attribute.src(build_poster_url_with_size(poster_path, "w342")),
            attribute.alt("Poster for " <> movie.title),
            attribute.attribute("loading", "lazy"),
          ]),
        ])
      None ->
        html.div([attribute.class("movie-poster-placeholder")], [
          html.div([attribute.class("poster-placeholder-icon")], [
            element.text("🎬"),
          ]),
          html.p([attribute.class("poster-placeholder-text")], [
            element.text("No Image"),
          ]),
        ])
    },
  ])
}

// Render movie details section
fn render_movie_details(movie: Movie) -> Element(Msg) {
  html.div([attribute.class("movie-details")], [
    html.h3([attribute.class("movie-title")], [element.text(movie.title)]),
    render_movie_year(movie),
    html.p([attribute.class("movie-overview")], [
      element.text(truncate_overview(movie.overview)),
    ]),
  ])
}

// Render movie release year
fn render_movie_year(movie: Movie) -> Element(Msg) {
  let year = extract_year_from_date(movie.release_date)
  case year {
    "" -> html.div([], [])
    year_str ->
      html.p([attribute.class("movie-year")], [
        element.text("(" <> year_str <> ")"),
      ])
  }
}

// Helper function to build poster URL with specific size
fn build_poster_url_with_size(poster_path: String, size: String) -> String {
  "https://image.tmdb.org/t/p/" <> size <> poster_path
}

// Helper function to extract year from release date
fn extract_year_from_date(release_date: String) -> String {
  case string.split(release_date, "-") {
    [year, ..] -> year
    [] -> ""
  }
}

// Helper function to truncate overview text
fn truncate_overview(overview: String) -> String {
  case string.length(overview) > 150 {
    True -> string.slice(overview, 0, 147) <> "..."
    False -> overview
  }
}
