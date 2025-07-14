# Project Structure

## Root Level
- `gleam.toml` - Project configuration, dependencies, and metadata
- `README.md` - Project documentation and usage examples
- `.gitignore` - Git ignore patterns

## Source Code Organization
```
src/
├── flixxy.gleam    # Main module and entry point
```

## Testing Organization
```
test/
├── flixxy_test.gleam    # Main test module
```

## Conventions

### Module Structure
- Main application logic in `src/` directory
- Each `.gleam` file represents a module
- Module names should match file names
- Entry point typically in main module (`src/flixxy.gleam`)

### Test Structure
- All tests in `test/` directory
- Test files should end with `_test.gleam`
- Test functions must end with `_test` suffix
- Main test runner in `test/flixsta_test.gleam`

### Import Conventions
- Standard library imports: `import gleam/io`, `import gleam/list`
- Local module imports: `import flixxy/module_name`
- External package imports: `import package_name`

### Function Organization
- Public functions use `pub fn` keyword
- Private functions use `fn` keyword
- Main entry point should be `pub fn main() -> Nil`