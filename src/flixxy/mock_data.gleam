// Mock data for testing TMDB API responses
pub const mock_responses = [
  #(
    "batman",
    "{\"results\":[{\"id\":1,\"title\":\"Batman Begins\",\"overview\":\"Young Bruce Wayne becomes Batman\",\"release_date\":\"2005-06-15\",\"poster_path\":\"/batman_begins.jpg\",\"vote_average\":8.2},{\"id\":2,\"title\":\"The Dark Knight\",\"overview\":\"Batman faces the Joker\",\"release_date\":\"2008-07-18\",\"poster_path\":\"/dark_knight.jpg\",\"vote_average\":9.0}]}",
  ),
  #(
    "superman",
    "{\"results\":[{\"id\":3,\"title\":\"Superman\",\"overview\":\"Man of Steel\",\"release_date\":\"2013-06-14\",\"poster_path\":\"/superman.jpg\",\"vote_average\":7.0}]}",
  ),
  #(
    "avengers",
    "{\"results\":[{\"id\":4,\"title\":\"Avengers\",\"overview\":\"Superhero team\",\"release_date\":\"2012-05-04\",\"poster_path\":\"/avengers.jpg\",\"vote_average\":8.0}]}",
  ),
  #(
    "test",
    "{\"results\":[{\"id\":5,\"title\":\"Test Movie\",\"overview\":\"Test description\",\"release_date\":\"2023-01-01\",\"poster_path\":\"/test.jpg\",\"vote_average\":8.0}]}",
  ),
]
