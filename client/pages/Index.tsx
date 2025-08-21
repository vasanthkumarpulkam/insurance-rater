import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Shield, TrendingUp, FileText, Car, User, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const riskResult = calculateRisk(formData);
    setResult(riskResult);
    setIsLoading(false);
  };

  const handleInputChange = (field: keyof RiskAssessmentInput, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseInt(value) || 0,
    }));
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      required
                    />
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
                      required
                    />
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

                  <div className="space-y-2 md:col-span-2">
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

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? 'Analyzing Risk...' : 'Calculate Risk Assessment'}
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
                    <div className="text-4xl font-bold text-primary mb-2">
                      {result.riskScore}
                    </div>
                    <div className="text-lg text-gray-600">Risk Score (0-100)</div>
                    <Badge 
                      variant={result.riskCategory === 'Low' ? 'default' : 'destructive'}
                      className="mt-2"
                    >
                      {result.riskCategory} Risk
                    </Badge>
                  </div>

                  {/* Premium Suggestion */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-700">
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
                  Our Random Forest machine learning model analyzes multiple risk factors 
                  to provide accurate risk scores and premium suggestions for auto liability insurance.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
