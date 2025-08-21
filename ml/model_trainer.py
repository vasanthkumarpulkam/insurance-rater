import pandas as pd
import numpy as np
import joblib
import json
import os
from datetime import datetime
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
from interpret.glassbox import ExplainableBoostingClassifier, ExplainableBoostingRegressor
import warnings
warnings.filterwarnings('ignore')

class InsuranceMLPipeline:
    """Comprehensive ML pipeline for insurance risk assessment"""
    
    def __init__(self):
        self.models = {}
        self.encoders = {}
        self.scalers = {}
        self.feature_importance = {}
        self.model_performance = {}
        
    def load_data(self, filepath='ml/data/insurance_dataset.csv'):
        """Load and preprocess insurance dataset"""
        self.df = pd.read_csv(filepath)
        print(f"Loaded dataset with {len(self.df)} samples and {len(self.df.columns)} features")
        return self.df
    
    def prepare_features(self, target_type='classification'):
        """Prepare features for model training"""
        
        # Separate features and targets
        feature_columns = ['Driver_Age', 'Vehicle_Age', 'Vehicle_Type', 'Violations', 
                          'Accidents', 'Prior_Claims', 'Geographic_Risk', 'Credit_Score']
        
        X = self.df[feature_columns].copy()
        
        # Encode categorical variables
        if 'Vehicle_Type' in X.columns:
            le = LabelEncoder()
            X['Vehicle_Type_Encoded'] = le.fit_transform(X['Vehicle_Type'])
            self.encoders['Vehicle_Type'] = le
            X = X.drop('Vehicle_Type', axis=1)
        
        # Target variables
        if target_type == 'classification':
            y = self.df['Has_Claim']  # Binary classification
            self.target_type = 'classification'
        else:
            y = self.df['Claim_Cost']  # Regression
            self.target_type = 'regression'
        
        # Store for later use
        self.feature_names = X.columns.tolist()
        
        return X, y
    
    def train_random_forest(self, X, y, task_type='classification'):
        """Train Random Forest model"""
        print(f"Training Random Forest for {task_type}...")
        
        if task_type == 'classification':
            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
        else:
            model = RandomForestRegressor(
                n_estimators=100,
                max_depth=15,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
        
        model.fit(X, y)
        self.models[f'random_forest_{task_type}'] = model
        
        # Store feature importance
        importance_dict = dict(zip(self.feature_names, model.feature_importances_))
        self.feature_importance[f'random_forest_{task_type}'] = importance_dict
        
        return model
    
    def train_xgboost(self, X, y, task_type='classification'):
        """Train XGBoost model"""
        print(f"Training XGBoost for {task_type}...")
        
        if task_type == 'classification':
            model = xgb.XGBClassifier(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                eval_metric='logloss'
            )
        else:
            model = xgb.XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                eval_metric='rmse'
            )
        
        model.fit(X, y)
        self.models[f'xgboost_{task_type}'] = model
        
        # Store feature importance
        importance_dict = dict(zip(self.feature_names, model.feature_importances_))
        self.feature_importance[f'xgboost_{task_type}'] = importance_dict
        
        return model
    
    def train_ebm(self, X, y, task_type='classification'):
        """Train Explainable Boosting Machine"""
        print(f"Training EBM for {task_type}...")
        
        if task_type == 'classification':
            model = ExplainableBoostingClassifier(
                random_state=42,
                n_jobs=-1
            )
        else:
            model = ExplainableBoostingRegressor(
                random_state=42,
                n_jobs=-1
            )
        
        model.fit(X, y)
        self.models[f'ebm_{task_type}'] = model
        
        # Store feature importance
        importance_dict = dict(zip(self.feature_names, model.feature_importances_))
        self.feature_importance[f'ebm_{task_type}'] = importance_dict
        
        return model
    
    def evaluate_model(self, model, X_test, y_test, model_name, task_type):
        """Evaluate model performance"""
        y_pred = model.predict(X_test)
        
        metrics = {'model_name': model_name, 'task_type': task_type}
        
        if task_type == 'classification':
            metrics.update({
                'accuracy': accuracy_score(y_test, y_pred),
                'precision': precision_score(y_test, y_pred, average='weighted'),
                'recall': recall_score(y_test, y_pred, average='weighted'),
                'f1_score': f1_score(y_test, y_pred, average='weighted')
            })
            
            # ROC AUC if binary classification
            if len(np.unique(y_test)) == 2:
                y_pred_proba = model.predict_proba(X_test)[:, 1]
                metrics['roc_auc'] = roc_auc_score(y_test, y_pred_proba)
        
        else:  # regression
            metrics.update({
                'mse': mean_squared_error(y_test, y_pred),
                'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
                'mae': mean_absolute_error(y_test, y_pred),
                'r2_score': r2_score(y_test, y_pred)
            })
        
        self.model_performance[model_name] = metrics
        return metrics
    
    def train_all_models(self):
        """Train all models for both classification and regression"""
        
        # Prepare data for classification (claim prediction)
        X_class, y_class = self.prepare_features('classification')
        X_train_class, X_test_class, y_train_class, y_test_class = train_test_split(
            X_class, y_class, test_size=0.2, random_state=42, stratify=y_class
        )
        
        # Prepare data for regression (claim cost prediction)
        # Only use samples with claims for regression
        claim_mask = self.df['Has_Claim'] == 1
        X_reg = X_class[claim_mask]
        y_reg = self.df[claim_mask]['Claim_Cost']
        
        if len(X_reg) > 100:  # Only train if we have enough samples
            X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(
                X_reg, y_reg, test_size=0.2, random_state=42
            )
        else:
            print("Not enough claim samples for regression models")
            X_train_reg = X_test_reg = y_train_reg = y_test_reg = None
        
        # Train classification models
        print("=== Training Classification Models ===")
        rf_class = self.train_random_forest(X_train_class, y_train_class, 'classification')
        xgb_class = self.train_xgboost(X_train_class, y_train_class, 'classification')
        ebm_class = self.train_ebm(X_train_class, y_train_class, 'classification')
        
        # Evaluate classification models
        self.evaluate_model(rf_class, X_test_class, y_test_class, 'random_forest_classification', 'classification')
        self.evaluate_model(xgb_class, X_test_class, y_test_class, 'xgboost_classification', 'classification')
        self.evaluate_model(ebm_class, X_test_class, y_test_class, 'ebm_classification', 'classification')
        
        # Train regression models (if enough data)
        if X_train_reg is not None:
            print("\n=== Training Regression Models ===")
            rf_reg = self.train_random_forest(X_train_reg, y_train_reg, 'regression')
            xgb_reg = self.train_xgboost(X_train_reg, y_train_reg, 'regression')
            ebm_reg = self.train_ebm(X_train_reg, y_train_reg, 'regression')
            
            # Evaluate regression models
            self.evaluate_model(rf_reg, X_test_reg, y_test_reg, 'random_forest_regression', 'regression')
            self.evaluate_model(xgb_reg, X_test_reg, y_test_reg, 'xgboost_regression', 'regression')
            self.evaluate_model(ebm_reg, X_test_reg, y_test_reg, 'ebm_regression', 'regression')
        
        return self.models, self.model_performance
    
    def predict_risk(self, driver_age, vehicle_age, vehicle_type, violations, accidents, prior_claims, 
                    geographic_risk=1.0, credit_score=700):
        """Make risk prediction using the best performing model"""
        
        # Prepare input data
        input_data = pd.DataFrame({
            'Driver_Age': [driver_age],
            'Vehicle_Age': [vehicle_age],
            'Vehicle_Type_Encoded': [self.encoders['Vehicle_Type'].transform([vehicle_type])[0]],
            'Violations': [violations],
            'Accidents': [accidents],
            'Prior_Claims': [prior_claims],
            'Geographic_Risk': [geographic_risk],
            'Credit_Score': [credit_score]
        })
        
        # Get best classification model (highest ROC AUC)
        best_class_model = None
        best_auc = 0
        for model_name, metrics in self.model_performance.items():
            if metrics['task_type'] == 'classification' and 'roc_auc' in metrics:
                if metrics['roc_auc'] > best_auc:
                    best_auc = metrics['roc_auc']
                    best_class_model = self.models[model_name]
        
        if best_class_model is None:
            best_class_model = self.models['random_forest_classification']
        
        # Predict claim probability
        claim_probability = best_class_model.predict_proba(input_data)[0][1]
        
        # Calculate risk score (0-100)
        risk_score = int(claim_probability * 100)
        
        # Calculate premium adjustment
        base_premium = 1200
        risk_multiplier = 1 + (claim_probability * 1.5)  # Up to 150% increase
        suggested_premium = int(base_premium * risk_multiplier)
        premium_adjustment = f"+{int((risk_multiplier - 1) * 100)}% due to risk factors"
        
        # Get feature importance for explanation
        feature_importance = self.feature_importance.get(
            list(self.models.keys())[0], {}
        )
        
        return {
            'risk_score': risk_score,
            'claim_probability': round(claim_probability, 3),
            'suggested_premium': suggested_premium,
            'premium_adjustment': premium_adjustment,
            'base_premium': base_premium,
            'risk_category': 'High' if risk_score > 60 else 'Low'
        }
    
    def save_models(self):
        """Save trained models and metadata"""
        os.makedirs('ml/models', exist_ok=True)
        
        # Save models
        for model_name, model in self.models.items():
            joblib.dump(model, f'ml/models/{model_name}.joblib')
        
        # Save encoders
        for encoder_name, encoder in self.encoders.items():
            joblib.dump(encoder, f'ml/models/{encoder_name}_encoder.joblib')
        
        # Save metadata
        metadata = {
            'models': list(self.models.keys()),
            'feature_names': self.feature_names,
            'model_performance': self.model_performance,
            'feature_importance': self.feature_importance,
            'trained_at': datetime.now().isoformat()
        }
        
        with open('ml/models/metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print("Models saved successfully!")
    
    def load_models(self):
        """Load pre-trained models"""
        try:
            # Load metadata
            with open('ml/models/metadata.json', 'r') as f:
                metadata = json.load(f)
            
            # Load models
            for model_name in metadata['models']:
                self.models[model_name] = joblib.load(f'ml/models/{model_name}.joblib')
            
            # Load encoders
            self.encoders['Vehicle_Type'] = joblib.load('ml/models/Vehicle_Type_encoder.joblib')
            
            # Load other metadata
            self.feature_names = metadata['feature_names']
            self.model_performance = metadata['model_performance']
            self.feature_importance = metadata['feature_importance']
            
            print("Models loaded successfully!")
            return True
        except Exception as e:
            print(f"Error loading models: {e}")
            return False

if __name__ == '__main__':
    # Example usage
    pipeline = InsuranceMLPipeline()
    
    # Generate data if not exists
    if not os.path.exists('ml/data/insurance_dataset.csv'):
        from dataset_generator import InsuranceDatasetGenerator
        generator = InsuranceDatasetGenerator()
        df = generator.generate_dataset(15000)
        generator.save_dataset(df)
    
    # Load data and train models
    pipeline.load_data()
    models, performance = pipeline.train_all_models()
    
    # Save models
    pipeline.save_models()
    
    # Display results
    print("\n=== Model Performance Summary ===")
    for model_name, metrics in performance.items():
        print(f"\n{model_name}:")
        for metric, value in metrics.items():
            if isinstance(value, float):
                print(f"  {metric}: {value:.4f}")
            else:
                print(f"  {metric}: {value}")
    
    # Test prediction
    print("\n=== Test Prediction ===")
    result = pipeline.predict_risk(
        driver_age=25, vehicle_age=3, vehicle_type='Sports Car',
        violations=2, accidents=1, prior_claims=0
    )
    print(result)
