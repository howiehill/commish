from flask import Flask, request, jsonify
import firebase_admin
from firebase_admin import credentials, messaging
import os

app = Flask(__name__)

# Load Firebase credentials from env variable (recommended for Railway)
cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
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
                title="Tap to Call",
                body=f"Click to call {phone_number}"
            ),
            data={"phone_number": phone_number}
        )

        response = messaging.send(message)
        print(f"✅ Push sent: {response}")

        return jsonify({
            "success": True,
            "message_id": response
        })

    except Exception as e:
        print(f"❌ Error sending push: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Run on Railway's specified port
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
