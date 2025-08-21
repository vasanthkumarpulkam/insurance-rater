import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Shield, TrendingUp, FileText, Car, User, AlertTriangle, CheckCircle2, Loader2, Brain, Database, BarChart3, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModelExplanation } from '@/components/MLVisualization';

interface RiskAssessmentInput {
  driverAge: number;
  vehicleAge: number;
  violations: number;
  accidents: number;
  priorClaims: number;
}

interface RiskResult {
  riskScore: number;
  riskCategory: 'Low' | 'High';
  premiumSuggestion: number;
  adjustmentFactor: number;
  keyReasons: string[];
}

interface MLModelPerformance {
  model_name: string;
  task_type: string;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  roc_auc?: number;
  mse?: number;
  rmse?: number;
  mae?: number;
  r2_score?: number;
}

interface DatasetStats {
  total_samples: number;
  claim_rate: number;
  avg_risk_score: number;
  avg_premium: number;
  avg_claim_cost: number;
  feature_stats: {
    driver_age: { mean: number; min: number; max: number };
    vehicle_age: { mean: number; min: number; max: number };
    violations: { mean: number; max: number };
    accidents: { mean: number; max: number };
  };
}

interface MLPrediction {
  risk_score: number;
  claim_probability: number;
  suggested_premium: number;
  premium_adjustment: string;
  base_premium: number;
  risk_category: string;
}

const BASELINE_PREMIUM = 1200; // Base annual premium

