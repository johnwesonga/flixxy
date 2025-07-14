// API integration tests to verify actual API functionality
import flixxy/api
import gleam/option.{None, Some}
import gleeunit
import gleeunit/should

pub fn main() {
  gleeunit.main()
}

// Test API error handling for empty query
pub fn api_empty_query_test() {
  let result = api.search_movies("")
  case result {
    Error(api.ParseError(_)) -> should.equal(True, True)
    _ -> should.equal(True, False)
  }
}

// Test API error handling for whitespace-only query
pub fn api_whitespace_query_test() {
  let result = api.search_movies("   ")
  case result {
    Error(api.ParseError(_)) -> should.equal(True, True)
    _ -> should.equal(True, False)
  }
}

// Test poster URL construction
pub fn poster_url_construction_test() {
  // Test with valid poster path
  let poster_path = Some("/abc123.jpg")
  let poster_url = api.get_poster_url(poster_path)
  poster_url |> should.equal(Some("https://image.tmdb.org/t/p/w500/abc123.jpg"))

  // Test with None poster path
  let no_poster = api.get_poster_url(None)
  no_poster |> should.equal(None)
}

// Test poster URL construction with custom size
pub fn poster_url_with_size_test() {
  let poster_path = Some("/abc123.jpg")
  let poster_url = api.get_poster_url_with_size(poster_path, "w300")
  poster_url |> should.equal(Some("https://image.tmdb.org/t/p/w300/abc123.jpg"))

  let no_poster = api.get_poster_url_with_size(None, "w300")
  no_poster |> should.equal(None)
}

// Test responsive poster URLs
pub fn responsive_poster_urls_test() {
  let poster_path = Some("/abc123.jpg")
  let #(mobile, tablet, desktop) = api.get_responsive_poster_urls(poster_path)

  mobile |> should.equal(Some("https://image.tmdb.org/t/p/w342/abc123.jpg"))
  tablet |> should.equal(Some("https://image.tmdb.org/t/p/w500/abc123.jpg"))
  desktop |> should.equal(Some("https://image.tmdb.org/t/p/w780/abc123.jpg"))

  let #(no_mobile, no_tablet, no_desktop) = api.get_responsive_poster_urls(None)
  no_mobile |> should.equal(None)
  no_tablet |> should.equal(None)
  no_desktop |> should.equal(None)
}

// Test poster path validation
pub fn poster_path_validation_test() {
  // Valid poster path
  api.is_valid_poster_path(Some("/abc123.jpg")) |> should.equal(True)

  // Invalid poster paths
  api.is_valid_poster_path(Some("abc123.jpg")) |> should.equal(False)
  // No leading slash
  api.is_valid_poster_path(Some("/")) |> should.equal(False)
  // Just slash
  api.is_valid_poster_path(Some("")) |> should.equal(False)
  // Empty string
  api.is_valid_poster_path(None) |> should.equal(False)
  // None
}

// Test release year extraction
pub fn release_year_extraction_test() {
  // Valid date format
  api.get_release_year("2008-07-18") |> should.equal("2008")

  // Different valid date format
  api.get_release_year("2005-06-15") |> should.equal("2005")

  // Empty date
  api.get_release_year("") |> should.equal("")

  // Invalid date format
  api.get_release_year("invalid") |> should.equal("invalid")
}
