# RiskAssess Pro - ML-Enhanced Auto Liability Insurance Risk Assessment

A production-ready full-stack application that combines traditional insurance risk assessment with advanced machine learning capabilities, featuring multiple ML models, synthetic dataset generation, and comprehensive model explainability.

## 🚀 Features

### Core Insurance Assessment
- **Real-time Risk Scoring**: Traditional rule-based risk assessment (0-100 scale)
- **Premium Calculation**: Dynamic premium suggestions with adjustment factors
- **Risk Categorization**: Low/High risk classification with detailed explanations
- **Professional UI**: Modern, insurance industry-standard interface

### Advanced ML Capabilities
- **Multiple ML Models**: Random Forest, XGBoost, and Explainable Boosting Machines (EBM)
- **Synthetic Dataset Generation**: Realistic insurance data with 15,000+ samples
- **Model Performance Monitoring**: Comprehensive metrics and validation
- **Feature Importance Analysis**: Understanding which factors drive predictions
- **Model Explainability**: Regulatory-friendly transparent decision making

### Technical Stack
- **Frontend**: React 18 + TypeScript + TailwindCSS + Shadcn/ui
- **Backend**: Express.js + Node.js
- **ML Pipeline**: Python + scikit-learn + XGBoost + interpret
- **Routing**: React Router 6 (SPA mode)
- **Package Manager**: PNPM

## 📊 ML Models & Performance

### Implemented Models

1. **Random Forest** - Robust baseline with high interpretability
2. **XGBoost** - High accuracy gradient boosting, widely used in insurance
3. **Explainable Boosting Machines (EBM)** - Transparent, regulatory-friendly models

### Risk Factors Analyzed
- Driver age and experience
- Vehicle age and type
- Traffic violations history
- Accident history
- Prior insurance claims
- Geographic risk factors
- Credit score impact

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ and PNPM
- Python 3.7+ with pip

### Quick Start

1. **Install Node.js dependencies**:
   ```bash
   pnpm install
   ```

2. **Setup Python ML environment**:
   ```bash
   python3 ml/setup.py
   # or manually:
   pip install -r ml/requirements.txt
   ```

3. **Start development server**:
   ```bash
   pnpm dev
   ```

4. **Access the application**:
   Open http://localhost:8080 and navigate through the tabs:
   - **Risk Assessment**: Traditional and ML-powered predictions
   - **ML Models**: Train and manage machine learning models
   - **Dataset**: View synthetic dataset statistics
   - **Analytics**: Model performance and feature importance

## 📈 Using the ML Pipeline

### 1. Generate Synthetic Dataset
Navigate to the "ML Models" tab and click "Generate Dataset" to create a realistic insurance dataset with:
- 15,000 synthetic records
- Realistic risk factor distributions
- Proper claim rate patterns
- Feature correlations based on industry data

### 2. Train ML Models
Click "Train Models" to train all three algorithms:
- Cross-validation for robust performance estimation
- Feature importance calculation
- Performance metrics (accuracy, precision, recall, ROC AUC)
- Model persistence for production use

### 3. Model Comparison & Selection
The "Analytics" tab provides:
- Side-by-side model performance comparison
- Feature importance visualization
- Best model recommendations
- Regulatory compliance insights

### 4. Production Predictions
Use the trained models for enhanced risk assessment:
- Higher accuracy than rule-based systems
- Explainable predictions for regulatory compliance
- Real-time inference capabilities
- Confidence intervals and uncertainty quantification

## 🔍 Model Explainability

### Feature Importance
- **Traffic Violations**: Strongest predictor of claim likelihood
- **Driver Age**: U-shaped risk curve (young and elderly drivers)
- **Accident History**: Major factor in both frequency and severity
- **Vehicle Age**: Impacts repair costs and safety features
- **Prior Claims**: Strong indicator of future claim behavior

### Regulatory Compliance
- Transparent decision-making process
- Audit trail for all predictions
- Bias monitoring capabilities
- Explainable AI for regulatory approval

## 🏗️ Architecture

