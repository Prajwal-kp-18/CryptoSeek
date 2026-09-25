# 🚀 Vestigo Crypto Function Classifier - Production Deployment

## Overview
Production-ready cryptographic function classifier achieving **87% accuracy** with explainable AI capabilities.

## 🎯 Features
- **High Accuracy**: 87% on crypto function classification
- **Explainable AI**: LLM-powered explanations (via OpenRouter) for predictions
- **Batch Processing**: Handle multiple binaries efficiently
- **API Interface**: REST API for integration
- **Feature Analysis**: Understand what drives predictions
- **Production Ready**: Error handling, logging, persistence

## 🛠️ Quick Setup

### 1. Install Dependencies
```bash
pip install -r requirements_production.txt
```

### 2. Set OpenRouter API Key (Optional)
```bash
export OPENROUTER_KEY="your-api-key-here"
```

### 3. Run Predictions
```bash
# Single prediction
python crypto_classifier_production.py --input sample_features.json --explain

# Batch processing  
python crypto_classifier_production.py --batch file_list.txt --explain

# Start API server
python crypto_classifier_production.py --api
```

## 📊 Model Performance

| Metric | Score |
|--------|-------|
| **Accuracy** | 87% |
| **Model Type** | LightGBM |
| **Features** | 20,000+ |
| **Classes** | 12 crypto functions |
| **Training Data** | 16,310 samples |

## 🔍 Supported Crypto Functions

- **AES**: AES-128, AES-192, AES-256
- **RSA**: RSA-1024, RSA-2048, RSA-4096  
- **ECC**: Elliptic Curve Cryptography
- **Hashing**: MD5, SHA-1, SHA-256
- **PRNG**: Pseudo-Random Number Generation
- **Other**: General cryptographic functions

## 🧪 Usage Examples

### Python API
```python
from crypto_classifier_production import ProductionCryptoClassifier, CryptoExplainer

# Initialize
classifier = ProductionCryptoClassifier()
explainer = CryptoExplainer()

# Make prediction
features = {...}  # Your binary features
result = classifier.predict(features)

print(f"Prediction: {result['prediction']}")
print(f"Confidence: {result['confidence']:.1%}")

# Get explanation
explanation = explainer.explain(result)
print(explanation)
```

### REST API
```bash
# Start server
python crypto_classifier_production.py --api

# Make request
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"feature1": 0.5, "feature2": 0.8, ...}'
```

### Command Line
```bash
# Single file
python crypto_classifier_production.py \
  --input sample.json \
  --explain

# Batch processing
echo -e "file1.json\nfile2.json\nfile3.json" > batch_list.txt
python crypto_classifier_production.py \
  --batch batch_list.txt \
  --explain
```

## 📁 File Structure
```
vestigo-data/
├── ml/
│   └── production/
│       ├── best_pipeline.joblib          # Trained model
│       ├── model_metadata.json           # Model info
│       ├── label_encoder.joblib          # Label encoder
│       └── preprocessor.joblib           # Preprocessor
├── crypto_classifier_production.py       # Production script
├── requirements_production.txt           # Dependencies
└── enhanced_model.ipynb                  # Training notebook
```

## 🔧 Input Format

Features should be provided as JSON:
```json
{
  "feature1": 0.123,
  "feature2": 0.456,
  "feature3": 0.789,
  ...
}
```

## 📈 Output Format

Prediction results include:
```json
{
  "prediction": "aes256",
  "confidence": 0.87,
  "probabilities": {
    "aes256": 0.87,
    "aes128": 0.08,
    "rsa2048": 0.03,
    ...
  },
  "feature_importance": [...],
  "explanation": "The binary implements AES-256 with high confidence...",
  "success": true
}
```

## 🚀 Deployment Options

### 1. Local Development
```bash
python crypto_classifier_production.py --api
```

### 2. Docker Container
```dockerfile
FROM python:3.9-slim
COPY . /app
WORKDIR /app
RUN pip install -r requirements_production.txt
EXPOSE 5000
CMD ["python", "crypto_classifier_production.py", "--api"]
```

### 3. Cloud Deployment
- **AWS**: Deploy on EC2/ECS with Load Balancer
- **Azure**: Use Container Instances or App Service
- **GCP**: Deploy on Cloud Run or Compute Engine

## 🔍 Monitoring & Logging

The system includes:
- **Error Handling**: Graceful error responses
- **Performance Logging**: Prediction timing
- **Health Checks**: `/health` endpoint
- **Confidence Tracking**: Monitor prediction quality

## 🛡️ Security Considerations

- **API Authentication**: Add authentication for production
- **Input Validation**: Validate feature inputs
- **Rate Limiting**: Prevent API abuse
- **Secure Storage**: Protect model files
- **Audit Logging**: Track predictions

## 📞 Support

For issues or questions:
1. Check the training notebook: `enhanced_model.ipynb`
2. Review model performance metrics
3. Validate input feature format
4. Check system requirements

## 🏆 Performance Tips

1. **Batch Processing**: Use batch mode for multiple files
2. **GPU Acceleration**: Ensure CUDA for training speedup
3. **Memory Management**: Monitor memory usage with large batches
4. **Caching**: Cache preprocessor for repeated predictions
5. **Model Updates**: Retrain periodically with new data

---

**Model Version**: v1.0 (December 2024)  
**Expected Accuracy**: 87%  
**Production Ready**: ✅