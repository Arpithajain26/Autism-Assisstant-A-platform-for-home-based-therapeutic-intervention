import os
import sys
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
import joblib

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# ── STEP 1: Load DREAM Weekly Features Dataset ─────────────────
csv_path = 'data/dream/dream_weekly_features.csv' if os.path.exists('data/dream/dream_weekly_features.csv') else 'weekly_trends.csv'
df = pd.read_csv(csv_path)
print(f"[OK] DREAM Dataset loaded from {csv_path}: {df.shape}")

# ── STEP 2: Select Features and Target ─────────────────
feature_cols = [
    'avg_performance_score',
    'score_delta',
    'session_count',
    'avg_engagement',
    'level'
]

X = df[feature_cols]
y = df['trend_label']

print("\n[OK] Trend Label Distribution:")
print(y.value_counts())

# ── STEP 3: Split 80% Train 20% Test ───────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print(f"\n[OK] Training samples: {len(X_train)}")
print(f"[OK] Testing samples:  {len(X_test)}")

# ── STEP 4: Train Random Forest Classifier ─────────────
model = RandomForestClassifier(
    n_estimators=120,
    max_depth=6,
    random_state=42,
    class_weight='balanced'
)

model.fit(X_train, y_train)
print("\n[OK] DREAM Trend Model training complete!")

# ── STEP 5: Evaluate Model ─────────────────────────────
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"\n[OK] Model Accuracy: {accuracy * 100:.2f}%")

labels = ['Improving', 'Stable', 'Regressing']
print("\n[OK] Classification Report:")
print(classification_report(y_test, y_pred, target_names=labels))

# ── STEP 6: Save Model ─────────────────────────────────
os.makedirs('models', exist_ok=True)
joblib.dump(model, 'models/trend_classifier.pkl')
joblib.dump(model, 'trend_classifier.pkl')
print("\n[OK] Model saved to models/trend_classifier.pkl and trend_classifier.pkl successfully!")
