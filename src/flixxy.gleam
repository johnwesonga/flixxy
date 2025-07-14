import flixxy/messages
import flixxy/models.{type Model, type Msg}
import flixxy/views
import lustre
import lustre/effect.{type Effect}
import lustre/element.{type Element}

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
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)
  Nil
}
