import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

# ── STEP 1: Load Dataset ─────────────────────────────
df = pd.read_csv('Toddler Autism dataset July 2018.csv')
print("✅ Dataset loaded:", df.shape)

# ── STEP 2: Select 10 Question Columns ───────────────
feature_cols = ['A1','A2','A3','A4','A5',
                'A6','A7','A8','A9','A10']
X = df[feature_cols]

# ── STEP 3: Create 3 Levels from Q-CHAT Score ────────
# Dataset has Qchat-10-Score column — use it directly!
def assign_level(score):
    if score <= 3:
        return 1   # Level 1 — Mild/Emerging
    elif score <= 6:
        return 2   # Level 2 — Moderate/Developing
    else:
        return 3   # Level 3 — Severe/Advancing

df['level'] = df['Qchat-10-Score'].apply(assign_level)
y = df['level']

print("\n✅ Level Distribution:")
print(y.value_counts().sort_index())

# ── STEP 4: Split 80% Train 20% Test ─────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)
print(f"\n✅ Training samples: {len(X_train)}")
print(f"✅ Testing samples:  {len(X_test)}")

# ── STEP 5: Train Random Forest ───────────────────────
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=5,
    random_state=42,
    class_weight='balanced'
)
model.fit(X_train, y_train)
print("\n✅ Model training complete!")

# ── STEP 6: Check Accuracy ────────────────────────────
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"\n✅ Accuracy: {accuracy * 100:.2f}%")

print("\n✅ Classification Report:")
print(classification_report(
    y_test, y_pred,
    target_names=['Level 1','Level 2','Level 3']
))

# ── STEP 7: Test with Sample Input ───────────────────
print("\n--- Testing with sample answers ---")
sample = [[1, 1, 0, 1, 0, 1, 0, 1, 1, 1]]
pred = model.predict(sample)[0]
prob = model.predict_proba(sample)[0]
print(f"Sample scores: {sample[0]}")
print(f"Predicted Level: {pred}")
print(f"Confidence: {round(max(prob)*100, 1)}%")

# ── STEP 8: Save Model ────────────────────────────────
joblib.dump(model, 'level_classifier.pkl')
print("\n✅ Model saved as level_classifier.pkl !")
print("🎉 Training complete — ready to use in Flask API!")