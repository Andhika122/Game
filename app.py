from flask import Flask, render_template, redirect
import os
from flask import request, Response, send_file, abort, url_for

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GAME_FOLDER = os.path.join(BASE_DIR, "game 1")


def resolve_static_folder() -> str:
    candidates = [
        os.path.join(BASE_DIR, "static"),
        os.path.join(BASE_DIR, "api", "static"),
        os.path.join(BASE_DIR, "public", "static"),
    ]
    for candidate in candidates:
        if os.path.isdir(candidate):
            return candidate
    return os.path.join(BASE_DIR, "static")


STATIC_FOLDER = resolve_static_folder()

app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path="/static", template_folder="templates")


@app.context_processor
def inject_asset_helpers():
    def static_url(path: str) -> str:
        return url_for("static", filename=path)

    return {"static_url": static_url}


@app.route("/favicon.png")
def favicon():
    return app.send_static_file("img/logo.png")


@app.route("/favicon.ico")
def favicon_ico():
    return app.send_static_file("img/logo.png")


@app.route("/")
def index():
    return redirect("/nama?intro=1")

@app.route("/nama")
def nama():
    return render_template("nama.html")

@app.route("/home")
def home():
    return redirect("/nama?intro=1")

@app.route("/menu")
def menu():
    return render_template("menu.html")
@app.route("/permainan")
def permainan():
    return render_template("permainan.html")

@app.route("/permainan/penjumlahan")
def permainan_penjumlahan():
    return render_template("permainan_penjumlahan.html")

@app.route("/permainan/simbol/bilangan")
def permainan_simbol_bilangan():
    return render_template("simbol_bilangan.html")

@app.route("/permainan/pengurangan")
def permainan_pengurangan():
    return render_template("permainan_pengurangan.html")

@app.route("/profil")
def profil():
    return render_template("profil.html")

@app.route("/profil/selanjutnya")
def profil_selanjutnya():
    return render_template("profil_selanjutnya.html")

@app.route("/demo")
def demo():
    return render_template("demo.html")

@app.route('/status')
def status():
    return {"status": "ok", "message": "server running"}


def partial_response(path):
    full_path = os.path.join(STATIC_FOLDER, 'video', path)
    if not os.path.exists(full_path):
        abort(404)
    file_size = os.path.getsize(full_path)
    range_header = request.headers.get('Range', None)
    if not range_header:
        return send_file(full_path, mimetype='video/mp4')

    # parse range header
    units, _, range_spec = range_header.partition('=')
    if units != 'bytes':
        return send_file(full_path, mimetype='video/mp4')
    start_str, _, end_str = range_spec.partition('-')
    try:
        start = int(start_str) if start_str else 0
        end = int(end_str) if end_str else file_size - 1
    except ValueError:
        start = 0
        end = file_size - 1
    if end >= file_size:
        end = file_size - 1
    length = end - start + 1
    with open(full_path, 'rb') as f:
        f.seek(start)
        data = f.read(length)

    rv = Response(data, 206, mimetype='video/mp4', direct_passthrough=True)
    rv.headers['Content-Range'] = f'bytes {start}-{end}/{file_size}'
    rv.headers['Accept-Ranges'] = 'bytes'
    rv.headers['Content-Length'] = str(length)
    return rv


@app.route('/video/<path:filename>')
def video(filename):
    return partial_response(filename)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
