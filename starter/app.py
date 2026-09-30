import os

from flask import Flask, jsonify, render_template, request, session

import sudoku_logic


CURRENT = {
    "puzzle": None,
    "solution": None,
}

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-key-change-me")


@app.route("/")
def index():
    difficulty = request.args.get("difficulty", "Medium")

    solved_cells = sudoku_logic.solve_board(sudoku_logic.create_empty_board())
    session["solution"] = [
        [solved_cells[row * sudoku_logic.SIZE + col]["value"]
         for col in range(sudoku_logic.SIZE)]
        for row in range(sudoku_logic.SIZE)
    ]

    board = sudoku_logic.solve_board(
        sudoku_logic.create_empty_board(),
        difficulty=difficulty,
    )
    return render_template("index.html", board=board, difficulty=difficulty)


@app.route("/new")
def new_game():
    difficulty = request.args.get("difficulty", "medium").lower()
    clues_by_difficulty = {
        "easy": 40,
        "medium": 35,
        "hard": 30,
    }

    clues = clues_by_difficulty.get(difficulty)
    if clues is None:
        return jsonify({"error": "Invalid difficulty"}), 400

    puzzle, solution = sudoku_logic.generate_puzzle(clues)
    CURRENT["puzzle"] = puzzle
    CURRENT["solution"] = solution
    session["solution"] = solution
    return jsonify({"puzzle": puzzle})


@app.route("/check", methods=["POST"])
def check_solution():
    solution = session.get("solution")
    if solution is None:
        return jsonify({"error": "No game in progress"}), 400

    data = request.get_json(silent=True) or {}
    board = data.get("board")
    if (
        not isinstance(board, list)
        or len(board) != sudoku_logic.SIZE
        or any(not isinstance(row, list) or len(row) != sudoku_logic.SIZE for row in board)
    ):
        return jsonify({"error": "Board must be a 9x9 array"}), 400

    incorrect = []
    for row in range(sudoku_logic.SIZE):
        for col in range(sudoku_logic.SIZE):
            value = board[row][col]
            if isinstance(value, str):
                value = value.strip()
                if value:
                    try:
                        value = int(value)
                    except ValueError:
                        pass

            if value != solution[row][col]:
                incorrect.append({"row": row, "col": col})

    return jsonify(incorrect)


if __name__ == "__main__":
    app.run(debug=True)