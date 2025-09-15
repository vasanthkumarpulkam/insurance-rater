import { RequestHandler } from "express";
import { randomUUID } from "crypto";
import {
	SubmissionSchema,
	Submission,
	QuoteResult,
	Driver,
	Vehicle,
	Trailer,
	LineOfBusiness,
} from "@shared/insurance";

// Simple deterministic rating engine with transparent factors

const clamp = (value: number, min: number, max: number) =>
	Math.max(min, Math.min(max, value));

function scoreDriverRisk(driver: Driver): { score: number; factors: Record<string, number> } {
	let score = 50;
	const factors: Record<string, number> = {};

	// Age
	if (driver.age < 25) {
		score += 15;
		factors["age_lt_25"] = 1.3;
	} else if (driver.age > 65) {
		score += 8;
		factors["age_gt_65"] = 1.15;
	} else if (driver.age >= 25 && driver.age <= 50) {
		score -= 5;
		factors["age_25_50"] = 0.9;
	}

	// Experience (CDL years)
	if (driver.yearsCdl >= 5) {
		score -= 5;
		factors["cdl_5_plus"] = 0.92;
	} else if (driver.yearsCdl <= 1) {
		score += 8;
		factors["cdl_lt_1"] = 1.18;
	}

	// History
	score += driver.violations * 10;
	if (driver.violations > 0) factors["violations"] = 1 + driver.violations * 0.08;

	score += driver.accidents * 15;
	if (driver.accidents > 0) factors["accidents"] = 1 + driver.accidents * 0.12;

	score += driver.priorClaims * 12;
	if (driver.priorClaims > 0) factors["prior_claims"] = 1 + driver.priorClaims * 0.1;

	// Normalize
	score = clamp(score, 0, 100);

	return { score, factors };
}

function rateAutoLiabilityForDriver(driver: Driver, baseRate: number): { premium: number; factors: Record<string, number> } {
	const { score, factors } = scoreDriverRisk(driver);
	// Translate risk score into factor centered at 1.0
	const scoreFactor = clamp(score / 50, 0.6, 2.0);
	const combinedFactor = Object.values(factors).reduce((a, b) => a * b, scoreFactor);
	const premium = Math.round(baseRate * combinedFactor);
	return { premium, factors: { scoreFactor, ...factors } };
}

function rateVehicleLines(
	vehicle: Vehicle,
	trailers: Trailer[],
	coverages: Submission["coverages"],
	operational: Submission["operationalFactors"],
): { lines: { line: LineOfBusiness; premium: number; baseRate: number; factors: Record<string, number> }[] } {
	const lines: { line: LineOfBusiness; premium: number; baseRate: number; factors: Record<string, number> }[] = [];

	// Base rates (illustrative only)
	const autoLiabBase = 1500; // per unit
	const glBase = 500; // per fleet unit share
	const cargoBase = 400; // per unit
	const reeferBase = 250; // per reefer unit
	const tiBase = 150; // trailer interchange per unit when selected

	// Common factors
	const ageFactor = 1 + clamp(vehicle.vehicleAge, 0, 25) * 0.01; // +1% per year up to 25%
	const gvwFactor = vehicle.gvw > 26000 ? 1.2 : 1.0;
	const radiusFactor = operational.avgMilesPerYearPerUnit > 80000 ? 1.15 : 1.0;
	const geoFactor = operational.geographicRisk; // 0.5 - 2.0

	// Auto Liability at vehicle level (without driver mix)
	const alFactors = { ageFactor, gvwFactor, radiusFactor, geoFactor };
	const alPremium = Math.round(autoLiabBase * Object.values(alFactors).reduce((a, b) => a * b, 1));
	lines.push({ line: "AutoLiability", premium: alPremium, baseRate: autoLiabBase, factors: alFactors });

	// GL allocation per unit
	const glFactors = { radiusFactor, geoFactor };
	const glPremium = Math.round(glBase * Object.values(glFactors).reduce((a, b) => a * b, 1));
	lines.push({ line: "GeneralLiability", premium: glPremium, baseRate: glBase, factors: glFactors });

	// Cargo if limit > 0
	if (coverages.cargoLimitPerVehicle > 0) {
		const cargoLimitFactor = clamp(coverages.cargoLimitPerVehicle / 100000, 0.5, 5);
		const cargoFactors = { cargoLimitFactor, radiusFactor, geoFactor };
		const cargoPremium = Math.round(cargoBase * Object.values(cargoFactors).reduce((a, b) => a * b, 1));
		lines.push({ line: "MotorTruckCargo", premium: cargoPremium, baseRate: cargoBase, factors: cargoFactors });
	}

	// Reefer breakdown if refrigerated trailers exist or selected
	const hasReeferTrailer = trailers.some((t) => t.refrigerated || t.trailerType === "Reefer");
	if (coverages.reeferCoverage && hasReeferTrailer) {
		const reeferLimitFactor = clamp(coverages.reeferLimitPerVehicle / 25000, 0.5, 4);
		const reeferFactors = { reeferLimitFactor, geoFactor };
		const reeferPremium = Math.round(reeferBase * Object.values(reeferFactors).reduce((a, b) => a * b, 1));
		lines.push({ line: "ReeferBreakdown", premium: reeferPremium, baseRate: reeferBase, factors: reeferFactors });
	}

	// Trailer Interchange
	if (coverages.trailerInterchange) {
		const tiLimitFactor = clamp(coverages.trailerInterchangeLimit / 40000, 0.5, 3);
		const tiFactors = { tiLimitFactor, geoFactor };
		const tiPremium = Math.round(tiBase * Object.values(tiFactors).reduce((a, b) => a * b, 1));
		lines.push({ line: "TrailerInterchange", premium: tiPremium, baseRate: tiBase, factors: tiFactors });
	}

	return { lines };
}

