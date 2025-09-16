import { RequestHandler } from "express";
import { QuoteResultSchema, QuoteResult } from "@shared/insurance";

type StoredQuote = QuoteResult & { savedAt: string; version: number };

const QUOTE_STORE: StoredQuote[] = [];

export const saveQuote: RequestHandler = (req, res) => {
	const parsed = QuoteResultSchema.safeParse(req.body);
	if (!parsed.success) {
		return res.status(400).json({ success: false, issues: parsed.error.flatten() });
	}
	const incoming = parsed.data;
	const existingForCompany = QUOTE_STORE.filter((q) => q.companyName === incoming.companyName);
	const nextVersion = existingForCompany.length + 1;
	const saved: StoredQuote = { ...incoming, savedAt: new Date().toISOString(), version: nextVersion };
	QUOTE_STORE.push(saved);
	return res.json({ success: true, saved });
};

export const listQuotes: RequestHandler = (_req, res) => {
	// Return most recent first
	const items = [...QUOTE_STORE].sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
	return res.json({ success: true, quotes: items });
};

