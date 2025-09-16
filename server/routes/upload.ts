import { RequestHandler } from "express";
import { parse as parseCsv } from "csv-parse/sync";
import { z } from "zod";
import { SubmissionSchema } from "../../shared/insurance";

const CsvTypeSchema = z.enum(["drivers", "vehicles", "trailers"]);

export const uploadCsv: RequestHandler = async (req, res) => {
	try {
		const contentType = req.headers["content-type"] || "";
		if (!contentType.includes("application/json")) {
			return res.status(400).json({ success: false, message: "Send JSON: { type, csv }" });
		}
		const { type, csv } = req.body as { type: string; csv: string };
		const t = CsvTypeSchema.safeParse(type);
		if (!t.success) return res.status(400).json({ success: false, message: "Invalid type. Use drivers|vehicles|trailers" });

		if (!csv || typeof csv !== "string") {
			return res.status(400).json({ success: false, message: "Missing csv string" });
		}

		const records = parseCsv(csv, {
			columns: true,
			skip_empty_lines: true,
			trim: true,
		});

		return res.json({ success: true, type: t.data, records });
	} catch (error) {
		return res.status(500).json({ success: false, message: (error as Error).message });
	}
};

export const validateSubmission: RequestHandler = (req, res) => {
	const parsed = SubmissionSchema.safeParse(req.body);
	if (!parsed.success) {
		return res.status(400).json({ success: false, issues: parsed.error.flatten() });
	}
	return res.json({ success: true });
};

