// Message types and update functions for the Flixxy movie search application

import flixxy/api
import flixxy/models.{type Model, type Movie, type Msg}
import lustre/effect.{type Effect}
import rsvp

// Update function to handle all message types and return effects
pub fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  case msg {
    models.SearchQueryChanged(query) ->
      handle_search_query_changed(model, query)
    models.SearchSubmitted -> handle_search_submitted(model)
    models.MoviesLoaded(result) -> handle_movies_loaded(model, result)
    models.MoviesLoadedLive(result) -> handle_movies_loaded_live(model, result)
    models.ClearError -> handle_clear_error(model)
  }
}

// Handle search query changes
fn handle_search_query_changed(
  model: Model,
  query: String,
) -> #(Model, Effect(Msg)) {
  #(models.set_search_query(model, query), effect.none())
}

// Handle search submission
fn handle_search_submitted(model: Model) -> #(Model, Effect(Msg)) {
  case model.search_query {
    "" -> #(
      models.set_error(model, "Please enter a movie title to search."),
      effect.none(),
    )
    _ -> {
      // Clear previous results and errors, set loading state
      let cleared_model = models.clear_error(model)
      let loading_model = models.set_loading(cleared_model, True)
      let updated_model = models.Model(..loading_model, movies: [])
      // let search_effect = api.make_api_request_live(model.search_query)
      // Create effect to perform API call
      // let search_effect =
      // effect.from(fn(dispatch) {
      //   let result = api.search_movies(model.search_query)
      //   case result {
      //    Ok(movies) -> dispatch(models.MoviesLoadedLive(Ok(movies)))
      //    Error(api_error) -> {
      //      let error_message = api.error_to_string(api_error)
      //     dispatch(models.MoviesLoaded(Error(error_message)))
      //   }
      //  }
      // })

      #(updated_model, api.make_api_request_live(model.search_query))
    }
  }
}

// Handle movies loaded from API
fn handle_movies_loaded(
  model: Model,
  result: Result(List(Movie), String),
) -> #(Model, Effect(Msg)) {
  case result {
    Ok(movies) -> #(models.set_movies(model, movies), effect.none())
    Error(error_msg) -> #(models.set_error(model, error_msg), effect.none())
  }
}

fn handle_movies_loaded_live(
  model: Model,
  result: Result(List(Movie), rsvp.Error),
) -> #(Model, Effect(Msg)) {
  case result {
    Ok(movies) -> #(models.set_movies(model, movies), effect.none())
    Error(error) -> {
      echo "Error loading movies: " <> decode_error_to_string(error)
      #(models.set_error(model, decode_error_to_string(error)), effect.none())
    }
  }
}

// Handle clearing error state
fn handle_clear_error(model: Model) -> #(Model, Effect(Msg)) {
  #(models.clear_error(model), effect.none())
}

fn decode_error_to_string(error: rsvp.Error) -> String {
  case error {
    rsvp.BadBody -> "Bad body"
    rsvp.BadUrl(err) -> "Bad URL: " <> err
    rsvp.HttpError(_) -> "HTTP error"
    rsvp.JsonError(_) -> "JSON decoding error"
    rsvp.NetworkError -> "Network error"
    rsvp.UnhandledResponse(_) -> "Unhandled response"
  }
}
