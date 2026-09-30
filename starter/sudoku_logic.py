import copy
import random

SIZE = 9
BOX_SIZE = 3
EMPTY = 0

Board = list[list[int]]


def deep_copy(board: Board) -> Board:
    return copy.deepcopy(board)


def create_empty_board() -> Board:
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]


def is_safe(board: Board, row: int, col: int, num: int) -> bool:
    if any(board[row][x] == num for x in range(SIZE)):
        return False
    if any(board[x][col] == num for x in range(SIZE)):
        return False

    start_row = row - row % BOX_SIZE
    start_col = col - col % BOX_SIZE
    for box_row in range(start_row, start_row + BOX_SIZE):
        for box_col in range(start_col, start_col + BOX_SIZE):
            if board[box_row][box_col] == num:
                return False

    return True


def _board_is_consistent(board: Board) -> bool:
    if len(board) != SIZE or any(len(row) != SIZE for row in board):
        return False

    for row in range(SIZE):
        for col in range(SIZE):
            num = board[row][col]
            if num == EMPTY:
                continue
            if not isinstance(num, int) or not 1 <= num <= SIZE:
                return False

            board[row][col] = EMPTY
            safe = is_safe(board, row, col, num)
            board[row][col] = num
            if not safe:
                return False

    return True


def _solve_in_place(board: Board, randomize: bool = False) -> bool:
    """Fill every empty cell using backtracking."""
    best_cell: tuple[int, int] | None = None
    best_candidates: list[int] | None = None

    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] != EMPTY:
                continue

            candidates = [
                num for num in range(1, SIZE + 1)
                if is_safe(board, row, col, num)
            ]
            if not candidates:
                return False
            if best_candidates is None or len(candidates) < len(best_candidates):
                best_cell = (row, col)
                best_candidates = candidates

    if best_cell is None:
        return True

    if randomize:
        random.shuffle(best_candidates)

    row, col = best_cell
    for candidate in best_candidates:
        board[row][col] = candidate
        if _solve_in_place(board, randomize):
            return True
        board[row][col] = EMPTY

    return False


def solve_board(
    board: Board,
    difficulty: str | None = None,
    randomize: bool = False,
) -> list[dict[str, int | bool]]:
    """Solve a board and return its cells with value and lock state."""
    blank_counts = {"Easy": 30, "Medium": 45, "Hard": 55}
    if difficulty is not None and difficulty not in blank_counts:
        raise ValueError("difficulty must be 'Easy', 'Medium', or 'Hard'")
    if not _board_is_consistent(board):
        return []

    if not _solve_in_place(board, randomize):
        return []

    if difficulty is not None:
        remove_cells(board, SIZE * SIZE - blank_counts[difficulty])

    return [
        {"value": board[row][col], "locked": board[row][col] != EMPTY}
        for row in range(SIZE)
        for col in range(SIZE)
    ]


def fill_board(board: Board) -> list[dict[str, int | bool]]:
    """Generate a complete board using randomized backtracking."""
    return solve_board(board, randomize=True)


def count_solutions(board: Board, limit: int = 2) -> int:
    """Count solutions up to limit without changing the input board."""
    if limit < 1 or not _board_is_consistent(board):
        return 0

    def search() -> int:
        best_cell: tuple[int, int] | None = None
        best_candidates: list[int] | None = None

        for row in range(SIZE):
            for col in range(SIZE):
                if board[row][col] != EMPTY:
                    continue

                candidates = [
                    num for num in range(1, SIZE + 1)
                    if is_safe(board, row, col, num)
                ]
                if not candidates:
                    return 0
                if best_candidates is None or len(candidates) < len(best_candidates):
                    best_cell = (row, col)
                    best_candidates = candidates

        if best_cell is None:
            return 1

        row, col = best_cell
        total = 0
        for candidate in best_candidates:
            board[row][col] = candidate
            total += search()
            board[row][col] = EMPTY
            if total >= limit:
                return limit

        return total

    return search()


def remove_cells(board: Board, clues: int) -> None:
    """Remove clues one at a time, keeping exactly one solution after each removal."""
    if not _board_is_consistent(board):
        raise ValueError("board must be a consistent 9x9 Sudoku board")
    if count_solutions(board, limit=2) != 1:
        raise ValueError("board must have exactly one solution before removing clues")

    target_clues = max(0, min(SIZE * SIZE, int(clues)))
    cells_to_remove = SIZE * SIZE - target_clues
    cells = [(row, col) for row in range(SIZE) for col in range(SIZE)]
    random.shuffle(cells)

    removed = 0
    for row, col in cells:
        if removed >= cells_to_remove:
            break
        if board[row][col] == EMPTY:
            continue

        value = board[row][col]
        board[row][col] = EMPTY

        if count_solutions(board, limit=2) == 1:
            removed += 1
        else:
            board[row][col] = value


def generate_puzzle(clues: int = 35) -> tuple[Board, Board]:
    """Generate a full solution, then remove clues while preserving uniqueness."""
    solution = create_empty_board()
    if not _solve_in_place(solution, randomize=True):
        raise RuntimeError("Could not generate a valid Sudoku board.")

    puzzle = deep_copy(solution)
    remove_cells(puzzle, clues)
    return puzzle, solution