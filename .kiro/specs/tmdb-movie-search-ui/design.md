# Design Document

## Overview

The TMDB Movie Search UI will be implemented as a Single Page Application using Gleam's Lustre framework. The application will follow the Model-View-Update (MVU) architecture pattern that Lustre provides, creating a reactive and maintainable user interface for movie searching functionality.

The design focuses on creating a clean, responsive interface that efficiently communicates with the TMDB API while providing excellent user experience through proper loading states, error handling, and responsive design.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Lustre App    │    │   HTTP Client   │    │   TMDB API      │
│   (Frontend)    │◄──►│   (gleam_http)  │◄──►│   (External)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### MVU Pattern Implementation

- **Model**: Application state including search query, movie results, loading states, and error states
- **View**: HTML rendering functions that create the user interface based on current model state
- **Update**: Message handling functions that process user interactions and API responses

### Module Structure

```
src/
├── flixsta.gleam              # Main entry point and Lustre app initialization
├── flixsta/
│   ├── models.gleam           # Data types and model definitions
│   ├── api.gleam              # TMDB API client functions
│   ├── views.gleam            # HTML view rendering functions
│   └── messages.gleam         # Message types for MVU pattern
```

## Components and Interfaces

### Core Data Types

```gleam
// Movie data structure from TMDB API
pub type Movie {
  Movie(
    id: Int,
    title: String,
    overview: String,
    release_date: String,
    poster_path: Option(String),
    vote_average: Float,
  )
}

// Application state model
pub type Model {
  Model(
    search_query: String,
    movies: List(Movie),
    loading: Bool,
    error: Option(String),
  )
}

// Messages for state updates
pub type Msg {
  SearchQueryChanged(String)
  SearchSubmitted
  MoviesLoaded(Result(List(Movie), String))
  ClearError
}
```

### API Interface

The TMDB API integration will use the following endpoints:
- **Search Movies**: `GET /3/search/movie?api_key={key}&query={query}`
- **Image Base URL**: `https://image.tmdb.org/t/p/w500{poster_path}`

API client will handle:
- HTTP request construction with proper headers
- JSON response parsing
- Error handling for network and API errors
- Rate limiting considerations

### View Components

1. **Search Header Component**
   - Search input field with real-time validation
   - Search button with loading state
   - Application title and branding

2. **Movie Results Component**
   - Grid layout for movie cards
   - Individual movie card with poster, title, year, and overview
   - Placeholder handling for missing posters

3. **State Components**
   - Loading spinner during API requests
   - Error message display with retry options
   - Empty state for no results

## Data Models

### Movie Model
Represents a movie from TMDB API with essential display information:
- `id`: Unique identifier for the movie
- `title`: Movie title for display
- `overview`: Brief description/plot summary
- `release_date`: Release date (formatted as year for display)
- `poster_path`: Optional path to movie poster image
- `vote_average`: User rating score

### Application State Model
Manages the complete application state:
- `search_query`: Current search input value
- `movies`: List of movie results from last search
- `loading`: Boolean flag for loading state
- `error`: Optional error message for display

### API Response Models
Internal types for handling TMDB API responses:
- Raw JSON response parsing
- Error response handling
- Pagination support (for future enhancement)

## Error Handling

### Error Categories

1. **Network Errors**
   - Connection timeouts
   - DNS resolution failures
   - Server unavailability

2. **API Errors**
   - Invalid API key (401)
   - Rate limiting (429)
   - Invalid request format (400)
   - Resource not found (404)

3. **Client Errors**
   - Empty search queries
   - Invalid input characters
   - JSON parsing failures

### Error Handling Strategy

- All errors will be captured and converted to user-friendly messages
- Error state will be stored in the model and displayed in the UI
- Users will have options to retry failed requests
- Loading states will be properly cleared on errors

### Error Messages

- Network issues: "Unable to connect to movie database. Please check your connection and try again."
- API issues: "Movie service is temporarily unavailable. Please try again later."
- Empty search: "Please enter a movie title to search."
- No results: "No movies found matching your search."

## Testing Strategy

### Unit Testing Approach

1. **Model Testing**
   - Test state transitions for all message types
   - Validate initial state setup
   - Test error state handling

2. **API Client Testing**
   - Mock HTTP responses for successful requests
   - Test error response handling
   - Validate request URL construction

3. **View Testing**
   - Test HTML generation for different states
   - Validate conditional rendering logic
   - Test event handler attachment

### Test Structure

```gleam
// test/flixsta_test.gleam
import gleeunit
import gleeunit/should
import flixsta/models
import flixsta/api

pub fn main() {
  gleeunit.main()
}

pub fn initial_model_test() {
  let model = models.init()
  model.search_query |> should.equal("")
  model.movies |> should.equal([])
  model.loading |> should.equal(False)
  model.error |> should.equal(None)
}

pub fn search_query_update_test() {
  let model = models.init()
  let updated = models.update(model, messages.SearchQueryChanged("batman"))
  updated.search_query |> should.equal("batman")
}
```

### Integration Testing

- Test complete search flow from input to results display
- Validate error handling with simulated API failures
- Test responsive behavior across different screen sizes

## Implementation Notes

### Dependencies Required

The following packages need to be added to `gleam.toml`:
- `lustre` - Web framework for building the SPA
- `gleam_http` - HTTP client for API requests
- `gleam_json` - JSON parsing for API responses
- `gleam_uri` - URL construction and manipulation

### Configuration

- TMDB API key will need to be configured (environment variable or config file)
- Base URLs for API and image CDN will be configurable
- Development vs production build configurations

### Performance Considerations

- Debounce search input to avoid excessive API calls
- Implement basic caching for repeated searches
- Lazy loading for movie poster images
- Responsive image sizing based on screen resolution

### Accessibility

- Proper ARIA labels for search functionality
- Keyboard navigation support
- Screen reader friendly error messages
- High contrast mode compatibility