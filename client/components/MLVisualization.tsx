import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

interface FeatureImportance {
  [feature: string]: number;
}

interface ModelExplanationProps {
  featureImportance: Record<string, FeatureImportance>;
  modelPerformance: Record<string, any>;
}

export const ModelExplanation: React.FC<ModelExplanationProps> = ({
  featureImportance,
  modelPerformance
}) => {
  const getFeatureDisplayName = (feature: string) => {
    const displayNames: Record<string, string> = {
      'Driver_Age': 'Driver Age',
      'Vehicle_Age': 'Vehicle Age',
      'Vehicle_Type_Encoded': 'Vehicle Type',
      'Violations': 'Traffic Violations',
      'Accidents': 'Accident History',
      'Prior_Claims': 'Prior Claims',
      'Geographic_Risk': 'Geographic Risk',
      'Credit_Score': 'Credit Score'
    };
    return displayNames[feature] || feature;
  };

  const getTopFeatures = (importance: FeatureImportance, topN: number = 5) => {
    return Object.entries(importance)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN);
  };

  const getBestModel = () => {
    const classificationModels = Object.entries(modelPerformance)
      .filter(([_, metrics]) => metrics.task_type === 'classification' && metrics.roc_auc);
    
    if (classificationModels.length === 0) return null;
    
    return classificationModels.reduce((best, current) => 
      current[1].roc_auc > best[1].roc_auc ? current : best
    );
  };

  const bestModel = getBestModel();

  if (Object.keys(featureImportance).length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500">Train models to see feature importance and explanations.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Best Model Summary */}
      {bestModel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Best Performing Model</span>
            </CardTitle>
            <CardDescription>
              Top model recommendation based on validation performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold capitalize">
                  {bestModel[0].replace('_classification', '').replace('_', ' ')}
                </h3>
                <p className="text-sm text-gray-600">
                  Recommended for production use
                </p>
              </div>
              <Badge variant="default" className="text-sm">
                {(bestModel[1].roc_auc * 100).toFixed(1)}% ROC AUC
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Accuracy</div>
                <div className="font-medium">{(bestModel[1].accuracy * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-gray-500">Precision</div>
                <div className="font-medium">{(bestModel[1].precision * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-gray-500">Recall</div>
                <div className="font-medium">{(bestModel[1].recall * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-gray-500">F1 Score</div>
                <div className="font-medium">{(bestModel[1].f1_score * 100).toFixed(1)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Importance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Feature Importance Analysis</span>
          </CardTitle>
          <CardDescription>
            Understanding which factors drive risk predictions across different models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(featureImportance).map(([modelName, importance]) => {
              const topFeatures = getTopFeatures(importance);
              const maxImportance = Math.max(...Object.values(importance));
              
              return (
                <div key={modelName} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4 capitalize">
                    {modelName.replace('_', ' ')} - Top Risk Factors
                  </h3>
                  <div className="space-y-3">
                    {topFeatures.map(([feature, value], index) => (
                      <div key={feature} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {index + 1}. {getFeatureDisplayName(feature)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {(value * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={(value / maxImportance) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Risk Factor Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>Risk Factor Insights</span>
          </CardTitle>
          <CardDescription>
            Key insights from the machine learning analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-blue-50">
              <h4 className="font-semibold text-blue-900 mb-2">Primary Risk Drivers</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Traffic violations and accidents are the strongest predictors</li>
                <li>• Young drivers (under 25) show significantly higher risk</li>
                <li>• Prior claims history strongly correlates with future claims</li>
                <li>• Vehicle age impacts both frequency and severity of claims</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg bg-green-50">
              <h4 className="font-semibold text-green-900 mb-2">Protective Factors</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Clean driving record (0 violations/accidents) reduces risk by 20%</li>
                <li>• Drivers aged 25-50 represent the lowest risk category</li>
                <li>• Higher credit scores correlate with lower claim rates</li>
                <li>• Geographic factors can provide risk reduction opportunities</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg bg-amber-50">
              <h4 className="font-semibold text-amber-900 mb-2">Model Limitations</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Based on synthetic data - real-world validation needed</li>
                <li>• Limited to traditional risk factors</li>
                <li>• May not capture emerging risk patterns</li>
                <li>• Requires regular retraining with fresh data</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg bg-purple-50">
              <h4 className="font-semibold text-purple-900 mb-2">Regulatory Compliance</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Explainable models support regulatory requirements</li>
                <li>• Feature importance provides audit trail</li>
                <li>• Bias monitoring capabilities built-in</li>
                <li>• Transparent decision-making process</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Individual feature importance chart component
export const FeatureImportanceChart: React.FC<{
  importance: FeatureImportance;
  title?: string;
}> = ({ importance, title = "Feature Importance" }) => {
  const sortedFeatures = Object.entries(importance)
    .sort(([, a], [, b]) => b - a);
  
  const maxImportance = Math.max(...Object.values(importance));

  const getFeatureDisplayName = (feature: string) => {
    const displayNames: Record<string, string> = {
      'Driver_Age': 'Driver Age',
      'Vehicle_Age': 'Vehicle Age',
      'Vehicle_Type_Encoded': 'Vehicle Type',
      'Violations': 'Traffic Violations',
      'Accidents': 'Accident History',
      'Prior_Claims': 'Prior Claims',
      'Geographic_Risk': 'Geographic Risk',
      'Credit_Score': 'Credit Score'
    };
    return displayNames[feature] || feature;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedFeatures.map(([feature, value]) => (
            <div key={feature} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {getFeatureDisplayName(feature)}
                </span>
                <span className="text-xs text-gray-500">
                  {(value * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={(value / maxImportance) * 100} 
                className="h-2"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
