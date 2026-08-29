import os
import sys
import time
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import numpy as np

# Force UTF-8 stdout if possible
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Set random seed for reproducibility
torch.manual_seed(42)
np.random.seed(42)

# Emotion labels mapping
EMOTION_CLASSES = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
CLASS_TO_IDX = {cls: idx for idx, cls in enumerate(EMOTION_CLASSES)}

# ── 1. Custom Dataset for FER2013 Folder Structure ─────────────────
class FERDataset(Dataset):
    def __init__(self, root_dir, is_train=True, transform=None):
        self.samples = []
        self.transform = transform
        self.is_train = is_train

        for class_name in EMOTION_CLASSES:
            class_dir = os.path.join(root_dir, class_name)
            if not os.path.isdir(class_dir):
                continue
            label = CLASS_TO_IDX[class_name]
            files = [f for f in os.listdir(class_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
            for fname in files:
                self.samples.append((os.path.join(class_dir, fname), label))
                
        print(f"[DATA] Loaded {len(self.samples)} samples from {root_dir}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path).convert('L') # Convert to grayscale 48x48
        if img.size != (48, 48):
            img = img.resize((48, 48))
        
        arr = np.array(img, dtype=np.float32) / 255.0  # Normalize to [0, 1]
        
        # Simple data augmentation for training: random horizontal flip
        if self.is_train and np.random.rand() > 0.5:
            arr = np.fliplr(arr).copy()

        tensor = torch.tensor(arr, dtype=torch.float32).unsqueeze(0) # (1, 48, 48)
        # Normalize with mean=0.5, std=0.5
        tensor = (tensor - 0.5) / 0.5
        return tensor, torch.tensor(label, dtype=torch.long)


# ── 2. CNN Architecture for Facial Emotion Recognition ─────────────
class EmotionCNN(nn.Module):
    def __init__(self, num_classes=7):
        super(EmotionCNN, self).__init__()
        
        # Block 1
        self.conv1 = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2), # 48 -> 24
            nn.Dropout(0.2)
        )
        
        # Block 2
        self.conv2 = nn.Sequential(
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2), # 24 -> 12
            nn.Dropout(0.25)
        )
        
        # Block 3
        self.conv3 = nn.Sequential(
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2), # 12 -> 6
            nn.Dropout(0.3)
        )
        
        # Fully Connected Classifier
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 6 * 6, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.4),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        x = self.conv1(x)
        x = self.conv2(x)
        x = self.conv3(x)
        x = self.classifier(x)
        return x


# ── 3. Training & Evaluation Pipeline ──────────────────────────────
def train_model(data_dir='data/fer2013', epochs=8, batch_size=64, lr=0.001):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"[INFO] Training on device: {device}")
    
    train_dir = os.path.join(data_dir, 'train')
    test_dir = os.path.join(data_dir, 'test')
    
    train_dataset = FERDataset(train_dir, is_train=True)
    test_dataset = FERDataset(test_dir, is_train=False)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    model = EmotionCNN(num_classes=len(EMOTION_CLASSES)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='max', factor=0.5, patience=2)
    
    best_acc = 0.0
    os.makedirs('models', exist_ok=True)
    
    print("\n[START] Starting CNN Emotion Recognition Training...")
    print("=" * 60)
    
    for epoch in range(1, epochs + 1):
        start_time = time.time()
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
        train_loss = running_loss / total
        train_acc = 100.0 * correct / total
        
        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for images, labels in test_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()
                
        val_loss = val_loss / val_total
        val_acc = 100.0 * val_correct / val_total
        scheduler.step(val_acc)
        
        elapsed = time.time() - start_time
        print(f"Epoch [{epoch:2d}/{epochs:2d}] | Train Loss: {train_loss:.4f} Acc: {train_acc:.2f}% | "
              f"Val Loss: {val_loss:.4f} Acc: {val_acc:.2f}% | Time: {elapsed:.1f}s")
        
        # Save best model
        if val_acc > best_acc:
            best_acc = val_acc
            save_path = 'models/emotion_model.pth'
            torch.save({
                'model_state_dict': model.state_dict(),
                'classes': EMOTION_CLASSES,
                'val_acc': val_acc,
                'epoch': epoch
            }, save_path)
            torch.save({
                'model_state_dict': model.state_dict(),
                'classes': EMOTION_CLASSES,
                'val_acc': val_acc,
                'epoch': epoch
            }, 'emotion_model.pth')
            print(f"  --> New best validation accuracy: {val_acc:.2f}% (Saved to {save_path})")
            
    print("=" * 60)
    print(f"[COMPLETE] Best Validation Accuracy: {best_acc:.2f}%\n")
    
    # Save metadata configuration
    metadata = {
        "classes": EMOTION_CLASSES,
        "input_shape": [1, 48, 48],
        "normalization": {"mean": 0.5, "std": 0.5},
        "best_accuracy": round(best_acc, 2),
        "model_architecture": "EmotionCNN (3 Conv Blocks + BatchNorm + Dropout + Linear)",
        "emotions_supported": {
            "angry": {"valence": -0.8, "arousal": 0.8, "status": "Frustrated / Agitated", "color": "#ef4444"},
            "disgust": {"valence": -0.6, "arousal": 0.5, "status": "Discomfort / Avoidance", "color": "#f97316"},
            "fear": {"valence": -0.7, "arousal": 0.9, "status": "Anxious / Overwhelmed", "color": "#a855f7"},
            "happy": {"valence": 0.9, "arousal": 0.6, "status": "Positive / Engaged", "color": "#22c55e"},
            "neutral": {"valence": 0.0, "arousal": 0.1, "status": "Calm / Baseline", "color": "#3b82f6"},
            "sad": {"valence": -0.7, "arousal": -0.4, "status": "Low energy / Down", "color": "#64748b"},
            "surprise": {"valence": 0.5, "arousal": 0.8, "status": "Curious / Attentive", "color": "#eab308"}
        }
    }
    with open('models/emotion_metadata.json', 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    with open('emotion_metadata.json', 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)
    print("[OK] Metadata saved to models/emotion_metadata.json")

if __name__ == '__main__':
    train_model(epochs=6, batch_size=64, lr=0.001)
