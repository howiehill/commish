from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, messaging
import os

app = Flask(__name__)

if not firebase_admin._apps:
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "firebase-adminsdk.json")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

@app.route("/call", methods=["POST"])
def send_call_notification():
    data = request.get_json()
    print("🧪 Raw data payload received:", data)  # DEBUG

    token = data.get("token")
    phone_number = data.get("phone_number")
    title = data.get("title", "Hmmm Boyee")
    title = data.get("title", "Boyakasha")
    body = data.get("body", f"Click to call {phone_number}")

    print(f"✉️ Title: {title} | Body: {body}")  # DEBUG

    if not token or not phone_number:
        return jsonify({"error": "Missing token or phone number"}), 400

    result = messaging.send(
        messaging.Message(
            token=token,
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data={"phone_number": phone_number},
        )
    )
    return jsonify({"status": "sent", "result": result})


@app.route("/save-token", methods=["POST"])
def save_token():
    data = request.get_json()
    print("📲 Save token request received:", data)
    # In production: save token to a DB or file
    return jsonify({"status": "saved"}), 200


@app.route("/", methods=["GET"])
def root():
    return "Commish Server is Live ✅", 200
