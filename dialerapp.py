from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, messaging
import os

app = Flask(__name__)

# initialise Firebase only once
try:
    firebase_admin.get_app()
except ValueError:
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "firebase-adminsdk.json")
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

@app.route("/call", methods=["POST"])
def send_call_notification():
    data = request.get_json()
    print("🧪 Raw data payload received:", data)

    token = data.get("token")
    phone_number = data.get("phone_number")
    title = data.get("title", f"Call {phone_number}")
    body = data.get("body", f"Tap to call {phone_number}")

    print(f"✉️ Title: {title}, Body: {body}")

    if not token or not phone_number:
        return jsonify({"error": "Missing token or phone number"}), 400

    message = messaging.Message(
        token=token,
        notification=messaging.Notification(
            title=title,
            body=body
        ),
        android=messaging.AndroidConfig(
            priority="high",
            notification=messaging.AndroidNotification(
                click_action="ACTION_CALL"
            )
        ),
        data={"phone_number": phone_number}
    )

    try:
        message_id = messaging.send(message)
        return jsonify({"status": "sent", "message_id": message_id}), 202
    except Exception as e:
        print("❌ Error sending FCM message:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/save-token", methods=["POST"])
def save_token():
    data = request.get_json()
    print("📲 Save token request received:", data)
    # In production, save token to a database or file here
    return jsonify({"status": "saved"}), 200

@app.route("/", methods=["GET"])
def root():
    return "Commish Server is Live ✅", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
