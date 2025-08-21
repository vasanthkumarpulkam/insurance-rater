import pandas as pd
import numpy as np
import json
from datetime import datetime
import os

class InsuranceDatasetGenerator:
    """Generate synthetic insurance dataset with realistic patterns"""
    
    def __init__(self, seed=42):
        np.random.seed(seed)
        self.seed = seed
        
    def generate_dataset(self, n_samples=10000):
        """Generate synthetic insurance dataset"""
        
        # Driver demographics
        driver_age = np.random.normal(40, 15, n_samples)
        driver_age = np.clip(driver_age, 16, 80).astype(int)
        
        # Vehicle characteristics
        vehicle_age = np.random.exponential(5, n_samples)
        vehicle_age = np.clip(vehicle_age, 0, 25).astype(int)
        
        # Vehicle types with different risk profiles
        vehicle_types = ['Sedan', 'SUV', 'Truck', 'Sports Car', 'Luxury', 'Economy']
        vehicle_type_weights = [0.3, 0.25, 0.15, 0.1, 0.1, 0.1]
        vehicle_type = np.random.choice(vehicle_types, n_samples, p=vehicle_type_weights)
        
        # Risk factors
        violations = np.random.poisson(0.8, n_samples)
        violations = np.clip(violations, 0, 8)
        
        accidents = np.random.poisson(0.3, n_samples)
        accidents = np.clip(accidents, 0, 5)
        
        prior_claims = np.random.poisson(0.4, n_samples)
        prior_claims = np.clip(prior_claims, 0, 6)
        
        # Geographic risk (simulated as regional risk multiplier)
        geographic_risk = np.random.normal(1.0, 0.2, n_samples)
        geographic_risk = np.clip(geographic_risk, 0.5, 2.0)
        
        # Credit score (affects insurance in many states)
        credit_score = np.random.normal(700, 100, n_samples)
        credit_score = np.clip(credit_score, 300, 850).astype(int)
        
        # Calculate base risk score using realistic factors
        risk_score = self._calculate_risk_score(
            driver_age, vehicle_age, vehicle_type, violations, 
            accidents, prior_claims, geographic_risk, credit_score
        )
        
        # Calculate claim probability and severity
        claim_probability = self._sigmoid(risk_score / 20 - 2.5)
        has_claim = np.random.binomial(1, claim_probability, n_samples)
        
        # Claim cost with realistic distribution
        base_claim_cost = np.random.lognormal(8, 1.5, n_samples)  # Log-normal for realistic claim distribution
        claim_severity_multiplier = 1 + (risk_score / 100) * 2  # Higher risk = higher severity
        claim_cost = np.where(has_claim, base_claim_cost * claim_severity_multiplier, 0)
        claim_cost = np.clip(claim_cost, 0, 100000)  # Cap at $100k
        
        # Premium calculation
        base_premium = 1200  # Base annual premium
        risk_multiplier = 1 + (risk_score / 100)
        annual_premium = base_premium * risk_multiplier
        
        # Create DataFrame
        df = pd.DataFrame({
            'Driver_Age': driver_age,
            'Vehicle_Age': vehicle_age,
            'Vehicle_Type': vehicle_type,
            'Violations': violations,
            'Accidents': accidents,
            'Prior_Claims': prior_claims,
            'Geographic_Risk': geographic_risk,
            'Credit_Score': credit_score,
            'Risk_Score': risk_score,
            'Claim_Probability': claim_probability,
            'Has_Claim': has_claim,
            'Claim_Cost': claim_cost,
            'Annual_Premium': annual_premium
        })
        
        return df
    
    def _calculate_risk_score(self, driver_age, vehicle_age, vehicle_type, 
                            violations, accidents, prior_claims, geographic_risk, credit_score):
        """Calculate realistic risk score based on insurance industry factors"""
        
        risk_score = np.zeros(len(driver_age))
        
        # Age factor (U-shaped curve - young and very old drivers are riskier)
        age_risk = np.where(driver_age < 25, (25 - driver_age) * 2,
                           np.where(driver_age > 65, (driver_age - 65) * 1.5, 0))
        risk_score += age_risk
        
        # Vehicle age factor
        risk_score += vehicle_age * 1.5
        
        # Vehicle type factor
        vehicle_risk_map = {
            'Economy': -5, 'Sedan': 0, 'SUV': 5, 
            'Truck': 8, 'Luxury': 10, 'Sports Car': 20
        }
        for i, vtype in enumerate(vehicle_type):
            risk_score[i] += vehicle_risk_map.get(vtype, 0)
        
        # Violations (major factor)
        risk_score += violations * 15
        
        # Accidents (major factor)
        risk_score += accidents * 20
        
        # Prior claims
        risk_score += prior_claims * 12
        
        # Geographic risk
        risk_score += (geographic_risk - 1) * 30
        
        # Credit score factor (inverse relationship)
        credit_risk = (750 - credit_score) / 10
        risk_score += np.clip(credit_risk, -10, 20)
        
        # Normalize to 0-100 scale
        risk_score = np.clip(risk_score, 0, 100)
        
        return risk_score
    
    def _sigmoid(self, x):
        """Sigmoid function for probability calculation"""
        return 1 / (1 + np.exp(-x))
    
    def save_dataset(self, df, filename='insurance_dataset.csv'):
        """Save dataset to CSV file"""
        os.makedirs('ml/data', exist_ok=True)
        filepath = f'ml/data/{filename}'
        df.to_csv(filepath, index=False)
        
        # Save metadata
        metadata = {
            'filename': filename,
            'n_samples': len(df),
            'features': list(df.columns),
            'generated_at': datetime.now().isoformat(),
            'seed': self.seed
        }
        
        with open(f'ml/data/{filename.replace(".csv", "_metadata.json")}', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        return filepath

if __name__ == '__main__':
    # Generate and save dataset
    generator = InsuranceDatasetGenerator()
    df = generator.generate_dataset(n_samples=15000)
    filepath = generator.save_dataset(df)
    
    print(f"Generated dataset with {len(df)} samples")
    print(f"Saved to: {filepath}")
    print("\nDataset summary:")
    print(df.describe())
    print("\nClaim rate:", df['Has_Claim'].mean())
    print("Average claim cost:", df[df['Has_Claim'] == 1]['Claim_Cost'].mean())
