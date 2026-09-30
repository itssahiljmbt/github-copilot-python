from flask import Flask, render_template, jsonify, request
import sudoku_logic

# Keep a simple in-memory store for current puzzle and solution
CURRENT = {
    'puzzle': None,
    'solution': None
}
app = Flask(__name__)
@app.route('/')
def index():
    difficulty = request.args.get('difficulty', 'Medium')
    board = sudoku_logic.solve_board(sudoku_logic.create_empty_board(), difficulty=difficulty)
    return render_template('index.html', board=board, difficulty=difficulty)

@app.route('/new')
def new_game():
    difficulty = request.args.get('difficulty', 'medium').lower()
    clues_by_difficulty = {
        'easy': 40,
        'medium': 35,
        'hard': 30,
    }

    clues = clues_by_difficulty.get(difficulty)
    if clues is None:
        return jsonify({'error': 'Invalid difficulty'}), 400

    puzzle, solution = sudoku_logic.generate_puzzle(clues)
    CURRENT['puzzle'] = puzzle
    CURRENT['solution'] = solution
    return jsonify({'puzzle': puzzle})

@app.route('/check', methods=['POST'])
def check_solution():
    data = request.json
    board = data.get('board')
    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400
    incorrect = []
    for i in range(sudoku_logic.SIZE):
        for j in range(sudoku_logic.SIZE):
            if board[i][j] != solution[i][j]:
                incorrect.append([i, j])
    return jsonify({'incorrect': incorrect})

from flask import Flask, render_template, jsonify, request
import sudoku_logic

# ...existing code...

@app.post("/api/hint")
def get_hint():
    data = request.get_json(silent=True) or {}
    row = data.get("row")
    col = data.get("col")

    if type(row) is not int or type(col) is not int:
        return jsonify(error="Row and column must be integers."), 400
    if not (0 <= row < sudoku_logic.SIZE and 0 <= col < sudoku_logic.SIZE):
        return jsonify(error="Cell is out of range."), 400

    puzzle = CURRENT["puzzle"]
    solution = CURRENT["solution"]
    if puzzle is None or solution is None:
        return jsonify(error="No game in progress. Start a new game."), 404

    if puzzle[row][col] != sudoku_logic.EMPTY:
        return jsonify(error="That cell is already a given."), 409

    return jsonify(value=solution[row][col])

# ...existing code...
if __name__ == '__main__':
    app.run(debug=True)