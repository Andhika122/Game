from app import app
from flask import render_template
import sys

templates = [
    'home.html',
    'menu.html',
    'dolanan.html',
    'dolanan_penjumlahan.html',
    'dolanan_pengurangan.html',
    'pitutur_profil.html',
    'pitutur_deskripsi_game_1.html',
    'pitutur_deskripsi_game_2.html',
    'pitutur_deskripsi_game_3.html',
    'pitakon.html',
]

ok = True
with app.app_context():
    for t in templates:
        try:
            render_template(t)
            print(t, 'OK')
        except Exception as e:
            ok = False
            print(t, 'ERROR', type(e).__name__, e)

sys.exit(0 if ok else 1)
