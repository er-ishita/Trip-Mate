# app.py
import os
import re
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

from models import db, User

app = Flask(__name__)
CORS(app)  # in production set origins param

# Config
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL') or "sqlite:///dev.db"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret')

db.init_app(app)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def validate_signup_payload(data):
    errors = {}
    full_name = (data.get('full_name') or "").strip()
    email = (data.get('email') or "").strip().lower()
    password = data.get('password') or ""
    confirm_password = data.get('confirm_password') or ""

    if not full_name:
        errors['full_name'] = "Full name is required."
    if not email:
        errors['email'] = "Email is required."
    elif not EMAIL_REGEX.match(email):
        errors['email'] = "Invalid email address."
    if not password:
        errors['password'] = "Password is required."
    elif len(password) < 6:
        errors['password'] = "Password must be at least 6 characters."
    if password != confirm_password:
        errors['confirm_password'] = "Passwords do not match."

    return errors, {'full_name': full_name, 'email': email, 'password': password}

@app.route("/api/auth/signup", methods=["POST"])
def signup():
    payload = request.get_json(force=True, silent=True)
    if not payload:
        return jsonify({"error": "Invalid JSON body"}), 400

    errors, cleaned = validate_signup_payload(payload)
    if errors:
        return jsonify({"errors": errors}), 400

    password_hash = generate_password_hash(cleaned['password'], method='pbkdf2:sha256', salt_length=16)

    new_user = User(full_name=cleaned['full_name'], email=cleaned['email'], password_hash=password_hash)

    try:
        db.session.add(new_user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"errors": {"email": "Email already in use."}}), 409
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal server error"}), 500

    return jsonify({
        "message": "Account created successfully.",
        "user": {"id": new_user.id, "full_name": new_user.full_name, "email": new_user.email}
    }), 201

# DEV helper to create tables quickly
@app.route("/api/dev/init-db", methods=["POST"])
def init_db():
    db.create_all()
    return jsonify({"message": "Database tables created."})

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)

