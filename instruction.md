# Flask Sudoku Project Instructions

This project must follow modern, maintainable, and testable engineering practices. The goal is to build a clean Flask Sudoku application with well-separated concerns, strong validation, and a responsive UI.

## 1. Project goals

- Build a Sudoku web app using Flask.
- Keep backend logic, business rules, validation, and persistence separate from frontend behavior.
- Use modular, reusable code instead of large monolithic functions.
- Ensure UI works responsively across desktop, tablet, and mobile screens.
- Handle errors consistently and predictably.
- Prioritize readability, testability, and maintainability.

## 2. Python code quality standards

### 2.1 Use modern Python

- Target Python 3.11+ unless the project explicitly requires a different version.
- Use type hints for function parameters and return values.
- Prefer clear, descriptive names for variables, functions, classes, and modules.
- Keep functions small and focused on one task.
- Use dataclasses, enums, or small value objects when helpful.
- Avoid unnecessary dependencies and do not over-engineer the solution.
- Use list comprehensions and generator expressions only when they improve readability.
- Follow PEP 8 consistently.
- Prefer `pathlib` over older string-based filesystem code.

### 2.2 Keep code modular

- Split logic into separate modules based on responsibility:
  - `app.py` or `run.py` for app startup
  - `config.py` for configuration
  - `routes.py` or `views.py` for Flask route definitions
  - `services/` for game logic, puzzle generation, validation, solver logic
  - `utils/` for helper functions
  - `models.py` or domain objects for data structures
- Do not define Sudoku-solving logic directly inside route handlers.
- Do not place business rules in template files.
- Do not put validation, board generation, or game state logic in frontend JS.
- Keep route functions thin: parse request data, call a service, return a response.
- Use helper functions for repeated logic, not duplicated code blocks.

### 2.3 Prefer clean function design

- One function should do one job.
- Function names should describe the action, e.g.:
  - `generate_puzzle`
  - `validate_board`
  - `solve_board`
  - `normalize_user_input`
  - `create_game_state`
- Avoid hidden side effects in utility functions.
- Return explicit values rather than mutating unexpected global state.
- Do not use broad, unexplained globals.
- Keep arguments limited and simple.
- If a function becomes too long, split it into smaller helpers.

### 2.4 Avoid anti-patterns

- No embedded SQL or business logic in templates.
- No duplicate validation logic across multiple layers.
- No magic numbers without explanation.
- No dead code.
- No unused imports.
- No accidental silent failures.
- No broad `except:` blocks without logging or re-raising.
- No `print()` for production logging.
- No hardcoded secrets in source code.

## 3. Backend architecture

### 3.1 Flask app structure

- Keep Flask setup centralized.
- Use application factory patterns when appropriate.
- Define routes in dedicated files or Blueprints rather than one giant file.
- Keep configuration in environment variables or a config file.
- Avoid direct database or business logic in `app.py` if the app grows.

### 3.2 Business logic separation

The backend must clearly separate:

- Route handling
- Validation
- Sudoku logic
- Game state management
- Response formatting

Examples of responsibilities:

- `routes.py`: HTTP concerns only
- `services/sudoku_logic.py`: Sudoku rules and logic
- `services/puzzle_generator.py`: puzzle generation
- `services/solver.py`: solving algorithms
- `utils/validators.py`: board validation utilities
- `utils/helpers.py`: general support functions

### 3.3 Data flow

- Request data enters the route.
- The route validates input.
- A service function processes the request.
- The service returns a domain object or structured result.
- The route formats the response as JSON or HTML.
- Templates receive only the data needed for rendering.

## 4. Frontend separation rules

### 4.1 No backend logic in JavaScript

JavaScript files must not contain Sudoku solving rules, server-side validation logic, or business rules that belong in Python.
JavaScript is for:

- DOM interaction
- Input handling
- UI state updates
- AJAX requests
- UX feedback
- client-side validation only

Python is responsible for:

- Validating puzzle correctness
- Solving logic
- Board generation
- Security checks
- Server-side error handling

### 4.2 No inline CSS or inline JS

- Do not write CSS inside HTML files.
- Do not write JavaScript inside HTML files.
- Use separate files:
  - `static/css/styles.css`
  - `static/js/app.js`
