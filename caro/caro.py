from flask import Flask, request, jsonify
from flask_cors import CORS
import math
import random

app = Flask(__name__)
CORS(app)

ROWS = 4
COLS = 3
WIN_STREAK = 3

def check_win(board, player):
    for i in range(ROWS):
        for j in range(COLS):
            if board[i][j] == player:
                if j <= COLS - WIN_STREAK and all(board[i][j+k] == player for k in range(WIN_STREAK)): return True
                if i <= ROWS - WIN_STREAK and all(board[i+k][j] == player for k in range(WIN_STREAK)): return True
                if i <= ROWS - WIN_STREAK and j <= COLS - WIN_STREAK and all(board[i+k][j+k] == player for k in range(WIN_STREAK)): return True
                if i <= ROWS - WIN_STREAK and j >= WIN_STREAK - 1 and all(board[i+k][j-k] == player for k in range(WIN_STREAK)): return True
    return False

def is_moves_left(board):
    return any(' ' in row for row in board)

# Đổi hàm đánh giá để linh hoạt theo quân cờ của AI
def evaluate(board, ai_player, opponent):
    if check_win(board, ai_player): return 10
    if check_win(board, opponent): return -10
    return 0

def minimax(board, depth, alpha, beta, is_max, ai_player, opponent):
    score = evaluate(board, ai_player, opponent)
    if score == 10 or score == -10 or not is_moves_left(board) or depth == 0:
        return score

    if is_max:
        best = -math.inf
        for i in range(ROWS):
            for j in range(COLS):
                if board[i][j] == ' ':
                    board[i][j] = ai_player
                    best = max(best, minimax(board, depth - 1, alpha, beta, False, ai_player, opponent))
                    board[i][j] = ' '
                    alpha = max(alpha, best)
                    if beta <= alpha: break
        return best
    else:
        best = math.inf
        for i in range(ROWS):
            for j in range(COLS):
                if board[i][j] == ' ':
                    board[i][j] = opponent
                    best = min(best, minimax(board, depth - 1, alpha, beta, True, ai_player, opponent))
                    board[i][j] = ' '
                    beta = min(beta, best)
                    if beta <= alpha: break
        return best

@app.route('/api/get_move', methods=['POST'])
def get_move():
    data = request.json
    board = data.get('board')
    difficulty = int(data.get('difficulty', 5)) 
    mode = data.get('mode', 'pvc_x') # pvc_x: Người(X) vs Máy(O), pvc_o: Máy(X) vs Người(O), pvp: Người vs Người

    # Nếu là chế độ Người vs Người, Frontend tự xử lý, không cần AI tính toán
    if mode == 'pvp':
        return jsonify({"message": "Chế độ PvP tự xử lý ở Frontend"}), 400

    # Xác định quân cờ dựa theo chế độ chơi
    if mode == 'pvc_o':
        ai_player = 'X'
        opponent = 'O'
    else:  # Mặc định pvc_x
        ai_player = 'O'
        opponent = 'X'

    best_val = -math.inf
    best_moves = []

    empty_cells = [(i, j) for i in range(ROWS) for j in range(COLS) if board[i][j] == ' ']
    
    # Nếu bàn cờ trống hoàn toàn (AI đi trước nước đầu tiên), chọn ngẫu nhiên một ô để tối ưu tốc độ
    if len(empty_cells) == ROWS * COLS:
        # AI thường thích chiếm các ô trung tâm ở nước đầu
        center_moves = [(i, j) for i, j in empty_cells if i in [1, 2] and j == 1]
        chosen = random.choice(center_moves) if center_moves else random.choice(empty_cells)
        return jsonify({"row": chosen[0], "col": chosen[1]})

    random.shuffle(empty_cells)

    for i, j in empty_cells:
        board[i][j] = ai_player
        move_val = minimax(board, difficulty, -math.inf, math.inf, False, ai_player, opponent)
        board[i][j] = ' '

        if move_val > best_val:
            best_val = move_val
            best_moves = [{"row": i, "col": j}]
        elif move_val == best_val:
            best_moves.append({"row": i, "col": j})

    chosen_move = random.choice(best_moves) if best_moves else {"row": -1, "col": -1}
    return jsonify(chosen_move)

# API bổ sung: Lấy nước đi đầu tiên cho AI khi chọn chế độ "Máy đi trước"
@app.route('/api/get_initial_move', methods=['POST'])
def get_initial_move():
    # Khởi tạo bàn cờ 4x3 trống rỗng
    board = [[' ' for _ in range(COLS)] for _ in range(ROWS)]
    
    # Nước đi đầu tiên hoàn hảo của quân X thường nằm ở hàng giữa để dễ tạo chuỗi
    best_first_moves = [{"row": 1, "col": 1}, {"row": 2, "col": 1}]
    chosen_move = random.choice(best_first_moves)
    return jsonify(chosen_move)

if __name__ == '__main__':
    app.run(debug=True, port=5000)