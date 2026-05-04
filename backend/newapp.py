from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)

# Load model bundle
with open("herb_model.pkl", "rb") as f:
    bundle = pickle.load(f)

model             = bundle["model"]
feature_transform = bundle["feature_transform"]
le                = bundle["label_encoder"]

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        # Build a single-row DataFrame matching training columns exactly
        row = pd.DataFrame([{
            "disease_category":  data["disease_category"],
            "agni_state":        data["agni_state"],
            "geographic_region": data["geographic_region"],
            "gender":            data["gender"],
            "age":               float(data["age"]),
            "vata_score":        float(data["vata_score"]),
            "pitta_score":       float(data["pitta_score"]),
            "kapha_score":       float(data["kapha_score"]),
            "ama_level":         float(data["ama_level"]),
            "mucus_level":       float(data["mucus_level"]),
            "dryness_level":     float(data["dryness_level"]),
            "heat_level":        float(data["heat_level"]),
            "pain_level":        float(data["pain_level"]),
            # pattern_cluster is needed — derive it server-side
            "pattern_cluster":   derive_cluster(data),
            # these columns were in training data, dummy values for prediction
            "primary_herb":      "Guduchi",
            "secondary_herb":    "Amla",
        }])

        X = feature_transform.transform(row)

        # Get top 3 predictions by probability
        proba    = model.predict_proba(X)[0]
        top3_idx = np.argsort(proba)[::-1][:3]
        top3     = le.inverse_transform(top3_idx).tolist()

        return jsonify({ "top_3_labels": top3, "success": True })

    except Exception as e:
        return jsonify({ "error": str(e), "success": False }), 500


def derive_cluster(data: dict) -> str:
    disease = data["disease_category"]
    agni    = data["agni_state"]
    vata    = float(data["vata_score"])
    pitta   = float(data["pitta_score"])
    kapha   = float(data["kapha_score"])
    ama     = float(data["ama_level"])
    mucus   = float(data["mucus_level"])
    dryness = float(data["dryness_level"])
    heat    = float(data["heat_level"])
    pain    = float(data["pain_level"])

    if disease == "asthma":
        if kapha >= 7 and mucus >= 7:   return "asthma_kapha"
        if vata >= 7 or dryness >= 6:   return "asthma_vata"
        return "asthma_general"
    if disease == "arthritis":
        if ama >= 7 or pain >= 7 or agni == "Manda Agni": return "arthritis_ama"
        return "arthritis_general"
    if disease == "gastritis":
        if pitta >= 7 or heat >= 7 or agni == "Tikshna Agni": return "gastritis_pitta"
        return "gastritis_general"
    if disease == "diabetes":
        if kapha >= 7 or agni == "Manda Agni": return "diabetes_kapha"
        return "diabetes_general"
    if disease == "migraine":
        if vata >= 7 and pitta >= 6: return "migraine_vata_pitta"
        return "migraine_general"
    return "general"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)