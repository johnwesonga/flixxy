import envoy
import flixxy/messages
import flixxy/models.{type Model, type Msg}
import flixxy/views
import gleam/io
import gleam/result
import lustre
import lustre/effect.{type Effect}
import lustre/element.{type Element}

pub type Config {
  Config(api_key: String)
}

fn get_env(key: String) -> Result(String, Nil) {
  use value <- result.try(envoy.get(key))
  Ok(value)
}

// Initialize the model with no effects
fn init(_flags) -> #(Model, Effect(Msg)) {
  #(models.init(), effect.none())
}

// Update function to handle messages and return effects
fn update(model: Model, msg: Msg) -> #(Model, Effect(Msg)) {
  messages.update(model, msg)
}

// View function to render the UI
fn view(model: Model) -> Element(Msg) {
  views.view(model)
}

pub fn main() -> Nil {
  //let assert Ok(api_key) = envoy.get("TMDB_API_KEY")
  let app = lustre.application(init, update, view)
  //let assert Ok(api_key) = get_env("TMDB_API_KEY")

  //io.print("api key" <> api_key)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}