function buildRiskMatrix(submission: Submission) {
	// Very simple risk matrix stub
	const driverBehaviorFreq = clamp(
		submission.drivers.reduce((a, d) => a + d.violations + d.accidents, 0) /
		Math.max(1, submission.drivers.length),
		1,
		5,
	);
	const driverBehaviorSev = submission.drivers.some((d) => d.accidents >= 2) ? 4 : 2;

	const equipmentFreq = clamp(
		submission.vehicles.reduce((a, v) => a + (v.vehicleAge > 10 ? 1 : 0), 0) /
		Math.max(1, submission.vehicles.length),
		1,
		5,
	);
	const equipmentSev = submission.trailers.some((t) => t.trailerType === "Tanker") ? 5 : 2;

	const operationsFreq = submission.operationalFactors.avgMilesPerYearPerUnit > 80000 ? 4 : 2;
	const operationsSev = submission.operationalFactors.cargoTypeMix.includes("Hazmat") ? 5 : 3;

	const cells = [
		{ category: "Driver Behavior", frequency: driverBehaviorFreq, severity: driverBehaviorSev, score: driverBehaviorFreq * driverBehaviorSev },
		{ category: "Equipment", frequency: equipmentFreq, severity: equipmentSev, score: equipmentFreq * equipmentSev },
		{ category: "Operations", frequency: operationsFreq, severity: operationsSev, score: operationsFreq * operationsSev },
	];
	const raw = cells.reduce((a, c) => a + c.score, 0);
	const overallScore = clamp((raw / (5 * 5 * cells.length)) * 100, 0, 100);
	const riskTier = overallScore < 35 ? "Low" : overallScore < 65 ? "Moderate" : overallScore < 85 ? "High" : "Severe";
	return { cells, overallScore, riskTier } as QuoteResult["riskMatrix"];
}

export const quoteSubmission: RequestHandler = (req, res) => {
	const parse = SubmissionSchema.safeParse(req.body);
	if (!parse.success) {
		return res.status(400).json({ success: false, message: "Invalid submission", issues: parse.error.flatten() });
	}
	const submission = parse.data;

	// Per-driver auto liability component using driver factors
	const perDriver = submission.drivers.map((driver) => {
		const { premium, factors } = rateAutoLiabilityForDriver(driver, 800);
		const { score } = scoreDriverRisk(driver);
		return {
			driverId: driver.id,
			driverName: driver.name,
			riskScore: score,
			premium,
			factors,
		};
	});

	// Per-vehicle lines
	const perVehicle = submission.vehicles.map((v) => {
		const { lines } = rateVehicleLines(v, submission.trailers, submission.coverages, submission.operationalFactors);
		return { vehicleId: v.id, lines };
	});

	// Aggregate line totals
	const lineTotals = new Map<string, { premium: number; baseRate: number; factors: Record<string, number> }>();
	for (const v of perVehicle) {
		for (const line of v.lines) {
			const prev = lineTotals.get(line.line) ?? { premium: 0, baseRate: line.baseRate, factors: {} };
			lineTotals.set(line.line, {
				premium: prev.premium + line.premium,
				baseRate: line.baseRate,
				factors: { ...prev.factors },
			});
		}
	}

	// Add driver-based AL portion as separate allocation
	const driverAlTotal = perDriver.reduce((a, d) => a + d.premium, 0);
	const alPrev = lineTotals.get("AutoLiability");
	if (alPrev) {
		lineTotals.set("AutoLiability", { premium: alPrev.premium + driverAlTotal, baseRate: alPrev.baseRate, factors: alPrev.factors });
	} else {
		lineTotals.set("AutoLiability", { premium: driverAlTotal, baseRate: 800, factors: {} });
	}

	const lines = Array.from(lineTotals.entries()).map(([line, info]) => ({ line: line as LineOfBusiness, premium: info.premium, baseRate: info.baseRate, factors: info.factors }));
	const totalPremium = Math.round(lines.reduce((a, l) => a + l.premium, 0));

	const riskMatrix = buildRiskMatrix(submission);

	const quote: QuoteResult = {
		quoteId: randomUUID(),
		companyName: submission.company.name,
		perDriver,
		perVehicle,
		lines,
		totalPremium,
		riskMatrix,
	};

	return res.json({ success: true, quote });
};

export const computeRiskMatrix: RequestHandler = (req, res) => {
	const parse = SubmissionSchema.safeParse(req.body);
	if (!parse.success) {
		return res.status(400).json({ success: false, message: "Invalid submission", issues: parse.error.flatten() });
	}
	const riskMatrix = buildRiskMatrix(parse.data);
	return res.json({ success: true, riskMatrix });
};

