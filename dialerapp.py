from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, messaging
import os

app = Flask(__name__)

# Load Firebase credentials from environment or local path
cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or "firebase-creds.json"
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

@app.route('/call', methods=['POST'])
def send_push():
    data = request.get_json()
    fcm_token = data.get("token")
    phone_number = data.get("phone_number")

    if not fcm_token or not phone_number:
        return jsonify({
            "success": False,
            "error": "Missing 'token' or 'phone_number' in request body"
        }), 400

    try:
        message = messaging.Message(
            token=fcm_token,
            notification=messaging.Notification(
                title="📞 Incoming Lead",
                body=f"Click to call {phone_number}"
            ),
            data={
                "phone_number": phone_number
            }
        )
        response = messaging.send(message)
        return jsonify({"success": True, "message_id": response}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/save-token', methods=['POST'])
def save_token():
    data = request.get_json()
    fcm_token = data.get("token")

    if not fcm_token:
        return jsonify({"success": False, "error": "Missing token"}), 400

    print(f"📥 Received FCM token: {fcm_token}")
    return jsonify({"success": True}), 200

if __name__ == '__main__':
    app.run(port=5001)
