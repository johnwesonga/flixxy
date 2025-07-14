# Technology Stack

## Language & Runtime
- **Gleam**: Primary programming language
- **Gleam Standard Library**: Core dependency (>= 0.44.0 and < 2.0.0)

## Build System
- **Gleam CLI**: Native build system and package manager
- **gleam.toml**: Project configuration and dependency management

## Testing Framework
- **Gleeunit**: Testing framework (>= 1.0.0 and < 2.0.0)
- Test functions must end with `_test` suffix
- Uses `assert` for test assertions

## Common Commands

### Development
```sh
gleam run    # Run the project
gleam test   # Run the tests
gleam build  # Build the project
gleam check  # Type check without building
```

### Package Management
```sh
gleam add <package>     # Add dependency
gleam remove <package>  # Remove dependency
gleam deps download     # Download dependencies
```

### Documentation
```sh
gleam docs build  # Generate documentation
gleam docs publish # Publish to HexDocs
```

## Code Style
- Use snake_case for function and variable names
- Use PascalCase for types and constructors
- Follow Gleam's functional programming paradigms
- Prefer immutable data structures