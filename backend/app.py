from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib, json, numpy as np
import os
 
app = Flask(__name__)
CORS(app)   # allow requests from Expo app
 
# ── Load model artifacts ──────────────────────────────────────
BASE = os.path.join(os.path.dirname(__file__), "ayurveda_model")
 
herb_model  = joblib.load(f"{BASE}/herb_model.pkl")
treat_model = joblib.load(f"{BASE}/treat_model.pkl")
scaler      = joblib.load(f"{BASE}/scaler.pkl")
le_agni     = joblib.load(f"{BASE}/le_agni.pkl")
le_herb     = joblib.load(f"{BASE}/le_herb.pkl")
le_treat    = joblib.load(f"{BASE}/le_treat.pkl")
 
with open(f"{BASE}/meta.json") as f:
    meta = json.load(f)
 
HERB_NAMES   = meta["herb_names"]
TREAT_NAMES  = meta["treat_names"]
ALL_DISEASES = meta["all_diseases"]
AGNI_ENC     = {c: int(i) for i, c in enumerate(le_agni.classes_)}
 
def build_feature_row(data):
    age     = int(data["age"])
    gender  = 1 if data["gender"].upper() == "M" else 0
    ag      = (0 if age < 15 else 1 if age < 30 else
               2 if age < 50 else 3 if age < 65 else 4)
 
    diseases  = data["diseases"]           # list e.g. ["diabetes"]
    d_flags   = [int(d in diseases) for d in ALL_DISEASES]
    n_diseases = len(diseases)
 
    row = [[
        age, gender, ag,
        float(data["vata"]),
        float(data["pitta"]),
        float(data["kapha"]),
        float(data["mucus"]),
        float(data["ama"]),
        float(data["pain"]),
        float(data["heat"]),
        float(data["dryness"]),
        float(AGNI_ENC.get(data["agni"], 1)),
        *d_flags,
        n_diseases,
    ]]
    return np.array(row)
 
 
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
 
        # ── Validate required fields ──────────────────────────
        required = ["age","gender","agni","diseases",
                    "vata","pitta","kapha","mucus","ama",
                    "pain","heat","dryness"]
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({"error": f"Missing fields: {missing}"}), 400
 
        # ── Build feature vector ──────────────────────────────
        row     = build_feature_row(data)
        x_in    = scaler.transform(row)
 
        # ── Predict herb ──────────────────────────────────────
        herb_proba  = herb_model.predict_proba(x_in)[0]
        treat_proba = treat_model.predict_proba(x_in)[0]
 
        top3_herb  = sorted(enumerate(herb_proba),  key=lambda v: -v[1])[:3]
        top3_treat = sorted(enumerate(treat_proba), key=lambda v: -v[1])[:3]
 
        response = {
            "recommended_herb": {
                "name":       HERB_NAMES[top3_herb[0][0]],
                "confidence": round(float(top3_herb[0][1]) * 100, 1),
            },
            "recommended_treatment": {
                "form":       TREAT_NAMES[top3_treat[0][0]],
                "confidence": round(float(top3_treat[0][1]) * 100, 1),
            },
            "herb_alternatives": [
                {"name": HERB_NAMES[i], "confidence": round(float(v)*100, 1)}
                for i, v in top3_herb[1:]
            ],
            "treatment_alternatives": [
                {"form": TREAT_NAMES[i], "confidence": round(float(v)*100, 1)}
                for i, v in top3_treat[1:]
            ],
        }
        return jsonify(response), 200
 
    except Exception as e:
        return jsonify({"error": str(e)}), 500
 
 
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "herbs": HERB_NAMES}), 200
 
 
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)