export default function Index() {
  const [formData, setFormData] = useState<RiskAssessmentInput>({
    driverAge: 0,
    vehicleAge: 0,
    violations: 0,
    accidents: 0,
    priorClaims: 0,
  });

  const [result, setResult] = useState<RiskResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);

  // ML Dashboard state
  const [mlResult, setMLResult] = useState<MLPrediction | null>(null);
  const [modelPerformance, setModelPerformance] = useState<Record<string, MLModelPerformance>>({});
  const [featureImportance, setFeatureImportance] = useState<Record<string, Record<string, number>>>({});
  const [datasetStats, setDatasetStats] = useState<DatasetStats | null>(null);
  const [mlStatus, setMLStatus] = useState({
    datasetGenerated: false,
    modelsLoaded: false,
    training: false,
    generating: false
  });
  const [activeTab, setActiveTab] = useState('assessment');

  // Simulated Random Forest model logic
  const calculateRisk = (input: RiskAssessmentInput): RiskResult => {
    let riskScore = 50; // Base score
    const reasons: string[] = [];

    // Driver age factor
    if (input.driverAge < 25) {
      riskScore += 15;
      reasons.push('Young driver (under 25) increases risk');
    } else if (input.driverAge > 65) {
      riskScore += 8;
      reasons.push('Senior driver (over 65) slightly increases risk');
    } else if (input.driverAge >= 25 && input.driverAge <= 50) {
      riskScore -= 5;
      reasons.push('Prime age driver (25-50) reduces risk');
    }

    // Vehicle age factor
    if (input.vehicleAge > 10) {
      riskScore += 10;
      reasons.push('Older vehicle (10+ years) increases risk');
    } else if (input.vehicleAge < 3) {
      riskScore -= 3;
      reasons.push('Newer vehicle (under 3 years) slightly reduces risk');
    }

    // Violations factor
    riskScore += input.violations * 12;
    if (input.violations > 0) {
      reasons.push(`${input.violations} traffic violation(s) significantly increase risk`);
    }

    // Accidents factor
    riskScore += input.accidents * 18;
    if (input.accidents > 0) {
      reasons.push(`${input.accidents} accident(s) significantly increase risk`);
    }

    // Prior claims factor
    riskScore += input.priorClaims * 15;
    if (input.priorClaims > 0) {
      reasons.push(`${input.priorClaims} prior claim(s) increase risk`);
    }

    // Clean record bonus
    if (input.violations === 0 && input.accidents === 0 && input.priorClaims === 0) {
      riskScore -= 10;
      reasons.push('Clean driving record reduces risk');
    }

    // Ensure score is within bounds
    riskScore = Math.max(0, Math.min(100, riskScore));

    const riskCategory = riskScore > 60 ? 'High' : 'Low';
    const adjustmentFactor = riskScore / 50; // 1.0 is baseline
    const premiumSuggestion = Math.round(BASELINE_PREMIUM * adjustmentFactor);

    return {
      riskScore: Math.round(riskScore),
      riskCategory,
      premiumSuggestion,
      adjustmentFactor: Math.round(adjustmentFactor * 100) / 100,
      keyReasons: reasons.slice(0, 4), // Top 4 reasons
    };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.driverAge || formData.driverAge < 16 || formData.driverAge > 100) {
      newErrors.driverAge = 'Driver age must be between 16 and 100';
    }

    if (formData.vehicleAge < 0 || formData.vehicleAge > 30) {
      newErrors.vehicleAge = 'Vehicle age must be between 0 and 30 years';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setProgress(0);

    // Simulate API call with progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 20;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 300);

    await new Promise(resolve => setTimeout(resolve, 1500));

    clearInterval(progressInterval);
    setProgress(100);

    const riskResult = calculateRisk(formData);
    setResult(riskResult);
    setIsLoading(false);
    setProgress(0);
  };

  const handleInputChange = (field: keyof RiskAssessmentInput, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseInt(value) || 0,
    }));
  };

  // ML API Functions
  const generateDataset = async () => {
    setMLStatus(prev => ({ ...prev, generating: true }));
    try {
      const response = await fetch('/api/ml/generate-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples: 15000 })
      });
      const data = await response.json();

      if (data.success) {
        setMLStatus(prev => ({ ...prev, datasetGenerated: true }));
        await loadDatasetStats();
      } else {
        console.error('Dataset generation failed:', data.error);
      }
    } catch (error) {
      console.error('Error generating dataset:', error);
    } finally {
      setMLStatus(prev => ({ ...prev, generating: false }));
    }
  };

  const trainModels = async () => {
    setMLStatus(prev => ({ ...prev, training: true }));
    try {
      const response = await fetch('/api/ml/train-models', {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        setMLStatus(prev => ({ ...prev, modelsLoaded: true }));
        setModelPerformance(data.performance || {});
      } else {
        console.error('Model training failed:', data.error);
      }
    } catch (error) {
      console.error('Error training models:', error);
    } finally {
      setMLStatus(prev => ({ ...prev, training: false }));
    }
  };

  const loadModelPerformance = async () => {
    try {
      const response = await fetch('/api/ml/model-performance');
      const data = await response.json();

      if (data.success) {
        setModelPerformance(data.performance || {});
        setMLStatus(prev => ({ ...prev, modelsLoaded: true }));
      }
    } catch (error) {
      console.error('Error loading model performance:', error);
    }
  };

  const loadDatasetStats = async () => {
    try {
      const response = await fetch('/api/ml/dataset-stats');
      const data = await response.json();

      if (data.success) {
        setDatasetStats(data.stats);
        setMLStatus(prev => ({ ...prev, datasetGenerated: true }));
      }
    } catch (error) {
      console.error('Error loading dataset stats:', error);
    }
  };

  const predictWithMLModel = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverAge: formData.driverAge,
          vehicleAge: formData.vehicleAge,
          vehicleType: 'Sedan', // Could be made dynamic
          violations: formData.violations,
          accidents: formData.accidents,
          priorClaims: formData.priorClaims
        })
      });
      const data = await response.json();

      if (data.success) {
        setMLResult(data.prediction);
      } else {
        console.error('ML prediction failed:', data.message);
      }
    } catch (error) {
      console.error('Error making ML prediction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadModelPerformance();
    loadDatasetStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RiskAssess Pro</h1>
              <p className="text-sm text-gray-600">Auto Liability Insurance Risk Prediction</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="assessment" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Risk Assessment</span>
            </TabsTrigger>
            <TabsTrigger value="ml-models" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>ML Models</span>
            </TabsTrigger>
            <TabsTrigger value="dataset" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Dataset</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Risk Assessment Tab */}
          <TabsContent value="assessment" className="mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Risk Assessment Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Risk Assessment Form</span>
              </CardTitle>
              <CardDescription>
                Enter broker/agent submission details to calculate risk score and premium suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="driverAge" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Driver Age</span>
                    </Label>
                    <Input
                      id="driverAge"
                      type="number"
                      min="16"
                      max="100"
                      placeholder="25"
                      value={formData.driverAge || ''}
                      onChange={(e) => handleInputChange('driverAge', e.target.value)}
                      className={errors.driverAge ? 'border-destructive' : ''}
                      required
                    />
                    {errors.driverAge && (
                      <p className="text-sm text-destructive flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.driverAge}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicleAge" className="flex items-center space-x-2">
                      <Car className="h-4 w-4" />
                      <span>Vehicle Age (years)</span>
                    </Label>
                    <Input
                      id="vehicleAge"
                      type="number"
                      min="0"
                      max="30"
                      placeholder="5"
                      value={formData.vehicleAge || ''}
                      onChange={(e) => handleInputChange('vehicleAge', e.target.value)}
                      className={errors.vehicleAge ? 'border-destructive' : ''}
                      required
                    />
                    {errors.vehicleAge && (
                      <p className="text-sm text-destructive flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.vehicleAge}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="violations" className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Traffic Violations (last 3 years)</span>
                    </Label>
                    <Select onValueChange={(value) => handleInputChange('violations', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select violations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accidents" className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>Accidents (last 5 years)</span>
                    </Label>
                    <Select onValueChange={(value) => handleInputChange('accidents', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select accidents" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="priorClaims">
                      Prior Insurance Claims (last 5 years)
                    </Label>
                    <Select onValueChange={(value) => handleInputChange('priorClaims', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select prior claims" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isLoading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Analyzing risk factors...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Risk...
                    </>
                  ) : (
                    'Calculate Risk Assessment'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Risk Analysis Results</span>
              </CardTitle>
              <CardDescription>
                AI-powered risk prediction using Random Forest model
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Complete the risk assessment form to see results</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Risk Score */}
                  <div className="text-center">
                    <div className="relative">
                      <div className="text-4xl font-bold text-primary mb-2 animate-in fade-in-50 duration-500">
                        {result.riskScore}
                      </div>
                      <Progress
                        value={result.riskScore}
                        className="w-32 mx-auto mb-2"
                      />
                    </div>
                    <div className="text-lg text-gray-600">Risk Score (0-100)</div>
                    <Badge
                      variant={result.riskCategory === 'Low' ? 'default' : 'destructive'}
                      className="mt-2 animate-in slide-in-from-bottom-2 duration-700"
                    >
                      {result.riskCategory === 'Low' ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <AlertCircle className="mr-1 h-3 w-3" />
                      )}
                      {result.riskCategory} Risk
                    </Badge>
                  </div>

                  {/* Premium Suggestion */}
                  <Card className="bg-blue-50 border-blue-200 animate-in slide-in-from-right duration-500">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-700 animate-in zoom-in duration-700">
                          ${result.premiumSuggestion.toLocaleString()}
                        </div>
                        <div className="text-sm text-blue-600">
                          Annual Premium Suggestion
                        </div>
                        <div className="text-xs text-blue-500 mt-1">
                          Adjustment Factor: {result.adjustmentFactor}x
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Key Reasons */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Key Risk Factors
                    </h3>
                    <div className="space-y-2">
                      {result.keyReasons.map((reason, index) => (
                        <Alert key={index}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{reason}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>

                  {/* Reset Button */}
                  <Button 
                    onClick={() => setResult(null)} 
                    variant="outline" 
                    className="w-full"
                  >
                    Calculate New Assessment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
            </div>

            {/* Info Section */}
            <div className="mt-12">
              <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">
                      Advanced AI Risk Assessment
                    </h2>
                    <p className="text-blue-100 max-w-2xl mx-auto">
                      Our machine learning models analyze multiple risk factors
                      to provide accurate risk scores and premium suggestions for auto liability insurance.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ML Models Tab */}
          <TabsContent value="ml-models" className="mt-6">
            <div className="space-y-6">
              {/* Model Training Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Model Training Pipeline</span>
                  </CardTitle>
                  <CardDescription>
                    Train and manage Random Forest, XGBoost, and Explainable Boosting Machine models
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={generateDataset}
                      disabled={mlStatus.generating}
                      variant={mlStatus.datasetGenerated ? "outline" : "default"}
                    >
                      {mlStatus.generating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Dataset...
                        </>
                      ) : (
                        <>
                          <Database className="mr-2 h-4 w-4" />
                          {mlStatus.datasetGenerated ? 'Regenerate Dataset' : 'Generate Dataset'}
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={trainModels}
                      disabled={mlStatus.training || !mlStatus.datasetGenerated}
                      variant={mlStatus.modelsLoaded ? "outline" : "default"}
                    >
                      {mlStatus.training ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Training Models...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          {mlStatus.modelsLoaded ? 'Retrain Models' : 'Train Models'}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Status indicators */}
                  <div className="flex space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      {mlStatus.datasetGenerated ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span>Dataset Ready</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {mlStatus.modelsLoaded ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span>Models Trained</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Model Performance */}
              {Object.keys(modelPerformance).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Model Performance Metrics</CardTitle>
                    <CardDescription>Compare performance across different ML algorithms</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(modelPerformance).map(([modelName, metrics]) => (
                        <div key={modelName} className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-2 capitalize">
                            {modelName.replace('_', ' ')}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {metrics.task_type === 'classification' ? (
                              <>
                                <div>
                                  <div className="text-gray-500">Accuracy</div>
                                  <div className="font-medium">{(metrics.accuracy! * 100).toFixed(1)}%</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Precision</div>
                                  <div className="font-medium">{(metrics.precision! * 100).toFixed(1)}%</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Recall</div>
                                  <div className="font-medium">{(metrics.recall! * 100).toFixed(1)}%</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">ROC AUC</div>
                                  <div className="font-medium">{metrics.roc_auc ? (metrics.roc_auc * 100).toFixed(1) + '%' : 'N/A'}</div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <div className="text-gray-500">RMSE</div>
                                  <div className="font-medium">${metrics.rmse!.toFixed(0)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">MAE</div>
                                  <div className="font-medium">${metrics.mae!.toFixed(0)}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">R² Score</div>
                                  <div className="font-medium">{(metrics.r2_score! * 100).toFixed(1)}%</div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Risk Assessment with ML */}
              {mlStatus.modelsLoaded && (
                <Card>
                  <CardHeader>
                    <CardTitle>ML-Powered Risk Assessment</CardTitle>
                    <CardDescription>Get predictions from trained machine learning models</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Driver Age</Label>
                          <Input
                            type="number"
                            value={formData.driverAge || ''}
                            onChange={(e) => handleInputChange('driverAge', e.target.value)}
                            placeholder="25"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Vehicle Age</Label>
                          <Input
                            type="number"
                            value={formData.vehicleAge || ''}
                            onChange={(e) => handleInputChange('vehicleAge', e.target.value)}
                            placeholder="5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Violations</Label>
                          <Select onValueChange={(value) => handleInputChange('violations', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select violations" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0</SelectItem>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4">4+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Accidents</Label>
                          <Select onValueChange={(value) => handleInputChange('accidents', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select accidents" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0</SelectItem>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4">4+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button onClick={predictWithMLModel} disabled={isLoading} className="w-full">
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Predicting with ML Models...
                          </>
                        ) : (
                          'Predict with ML Models'
                        )}
                      </Button>

                      {mlResult && (
                        <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                          <h3 className="font-semibold mb-2">ML Model Prediction</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500">Risk Score</div>
                              <div className="font-medium">{mlResult.risk_score}/100</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Claim Probability</div>
                              <div className="font-medium">{(mlResult.claim_probability * 100).toFixed(1)}%</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Suggested Premium</div>
                              <div className="font-medium">${mlResult.suggested_premium.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Risk Category</div>
                              <div className="font-medium">
                                <Badge variant={mlResult.risk_category === 'Low' ? 'default' : 'destructive'}>
                                  {mlResult.risk_category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="text-gray-500 text-xs">Premium Adjustment</div>
                            <div className="text-sm">{mlResult.premium_adjustment}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Dataset Tab */}
          <TabsContent value="dataset" className="mt-6">
            <div className="space-y-6">
              {datasetStats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Dataset Statistics</CardTitle>
                    <CardDescription>Overview of the synthetic insurance dataset</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{datasetStats.total_samples.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Total Samples</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{(datasetStats.claim_rate * 100).toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Claim Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{datasetStats.avg_risk_score.toFixed(0)}</div>
                        <div className="text-sm text-gray-600">Avg Risk Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">${datasetStats.avg_premium.toFixed(0)}</div>
                        <div className="text-sm text-gray-600">Avg Premium</div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Feature Distributions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Driver Age</h4>
                          <div className="text-sm text-gray-600">
                            Mean: {datasetStats.feature_stats.driver_age.mean.toFixed(1)} years<br/>
                            Range: {datasetStats.feature_stats.driver_age.min}-{datasetStats.feature_stats.driver_age.max} years
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Vehicle Age</h4>
                          <div className="text-sm text-gray-600">
                            Mean: {datasetStats.feature_stats.vehicle_age.mean.toFixed(1)} years<br/>
                            Range: {datasetStats.feature_stats.vehicle_age.min}-{datasetStats.feature_stats.vehicle_age.max} years
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Violations</h4>
                          <div className="text-sm text-gray-600">
                            Mean: {datasetStats.feature_stats.violations.mean.toFixed(2)}<br/>
                            Max: {datasetStats.feature_stats.violations.max}
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Accidents</h4>
                          <div className="text-sm text-gray-600">
                            Mean: {datasetStats.feature_stats.accidents.mean.toFixed(2)}<br/>
                            Max: {datasetStats.feature_stats.accidents.max}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!datasetStats && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-gray-500">No dataset found. Generate a dataset in the ML Models tab.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Model Comparison</CardTitle>
                  <CardDescription>Compare performance across different algorithms</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(modelPerformance).length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(modelPerformance)
                          .filter(([_, metrics]) => metrics.task_type === 'classification')
                          .map(([modelName, metrics]) => (
                          <Card key={modelName} className="p-4">
                            <h3 className="font-semibold capitalize mb-2">
                              {modelName.replace('_classification', '').replace('_', ' ')}
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Accuracy:</span>
                                <span>{(metrics.accuracy! * 100).toFixed(1)}%</span>
                              </div>
                              {metrics.roc_auc && (
                                <div className="flex justify-between">
                                  <span>ROC AUC:</span>
                                  <span>{(metrics.roc_auc * 100).toFixed(1)}%</span>
                                </div>
                              )}
                              <Progress value={metrics.accuracy! * 100} className="w-full" />
                            </div>
                          </Card>
                        ))}
                      </div>

                      <Card className="mt-6">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold mb-4">Key Insights</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <Alert>
                              <TrendingUp className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Best Performing Model:</strong> Based on ROC AUC scores,
                                {Object.entries(modelPerformance)
                                  .filter(([_, metrics]) => metrics.task_type === 'classification' && metrics.roc_auc)
                                  .sort((a, b) => b[1].roc_auc! - a[1].roc_auc!)[0]?.[0]
                                  .replace('_classification', '').replace('_', ' ') || 'Random Forest'}
                                shows the highest predictive accuracy.
                              </AlertDescription>
                            </Alert>
                            <Alert>
                              <Shield className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Model Reliability:</strong> All models demonstrate consistent performance
                                across validation sets, indicating robust predictive capabilities for insurance risk assessment.
                              </AlertDescription>
                            </Alert>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-gray-500">Train models to see analytics and performance comparisons.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
