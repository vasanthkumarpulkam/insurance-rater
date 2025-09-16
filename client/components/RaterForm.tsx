import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge, badgeVariants } from "@/components/ui/badge";

type CsvType = "drivers" | "vehicles" | "trailers";

export default function RaterForm() {
	const [companyName, setCompanyName] = useState("");
	const [state, setState] = useState("CA");
	const [yearsInBusiness, setYearsInBusiness] = useState(0);
	const [avgMiles, setAvgMiles] = useState(60000);
	const [geoRisk, setGeoRisk] = useState(1);
	const [cargoMix, setCargoMix] = useState<string>("General");

	const [coverages, setCoverages] = useState({
		autoLiabilityLimit: 1000000,
		generalLiabilityLimit: 1000000,
		cargoLimitPerVehicle: 100000,
		refer: false,
		referLimitPerVehicle: 25000,
		trailerInterchange: false,
		trailerInterchangeLimit: 40000,
	});

	const [driversCsv, setDriversCsv] = useState("");
	const [vehiclesCsv, setVehiclesCsv] = useState("");
	const [trailersCsv, setTrailersCsv] = useState("");

	const [isQuoting, setIsQuoting] = useState(false);
	const [quote, setQuote] = useState<any>(null);
	const [savedQuotes, setSavedQuotes] = useState<any[]>([]);

	const uploadCsv = async (type: CsvType, csv: string) => {
		const res = await fetch("/api/upload/csv", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ type, csv }),
		});
		return res.json();
	};

	const parseRecords = async () => {
		const [d, v, t] = await Promise.all([
			driversCsv ? uploadCsv("drivers", driversCsv) : Promise.resolve({ records: [] }),
			vehiclesCsv ? uploadCsv("vehicles", vehiclesCsv) : Promise.resolve({ records: [] }),
			trailersCsv ? uploadCsv("trailers", trailersCsv) : Promise.resolve({ records: [] }),
		]);
		return { drivers: d.records ?? [], vehicles: v.records ?? [], trailers: t.records ?? [] };
	};

	const toSubmission = (records: { drivers: any[]; vehicles: any[]; trailers: any[] }) => {
		const drivers = records.drivers.map((r, i) => ({
			id: String(r.id ?? i + 1),
			name: String(r.name ?? `Driver ${i + 1}`),
			age: Number(r.age ?? r.Age ?? 30),
			violations: Number(r.violations ?? 0),
			accidents: Number(r.accidents ?? 0),
			priorClaims: Number(r.priorClaims ?? 0),
			yearsCdl: Number(r.yearsCdl ?? 3),
		}));
		const vehicles = records.vehicles.map((r, i) => ({
			id: String(r.id ?? i + 1),
			vehicleType: String(r.vehicleType ?? "Tractor"),
			vehicleAge: Number(r.vehicleAge ?? 5),
			gvw: Number(r.gvw ?? 33000),
			radiusMiles: Number(r.radiusMiles ?? 300),
		}));
		const trailers = records.trailers.map((r, i) => ({
			id: String(r.id ?? i + 1),
			trailerType: String(r.trailerType ?? "DryVan"),
			refrigerated: String(r.trailerType ?? "").toLowerCase().includes("reefer") ? true : Boolean(r.refrigerated ?? false),
			trailerAge: Number(r.trailerAge ?? 5),
		}));

		return {
			company: { name: companyName || "Company X", addressState: state, yearsInBusiness },
			drivers,
			vehicles,
			trailers,
			coverages: {
				autoLiabilityLimit: coverages.autoLiabilityLimit,
				generalLiabilityLimit: coverages.generalLiabilityLimit,
				cargoLimitPerVehicle: coverages.cargoLimitPerVehicle,
				referCoverage: coverages.refer,
				referLimitPerVehicle: coverages.referLimitPerVehicle,
				trailerInterchange: coverages.trailerInterchange,
				trailerInterchangeLimit: coverages.trailerInterchangeLimit,
				autoLiabilityDeductible: 0,
				generalLiabilityDeductible: 0,
				cargoDeductible: 1000,
				referDeductible: 2500,
				trailerInterchangeDeductible: 1000,
			},
			operationalFactors: {
				avgMilesPerYearPerUnit: Number(avgMiles),
				geographicRisk: Number(geoRisk),
				cargoTypeMix: [cargoMix as any],
			},
		};
	};

	const requestQuote = async () => {
		setIsQuoting(true);
		try {
			const recs = await parseRecords();
			const submission = toSubmission(recs);
			const res = await fetch("/api/rater/quote", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(submission),
			});
			const data = await res.json();
			if (data.success) setQuote(data.quote);
			else console.error(data);
		} finally {
			setIsQuoting(false);
		}
	};

	const saveCurrentQuote = async () => {
		if (!quote) return;
		const res = await fetch("/api/rater/save-quote", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(quote),
		});
		const data = await res.json();
		if (data.success) {
			await loadSavedQuotes();
		}
	};

	const loadSavedQuotes = async () => {
		const res = await fetch("/api/rater/quotes");
		const data = await res.json();
		if (data.success) setSavedQuotes(data.quotes);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Commercial Fleet Rater</CardTitle>
				<CardDescription>Upload driver and unit data, configure coverages, and get premiums with a risk matrix.</CardDescription>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="company" className="w-full">
					<TabsList className="grid grid-cols-4">
						<TabsTrigger value="company">Company</TabsTrigger>
						<TabsTrigger value="upload">Bulk Upload</TabsTrigger>
						<TabsTrigger value="coverages">Coverages</TabsTrigger>
						<TabsTrigger value="quote">Quote</TabsTrigger>
					</TabsList>

					<TabsContent value="company" className="space-y-4 mt-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<Label>Company Name</Label>
								<Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Logistics" />
							</div>
							<div>
								<Label>State</Label>
								<Input value={state} onChange={(e) => setState(e.target.value.toUpperCase())} placeholder="CA" />
							</div>
							<div>
								<Label>Years in Business</Label>
								<Input type="number" value={yearsInBusiness} onChange={(e) => setYearsInBusiness(parseInt(e.target.value) || 0)} />
							</div>
							<div>
								<Label>Avg Miles/Unit/Year</Label>
								<Input type="number" value={avgMiles} onChange={(e) => setAvgMiles(parseInt(e.target.value) || 0)} />
							</div>
							<div>
								<Label>Geographic Risk</Label>
								<Select onValueChange={(v) => setGeoRisk(parseFloat(v))}>
									<SelectTrigger><SelectValue placeholder={String(geoRisk)} /></SelectTrigger>
									<SelectContent>
										<SelectItem value="0.8">0.8</SelectItem>
										<SelectItem value="1">1.0</SelectItem>
										<SelectItem value="1.2">1.2</SelectItem>
										<SelectItem value="1.5">1.5</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label>Primary Cargo</Label>
								<Select onValueChange={setCargoMix}>
									<SelectTrigger><SelectValue placeholder={cargoMix} /></SelectTrigger>
									<SelectContent>
										<SelectItem value="General">General</SelectItem>
										<SelectItem value="Refrigerated">Refrigerated</SelectItem>
										<SelectItem value="Hazmat">Hazmat</SelectItem>
										<SelectItem value="HighValue">HighValue</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="upload" className="space-y-4 mt-4">
						<Card>
							<CardHeader><CardTitle>Drivers CSV</CardTitle><CardDescription>Columns: id, name, age, violations, accidents, priorClaims, yearsCdl</CardDescription></CardHeader>
							<CardContent>
								<Textarea rows={6} value={driversCsv} onChange={(e) => setDriversCsv(e.target.value)} placeholder="id,name,age,violations,accidents,priorClaims,yearsCdl\n1,John Doe,35,0,0,0,10" />
							</CardContent>
						</Card>
						<Card>
							<CardHeader><CardTitle>Vehicles CSV</CardTitle><CardDescription>Columns: id, vehicleType, vehicleAge, gvw, radiusMiles</CardDescription></CardHeader>
							<CardContent>
								<Textarea rows={6} value={vehiclesCsv} onChange={(e) => setVehiclesCsv(e.target.value)} placeholder="id,vehicleType,vehicleAge,gvw,radiusMiles\n1,Tractor,5,33000,300" />
							</CardContent>
						</Card>
						<Card>
							<CardHeader><CardTitle>Trailers CSV</CardTitle><CardDescription>Columns: id, trailerType, refrigerated, trailerAge</CardDescription></CardHeader>
							<CardContent>
								<Textarea rows={6} value={trailersCsv} onChange={(e) => setTrailersCsv(e.target.value)} placeholder="id,trailerType,refrigerated,trailerAge\n1,Reefer,true,4" />
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="coverages" className="space-y-4 mt-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<Label>Auto Liability Limit</Label>
								<Input type="number" value={coverages.autoLiabilityLimit} onChange={(e) => setCoverages({ ...coverages, autoLiabilityLimit: parseInt(e.target.value) || 0 })} />
							</div>
							<div>
								<Label>General Liability Limit</Label>
								<Input type="number" value={coverages.generalLiabilityLimit} onChange={(e) => setCoverages({ ...coverages, generalLiabilityLimit: parseInt(e.target.value) || 0 })} />
							</div>
							<div>
								<Label>Cargo Limit / Vehicle</Label>
								<Input type="number" value={coverages.cargoLimitPerVehicle} onChange={(e) => setCoverages({ ...coverages, cargoLimitPerVehicle: parseInt(e.target.value) || 0 })} />
							</div>
							<div>
								<Label>Reefer Coverage</Label>
								<Select onValueChange={(v) => setCoverages({ ...coverages, refer: v === "true" })}>
									<SelectTrigger><SelectValue placeholder={coverages.refer ? "Yes" : "No"} /></SelectTrigger>
									<SelectContent>
										<SelectItem value="true">Yes</SelectItem>
										<SelectItem value="false">No</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label>Reefer Limit / Vehicle</Label>
								<Input type="number" value={coverages.referLimitPerVehicle} onChange={(e) => setCoverages({ ...coverages, referLimitPerVehicle: parseInt(e.target.value) || 0 })} />
							</div>
							<div>
								<Label>Trailer Interchange</Label>
								<Select onValueChange={(v) => setCoverages({ ...coverages, trailerInterchange: v === "true" })}>
									<SelectTrigger><SelectValue placeholder={coverages.trailerInterchange ? "Yes" : "No"} /></SelectTrigger>
									<SelectContent>
										<SelectItem value="true">Yes</SelectItem>
										<SelectItem value="false">No</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label>Trailer Interchange Limit</Label>
								<Input type="number" value={coverages.trailerInterchangeLimit} onChange={(e) => setCoverages({ ...coverages, trailerInterchangeLimit: parseInt(e.target.value) || 0 })} />
							</div>
						</div>
					</TabsContent>

					<TabsContent value="quote" className="space-y-4 mt-4">
						<div className="flex gap-2">
							<Button onClick={requestQuote} disabled={isQuoting} className="flex-1">{isQuoting ? "Quoting..." : "Get Quote"}</Button>
							<Button onClick={saveCurrentQuote} variant="outline" disabled={!quote}>Save Quote</Button>
						</div>
						{quote && (
							<div className="space-y-4">
								<Card>
									<CardHeader><CardTitle>Total Premium</CardTitle></CardHeader>
									<CardContent>
										<div className="text-2xl font-bold">${'{'}quote.totalPremium.toLocaleString(){'}'}</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader><CardTitle>Line Breakdown</CardTitle></CardHeader>
									<CardContent>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
											{quote.lines.map((l: any) => (
												<div key={l.line} className="flex items-center justify-between border p-2 rounded">
													<span>{l.line}</span>
													<span className="font-medium">${'{'}l.premium.toLocaleString(){'}'}</span>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader><CardTitle>Per-Driver Premiums</CardTitle></CardHeader>
									<CardContent>
										<div className="space-y-2">
											{quote.perDriver.map((d: any) => (
												<div key={d.driverId} className="flex items-center justify-between border p-2 rounded">
													<div>
														<div className="font-medium">{d.driverName}</div>
														<div className="text-xs text-gray-500">Risk {d.riskScore}</div>
													</div>
													<span>${'{'}d.premium.toLocaleString(){'}'}</span>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader><CardTitle>Risk Matrix</CardTitle><CardDescription>Frequency x Severity</CardDescription></CardHeader>
									<CardContent>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
											{quote.riskMatrix.cells.map((c: any) => (
												<div key={c.category} className="border p-2 rounded">
													<div className="font-medium">{c.category}</div>
													<div className="text-sm">Freq {c.frequency} • Sev {c.severity}</div>
													<div className="text-xs text-gray-500">Score {c.score}</div>
												</div>
											))}
										</div>
										<div className="mt-3">
											<Badge className={badgeVariants({ variant: quote.riskMatrix.riskTier === "Low" ? "default" : quote.riskMatrix.riskTier === "Moderate" ? "secondary" : "destructive" })}>
												{quote.riskMatrix.riskTier} Risk ({Math.round(quote.riskMatrix.overallScore)})
											</Badge>
										</div>
									</CardContent>
								</Card>
							</div>
						)}
						{savedQuotes.length > 0 && (
							<Card>
								<CardHeader><CardTitle>Saved Quotes</CardTitle></CardHeader>
								<CardContent>
									<div className="space-y-2">
										{savedQuotes.map((q: any) => (
											<div key={q.quoteId + q.version} className="flex items-center justify-between border p-2 rounded">
												<div>
													<div className="font-medium">{q.companyName}</div>
													<div className="text-xs text-gray-500">v{q.version} • {new Date(q.savedAt).toLocaleString()}</div>
												</div>
												<div className="font-medium">${'{'}q.totalPremium.toLocaleString(){'}'}</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}