### Frontend Architecture
```
client/
├── pages/           # Route components with tabbed interface
├── components/ui/   # Reusable UI components
├── components/      # ML visualization components
└── App.tsx          # Main application with routing
```

### Backend API
```
server/
├── routes/ml.ts     # ML pipeline API endpoints
├── routes/demo.ts   # Example routes
└── index.ts         # Express server setup
```

### ML Pipeline
```
ml/
├── dataset_generator.py  # Synthetic data generation
├── model_trainer.py     # ML model training pipeline
├── requirements.txt     # Python dependencies
└── setup.py            # Environment setup script
```

## 🚀 API Endpoints

### ML Pipeline Endpoints
- `POST /api/ml/generate-dataset` - Generate synthetic insurance dataset
- `POST /api/ml/train-models` - Train all ML models
- `GET /api/ml/model-performance` - Get model metrics and performance
- `POST /api/ml/predict` - Make predictions with trained models
- `GET /api/ml/dataset-stats` - Get dataset statistics

### Traditional Assessment
- `GET /api/ping` - Health check
- `GET /api/demo` - Demo endpoint

## 📊 Dataset Schema

```python
{
  'Driver_Age': int,          # 16-80 years
  'Vehicle_Age': int,         # 0-25 years
  'Vehicle_Type': str,        # Sedan, SUV, Sports Car, etc.
  'Violations': int,          # 0-8 traffic violations
  'Accidents': int,           # 0-5 accidents
  'Prior_Claims': int,        # 0-6 prior claims
  'Geographic_Risk': float,   # 0.5-2.0 risk multiplier
  'Credit_Score': int,        # 300-850 credit score
  'Risk_Score': float,        # 0-100 calculated risk
  'Has_Claim': int,          # 0/1 binary target
  'Claim_Cost': float,       # $0-$100k claim amount
  'Annual_Premium': float    # Calculated premium
}
```

## 🎯 Production Deployment

### Cloud Deployment Options
- **Netlify**: Connect via MCP integration for automatic deployment
- **Vercel**: Built-in support with zero configuration
- **Custom**: Use `pnpm build` and `pnpm start` for any hosting platform

### Model Serving
- Models are automatically saved as joblib files
- Python backend handles model loading and inference
- Stateless API design for horizontal scaling
- Redis integration possible for model caching

## 🔒 Security & Compliance

### Data Privacy
- Synthetic data only - no real customer information
- Secure model serving without data leakage
- Environment variable management for sensitive config

### Regulatory Features
- Model interpretability for insurance regulation compliance
- Audit logging capabilities
- Bias detection and monitoring
- Transparent feature importance reporting

## 🧪 Testing & Validation

### Model Validation
- Cross-validation with stratified sampling
- Hold-out test sets for unbiased evaluation
- Performance monitoring across demographic groups
- A/B testing framework ready

### Code Quality
- TypeScript for type safety
- Comprehensive error handling
- Input validation and sanitization
- Production-ready logging

## 📚 Extensions & Customization

### Adding New Models
1. Extend `model_trainer.py` with new algorithms
2. Update API endpoints to handle new model types
3. Add UI components for new model visualization

### Custom Risk Factors
1. Modify `dataset_generator.py` for new features
2. Update model training pipeline
3. Extend frontend forms and validation

### Integration Options
- REST API for external systems
- Webhook support for real-time updates
- Database integration for production data
- Export capabilities for regulatory reporting

## 📖 Documentation

For additional documentation and guides:
- [Builder.io Projects Documentation](https://www.builder.io/c/docs/projects)
- [Model Training Guide](ml/README.md)
- [API Reference](docs/api.md)

## 🤝 Contributing

This is a production-ready template that can be extended for real-world insurance applications. Key areas for enhancement:
- Additional ML algorithms (Neural Networks, Ensemble methods)
- Real-time model retraining capabilities
- Advanced visualization and dashboards
- Integration with external data sources
- Enhanced regulatory reporting features

## 📄 License

MIT License - see LICENSE file for details.

---

**Note**: This application uses synthetic data for demonstration. For production use with real customer data, ensure compliance with data protection regulations (GDPR, CCPA, etc.) and insurance industry standards.
