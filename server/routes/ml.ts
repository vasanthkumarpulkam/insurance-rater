import { RequestHandler } from "express";
import { spawn, exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";

// Check if Python is available
const checkPythonAvailability = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Try python3 first, then python
    exec("python3 --version", (error) => {
      if (!error) {
        resolve("python3");
      } else {
        exec("python --version", (error) => {
          if (!error) {
            resolve("python");
          } else {
            reject(new Error("Python not found. Please install Python 3.7+"));
          }
        });
      }
    });
  });
};

// Install Python dependencies
export const installDependencies: RequestHandler = async (req, res) => {
  try {
    const pythonCmd = await checkPythonAvailability();

    // Install requirements
    const installProcess = spawn(
      pythonCmd,
      ["-m", "pip", "install", "-r", "ml/requirements.txt"],
      {
        stdio: "pipe",
      },
    );

    let output = "";
    let errorOutput = "";

    installProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    installProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    installProcess.on("close", (code) => {
      if (code === 0) {
        res.json({
          success: true,
          message: "Dependencies installed successfully",
          output: output,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to install dependencies",
          error: errorOutput,
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Python not available",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Generate synthetic dataset
export const generateDataset: RequestHandler = async (req, res) => {
  try {
    const pythonCmd = await checkPythonAvailability();
    const { samples = 15000 } = req.body;

    const generateProcess = spawn(pythonCmd, ["ml/dataset_generator.py"], {
      stdio: "pipe",
    });

    let output = "";
    let errorOutput = "";

    generateProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    generateProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    generateProcess.on("close", async (code) => {
      if (code === 0) {
        // Check if dataset was created
        try {
          const datasetPath = "ml/data/insurance_dataset.csv";
          const stats = await fs.stat(datasetPath);

          // Read metadata if available
          let metadata = null;
          try {
            const metadataContent = await fs.readFile(
              "ml/data/insurance_dataset_metadata.json",
              "utf-8",
            );
            metadata = JSON.parse(metadataContent);
          } catch (e) {
            // Metadata file not found, that's okay
          }

          res.json({
            success: true,
            message: "Dataset generated successfully",
            output: output,
            dataset_size: stats.size,
            metadata: metadata,
          });
        } catch (e) {
          res.status(500).json({
            success: false,
            message: "Dataset generation completed but file not found",
            error: errorOutput,
          });
        }
      } else {
        // Python ran but failed (e.g., missing pandas). Fallback to Node synthetic generator.
        try {
          const rows: string[] = [];
          const header = [
            "Driver_Age",
            "Vehicle_Age",
            "Vehicle_Type",
            "Violations",
            "Accidents",
            "Prior_Claims",
            "Geographic_Risk",
            "Credit_Score",
            "Has_Claim",
            "Risk_Score",
            "Annual_Premium",
            "Claim_Cost",
          ];
          rows.push(header.join(","));
          const vehicleTypes = ["Sedan", "SUV", "Tractor", "BoxTruck"];
          const N = 500;
          for (let i = 0; i < N; i++) {
            const driverAge = Math.floor(18 + Math.random() * 55);
            const vehicleAge = Math.floor(Math.random() * 20);
            const vType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
            const violations = Math.floor(Math.random() * 4);
            const accidents = Math.floor(Math.random() * 3);
            const priorClaims = Math.floor(Math.random() * 2);
            const geo = Number((0.7 + Math.random() * 1.3).toFixed(2));
            const credit = Math.floor(550 + Math.random() * 250);
            const baseRisk =
              0.02 * (driverAge < 25 ? 1.8 : driverAge > 65 ? 1.4 : 1.0) +
              0.03 * (violations * 0.6 + accidents * 0.9 + priorClaims * 0.7) +
              0.01 * (vehicleAge / 10) +
              0.02 * (geo - 1);
            const riskScore = Math.max(0, Math.min(100, Math.round(baseRisk * 100)));
            const hasClaim = Math.random() < Math.min(0.6, baseRisk + 0.05) ? 1 : 0;
            const basePremium = 1200;
            const premium = Math.round(basePremium * (1 + riskScore / 80));
            const claimCost = hasClaim ? Math.round(1000 + Math.random() * 9000) : 0;
            rows.push(
              [
                driverAge,
                vehicleAge,
                vType,
                violations,
                accidents,
                priorClaims,
                geo,
                credit,
                hasClaim,
                riskScore,
                premium,
                claimCost,
              ].join(","),
            );
          }
          const dir = "ml/data";
          await fs.mkdir(dir, { recursive: true });
          await fs.writeFile(`${dir}/insurance_dataset.csv`, rows.join("\n"));
          await fs.writeFile(
            `${dir}/insurance_dataset_metadata.json`,
            JSON.stringify({ generated_by: "node-fallback", samples: N, errorOutput }, null, 2),
          );
          return res.json({
            success: true,
            message: "Dataset generated with Node fallback (Python error)",
            output: output,
            dataset_size: rows.join("\n").length,
            metadata: { generated_by: "node-fallback", samples: N },
          });
        } catch (e) {
          res.status(500).json({
            success: false,
            message: "Failed to generate dataset",
            error: errorOutput,
          });
        }
      }
    });
  } catch (error) {
    // Fallback: generate a small synthetic CSV using Node when Python isn't available (e.g., preview platforms)
    try {
      const rows: string[] = [];
      const header = [
        "Driver_Age",
        "Vehicle_Age",
        "Vehicle_Type",
        "Violations",
        "Accidents",
        "Prior_Claims",
        "Geographic_Risk",
        "Credit_Score",
        "Has_Claim",
        "Risk_Score",
        "Annual_Premium",
        "Claim_Cost",
      ];
      rows.push(header.join(","));

      const vehicleTypes = ["Sedan", "SUV", "Tractor", "BoxTruck"];
      const N = 500;
      for (let i = 0; i < N; i++) {
        const driverAge = Math.floor(18 + Math.random() * 55);
        const vehicleAge = Math.floor(Math.random() * 20);
        const vType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
        const violations = Math.floor(Math.random() * 4);
        const accidents = Math.floor(Math.random() * 3);
        const priorClaims = Math.floor(Math.random() * 2);
        const geo = Number((0.7 + Math.random() * 1.3).toFixed(2));
        const credit = Math.floor(550 + Math.random() * 250);
        const baseRisk =
          0.02 * (driverAge < 25 ? 1.8 : driverAge > 65 ? 1.4 : 1.0) +
          0.03 * (violations * 0.6 + accidents * 0.9 + priorClaims * 0.7) +
          0.01 * (vehicleAge / 10) +
          0.02 * (geo - 1);
        const riskScore = Math.max(0, Math.min(100, Math.round(baseRisk * 100)));
        const hasClaim = Math.random() < Math.min(0.6, baseRisk + 0.05) ? 1 : 0;
        const basePremium = 1200;
        const premium = Math.round(basePremium * (1 + riskScore / 80));
        const claimCost = hasClaim ? Math.round(1000 + Math.random() * 9000) : 0;
        rows.push(
          [
            driverAge,
            vehicleAge,
            vType,
            violations,
            accidents,
            priorClaims,
            geo,
            credit,
            hasClaim,
            riskScore,
            premium,
            claimCost,
          ].join(","),
        );
      }

      const dir = "ml/data";
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(`${dir}/insurance_dataset.csv`, rows.join("\n"));
      await fs.writeFile(
        `${dir}/insurance_dataset_metadata.json`,
        JSON.stringify({ generated_by: "node-fallback", samples: N }, null, 2),
      );

      res.json({
        success: true,
        message: "Dataset generated with Node fallback (Python unavailable)",
        dataset_size: rows.join("\n").length,
        metadata: { generated_by: "node-fallback", samples: N },
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        message: "Error generating dataset",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
};

// Train ML models
export const trainModels: RequestHandler = async (req, res) => {
  try {
    const pythonCmd = await checkPythonAvailability();

    const trainProcess = spawn(pythonCmd, ["ml/model_trainer.py"], {
      stdio: "pipe",
    });

    let output = "";
    let errorOutput = "";

    trainProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    trainProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    trainProcess.on("close", async (code) => {
      if (code === 0) {
        try {
          // Read model metadata
          const metadataContent = await fs.readFile(
            "ml/models/metadata.json",
            "utf-8",
          );
          const metadata = JSON.parse(metadataContent);

          res.json({
            success: true,
            message: "Models trained successfully",
            output: output,
            performance: metadata.model_performance,
            feature_importance: metadata.feature_importance,
            models: metadata.models,
          });
        } catch (e) {
          res.json({
            success: true,
            message: "Models trained successfully",
            output: output,
            note: "Metadata not available",
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: "Model training failed",
          error: errorOutput,
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error training models",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get model performance metrics
export const getModelPerformance: RequestHandler = async (req, res) => {
  try {
    const metadataPath = "ml/models/metadata.json";
    const metadataContent = await fs.readFile(metadataPath, "utf-8");
    const metadata = JSON.parse(metadataContent);

    res.json({
      success: true,
      performance: metadata.model_performance,
      feature_importance: metadata.feature_importance,
      models: metadata.models,
      trained_at: metadata.trained_at,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: "Model metadata not found. Please train models first.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Advanced ML prediction
export const predictWithML: RequestHandler = async (req, res) => {
  try {
    const pythonCmd = await checkPythonAvailability();
    const {
      driverAge,
      vehicleAge,
      vehicleType = "Sedan",
      violations,
      accidents,
      priorClaims,
      geographicRisk = 1.0,
      creditScore = 700,
    } = req.body;

    // Create a temporary prediction script
    const predictionScript = `
import sys
import os
sys.path.append('ml')
from model_trainer import InsuranceMLPipeline
import json

try:
    pipeline = InsuranceMLPipeline()
    if pipeline.load_models():
        result = pipeline.predict_risk(
            driver_age=${driverAge},
            vehicle_age=${vehicleAge},
            vehicle_type='${vehicleType}',
            violations=${violations},
            accidents=${accidents},
            prior_claims=${priorClaims},
            geographic_risk=${geographicRisk},
            credit_score=${creditScore}
        )
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "Models not loaded"}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

    // Write temporary script
    const tempScriptPath = "ml/temp_predict.py";
    await fs.writeFile(tempScriptPath, predictionScript);

    const predictProcess = spawn(pythonCmd, [tempScriptPath], {
      stdio: "pipe",
    });

    let output = "";
    let errorOutput = "";

    predictProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    predictProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    predictProcess.on("close", async (code) => {
      // Clean up temp file
      try {
        await fs.unlink(tempScriptPath);
      } catch (e) {
        // Ignore cleanup errors
      }

      if (code === 0) {
        try {
          const result = JSON.parse(output.trim());
          if (result.error) {
            res.status(500).json({
              success: false,
              message: result.error,
            });
          } else {
            res.json({
              success: true,
              prediction: result,
            });
          }
        } catch (e) {
          res.status(500).json({
            success: false,
            message: "Failed to parse prediction result",
            output: output,
            error: errorOutput,
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: "Prediction failed",
          error: errorOutput,
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error making prediction",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get dataset statistics
export const getDatasetStats: RequestHandler = async (req, res) => {
  try {
    const pythonCmd = await checkPythonAvailability();

    const statsScript = `
import pandas as pd
import json
import os

try:
    if os.path.exists('ml/data/insurance_dataset.csv'):
        df = pd.read_csv('ml/data/insurance_dataset.csv')
        stats = {
            'total_samples': len(df),
            'claim_rate': float(df['Has_Claim'].mean()),
            'avg_risk_score': float(df['Risk_Score'].mean()),
            'avg_premium': float(df['Annual_Premium'].mean()),
            'avg_claim_cost': float(df[df['Has_Claim'] == 1]['Claim_Cost'].mean()) if df['Has_Claim'].sum() > 0 else 0,
            'feature_stats': {
                'driver_age': {
                    'mean': float(df['Driver_Age'].mean()),
                    'min': int(df['Driver_Age'].min()),
                    'max': int(df['Driver_Age'].max())
                },
                'vehicle_age': {
                    'mean': float(df['Vehicle_Age'].mean()),
                    'min': int(df['Vehicle_Age'].min()),
                    'max': int(df['Vehicle_Age'].max())
                },
                'violations': {
                    'mean': float(df['Violations'].mean()),
                    'max': int(df['Violations'].max())
                },
                'accidents': {
                    'mean': float(df['Accidents'].mean()),
                    'max': int(df['Accidents'].max())
                }
            }
        }
        print(json.dumps(stats))
    else:
        print(json.dumps({"error": "Dataset not found"}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

    const tempScriptPath = "ml/temp_stats.py";
    await fs.writeFile(tempScriptPath, statsScript);

    const statsProcess = spawn(pythonCmd, [tempScriptPath], {
      stdio: "pipe",
    });

    let output = "";
    let errorOutput = "";

    statsProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    statsProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    statsProcess.on("close", async (code) => {
      // Clean up temp file
      try {
        await fs.unlink(tempScriptPath);
      } catch (e) {
        // Ignore cleanup errors
      }

      if (code === 0) {
        try {
          const stats = JSON.parse(output.trim());
          if (stats.error) {
            res.status(404).json({
              success: false,
              message: stats.error,
            });
          } else {
            res.json({
              success: true,
              stats: stats,
            });
          }
        } catch (e) {
          res.status(500).json({
            success: false,
            message: "Failed to parse dataset statistics",
            output: output,
            error: errorOutput,
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to get dataset statistics",
          error: errorOutput,
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting dataset statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
