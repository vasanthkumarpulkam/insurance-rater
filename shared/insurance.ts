import { z } from "zod";

// Domain types and schemas for the commercial insurance rater

export const DriverSchema = z.object({
	/** A unique identifier for the driver within the submission */
	id: z.string().min(1),
	name: z.string().min(1),
	age: z.number().int().min(16).max(100),
	violations: z.number().int().min(0).default(0),
	accidents: z.number().int().min(0).default(0),
	priorClaims: z.number().int().min(0).default(0),
	yearsCdl: z.number().int().min(0).max(60).default(0),
});
export type Driver = z.infer<typeof DriverSchema>;

export const VehicleSchema = z.object({
	/** A unique identifier for the power unit */
	id: z.string().min(1),
	vin: z.string().min(1).optional(),
	year: z.number().int().min(1980).max(new Date().getFullYear()).optional(),
	make: z.string().optional(),
	model: z.string().optional(),
	vehicleType: z.enum([
		"Tractor",
		"BoxTruck",
		"Pickup",
		"Sedan",
		"SUV",
		"Van",
	]),
	vehicleAge: z.number().int().min(0).max(40).default(0),
	gvw: z.number().min(0).default(0),
	radiusMiles: z.number().min(0).default(50),
});
export type Vehicle = z.infer<typeof VehicleSchema>;

export const TrailerSchema = z.object({
	id: z.string().min(1),
	trailerType: z.enum([
		"DryVan",
		"Reefer",
		"Flatbed",
		"Tanker",
		"StepDeck",
		"Lowboy",
		"Container",
	]),
	trailerAge: z.number().int().min(0).max(40).default(0),
	refrigerated: z.boolean().default(false),
});
export type Trailer = z.infer<typeof TrailerSchema>;

export const CoverageSelectionSchema = z.object({
	// Auto Liability
	autoLiabilityLimit: z.number().min(100000).max(2000000).default(1000000),
	autoLiabilityDeductible: z.number().min(0).max(100000).default(0),
	// General Liability
	generalLiabilityLimit: z.number().min(100000).max(2000000).default(1000000),
	generalLiabilityDeductible: z.number().min(0).max(100000).default(0),
	// Motor Truck Cargo
	cargoLimitPerVehicle: z.number().min(0).max(2000000).default(100000),
	cargoDeductible: z.number().min(0).max(100000).default(1000),
	// Reefer Breakdown / Temperature
	reeferCoverage: z.boolean().default(false),
	reeferLimitPerVehicle: z.number().min(0).max(500000).default(25000),
	reeferDeductible: z.number().min(0).max(100000).default(2500),
	// Trailer Interchange
	trailerInterchange: z.boolean().default(false),
	trailerInterchangeLimit: z.number().min(0).max(200000).default(40000),
	trailerInterchangeDeductible: z.number().min(0).max(100000).default(1000),
});
export type CoverageSelection = z.infer<typeof CoverageSelectionSchema>;

export const CompanySchema = z.object({
	name: z.string().min(1),
	naics: z.string().optional(),
	fein: z.string().optional(),
	addressState: z.string().min(2).max(2),
	yearsInBusiness: z.number().int().min(0).max(100).default(0),
	emr: z.number().min(0.5).max(2).default(1), // Experience Mod
	safetyPrograms: z.array(z.enum(["ELD", "Dashcams", "DriverTraining", "Telematics"]))
		.default([]),
});
export type Company = z.infer<typeof CompanySchema>;

export const SubmissionSchema = z.object({
	company: CompanySchema,
	drivers: z.array(DriverSchema),
	vehicles: z.array(VehicleSchema),
	trailers: z.array(TrailerSchema).default([]),
	coverages: CoverageSelectionSchema,
	operationalFactors: z.object({
		avgMilesPerYearPerUnit: z.number().min(0).default(60000),
		geographicRisk: z.number().min(0.5).max(2).default(1),
		cargoTypeMix: z.array(z.enum(["General", "Refrigerated", "Hazmat", "HighValue"]))
			.default(["General"]),
	}),
});
export type Submission = z.infer<typeof SubmissionSchema>;

export type LineOfBusiness =
	| "AutoLiability"
	| "GeneralLiability"
	| "MotorTruckCargo"
	| "ReeferBreakdown"
	| "TrailerInterchange";

export interface LinePremiumBreakdown {
	line: LineOfBusiness;
	premium: number;
	baseRate: number;
	factors: Record<string, number>;
	detail?: Record<string, unknown>;
}

export interface DriverPremiumDetail {
	driverId: string;
	driverName: string;
	riskScore: number; // 0-100
	premium: number; // Auto liability portion for this driver
	factors: Record<string, number>;
}

export interface VehiclePremiumDetail {
	vehicleId: string;
	lines: LinePremiumBreakdown[];
}

export interface RiskMatrixCell {
	category: string; // e.g., "Driver Behavior"
	frequency: number; // 1-5
	severity: number; // 1-5
	score: number; // frequency * severity
}

export interface RiskMatrixResult {
	cells: RiskMatrixCell[];
	overallScore: number; // 0-100 scaled
	riskTier: "Low" | "Moderate" | "High" | "Severe";
}

export interface QuoteResult {
	quoteId: string;
	companyName: string;
	perDriver: DriverPremiumDetail[];
	perVehicle: VehiclePremiumDetail[];
	lines: LinePremiumBreakdown[];
	totalPremium: number;
	riskMatrix: RiskMatrixResult;
}

export const QuoteResultSchema = z.object({
	quoteId: z.string(),
	companyName: z.string(),
	perDriver: z.array(
		z.object({
			driverId: z.string(),
			driverName: z.string(),
			riskScore: z.number(),
			premium: z.number(),
			factors: z.record(z.number()),
		}),
	),
	perVehicle: z.array(
		z.object({
			vehicleId: z.string(),
			lines: z.array(
				z.object({
					line: z.string(),
					premium: z.number(),
					baseRate: z.number(),
					factors: z.record(z.number()),
					// detail is intentionally loose
				}),
			),
		}),
	),
	lines: z.array(
		z.object({
			line: z.string(),
			premium: z.number(),
			baseRate: z.number(),
			factors: z.record(z.number()),
		}),
	),
	totalPremium: z.number(),
	riskMatrix: z.object({
		cells: z.array(
			z.object({
				category: z.string(),
				frequency: z.number(),
				severity: z.number(),
				score: z.number(),
			}),
		),
		overallScore: z.number(),
		riskTier: z.enum(["Low", "Moderate", "High", "Severe"]),
	}),
});

