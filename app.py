from flask import Flask, render_template, redirect
import os

# Configure Flask to serve existing 'game 1' folder as its static folder.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GAME_FOLDER = os.path.join(BASE_DIR, "game 1")

# New physical static folder for CSS/JS we created: BASE_DIR/static
STATIC_FOLDER = os.path.join(BASE_DIR, "static")

# Use the new `static` folder as Flask's static folder (so CSS/JS under /static/...)
app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path="/static", template_folder="templates")



@app.route("/")
def index():
    return render_template("home.html")


@app.route("/home")
def home():
    return render_template("home.html")

@app.route("/menu")
def menu():
    return render_template("menu.html")

@app.route("/dolanan")
def dolanan():
    return render_template("dolanan.html")

@app.route("/dolanan/penjumlahan")
def dolanan_penjumlahan():
    return render_template("dolanan_penjumlahan.html")

@app.route("/dolanan/pengurangan")
def dolanan_pengurangan():
    return render_template("dolanan_pengurangan.html")

@app.route("/pitutur")
def pitutur():
    return redirect("/pitutur/profil")

@app.route("/pitutur/profil")
def pitutur_profil():
    return render_template("pitutur_profil.html")

@app.route("/pitutur/deskripsi-1")
def pitutur_deskripsi_game_1():
    return render_template("pitutur_deskripsi_game_1.html")

@app.route("/pitutur/deskripsi-2")
def pitutur_deskripsi_game_2():
    return render_template("pitutur_deskripsi_game_2.html")

@app.route("/pitutur/deskripsi-3")
def pitutur_deskripsi_game_3():
    return render_template("pitutur_deskripsi_game_3.html")

@app.route("/pitakon")
def pitakon():
    return render_template("pitakon.html")

@app.route('/status')
def status():
    return {"status": "ok", "message": "server running"}


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
