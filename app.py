from flask import Flask, send_file, send_from_directory

app = Flask(__name__)

# Store control points in-memory
control_points = []

# Image dimensions (original size)
img_width, img_height = 4096, 4096  # Original image size

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/scripts/<path:name>')
def scripts(name):
    return send_from_directory('scripts', name)

# @app.route('/get_points', methods=['GET'])
# def get_points():
#     return jsonify(control_points=control_points)

# @app.route('/clear_points', methods=['POST'])
# def clear_points():
#     control_points.clear()
#     return jsonify(success=True)

# @app.route('/export_points', methods=['GET'])
# def export_points():
#     # Normalize the points before exporting
#     normalized_points = []

#     # Normalize control points to fit the 0-366 range
#     for x, y in control_points:
#         normalized_x = (x / img_width) * 366
#         normalized_y = (y / img_height) * 366
#         normalized_points.append((normalized_x, normalized_y))

#     return jsonify(control_points=normalized_points)

if __name__ == '__main__':
    app.run(debug=True)