- Keep HTML semantic and template-driven.
- Templates should only define structure and data bindings.

### 4.3 Keep frontend code organized

- Use a small, clear JS module structure if needed.
- Keep DOM queries centralized.
- Use modern DOM APIs instead of outdated patterns.
- Keep event listeners organized by concern.
- Do not create one giant script file with mixed responsibilities.

## 5. Styling and responsive design requirements

### 5.1 Mobile-first design

- Design the interface mobile-first and progressively enhance for larger screens.
- Ensure the Sudoku grid remains usable on small screens.
- Support touch input and responsive layouts.
- Avoid fixed-width layouts that break on narrow screens.

### 5.2 Use accessible UI patterns

- Use semantic HTML elements.
- Ensure all interactive elements are keyboard accessible.
- Use contrast-friendly color choices.
- Provide visible focus states.
- Use labels, ARIA attributes only when necessary, and avoid decorative misuse.

### 5.3 CSS responsibilities

- Use external CSS files.
- Prefer modern layout tools such as Flexbox and CSS Grid.
- Use consistent class names and naming conventions.
- Keep selectors specific and maintainable.
- Do not hardcode pixel values for all layout concerns.
- Use responsive units such as `rem`, `em`, `%`, and `vw` where appropriate.
- Keep styling consistent across components.

### 5.4 Layout expectations

- The Sudoku board should adapt gracefully to viewport size.
- Buttons and controls should remain visible and usable on mobile screens.
- Empty states, validation states, and error states should be clearly styled.
- Avoid visual clutter and ensure the app remains readable at small sizes.

## 6. Error handling standards

### 6.1 Consistent error handling

All backend code must use consistent patterns for handling exceptions:

- Validate user input before processing.
- Catch specific exceptions where needed.
- Log unexpected errors with useful context.
- Return predictable HTTP responses.
- Avoid exposing sensitive stack traces to users.

### 6.2 Standard HTTP patterns

Use standard HTTP codes:

- `200 OK` for successful requests
- `201 Created` when a new resource is created
- `400 Bad Request` for invalid input
- `404 Not Found` for missing resources
- `422 Unprocessable Entity` for invalid domain data
- `500 Internal Server Error` for unexpected server errors

### 6.3 Validation rules

- Validate board shape, cell values, and puzzle constraints before processing.
- Reject malformed requests clearly.
- Return friendly, user-safe error messages in API responses or rendered pages.
- Do not allow invalid data to proceed silently.

### 6.4 Logging

- Use Python’s `logging` module.
- Log exceptions with context, including route, request identifiers when available, and a short summary of the failure.
- Do not log passwords or other sensitive data.
- Keep logs useful for debugging without exposing internals to end users.

### 6.5 Frontend error states

- UI should show meaningful error messages when the board is invalid or a request fails.
- Failed fetch requests or AJAX operations should not silently fail.
- Validate input locally where appropriate, but always rely on backend validation for security.

## 7. Testing expectations

- Write unit tests for puzzle validation, generation, solving logic, and route behavior.
- Cover edge cases, invalid boards, and malformed requests.
- Test logic independently from the Flask request cycle when possible.
- Prefer deterministic tests over flaky UI-dependent tests.
- Maintain functional correctness while refactoring.

## 8. Code review checklist

Before merging or finalizing changes, confirm all of the following:

- Business logic lives in Python modules, not in templates or JS.
- Frontend JS is separate from CSS and template structure.
- Route handlers remain thin and readable.
- Error handling is explicit and consistent.
- Input validation exists at the backend boundary.
- Code is modular and reusable.
- Naming is clear and consistent.
- Functions are small and testable.
- Templates contain minimal logic and render only presentation.
- CSS is responsive and mobile-friendly.
- No dead code, duplicate logic, or unexplained constants remain.

## 9. Final principles

The app should be:

- Clean
- Modular
- Responsive
- Pythonic
- Easy to read
- Easy to maintain
- Easy to test
- Safe and consistent under failure conditions

When in doubt, prefer:

- readability over cleverness
- small functions over large abstractions
- clear structure over hidden behavior
- explicit validation over silent assumptions
- strict separation of concerns over convenience

This project must reflect production-quality engineering habits, even if the app is small. Keep the implementation maintainable, testable, and professional.
