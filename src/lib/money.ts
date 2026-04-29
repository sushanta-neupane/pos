export function toCents(value: string | number) {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return 0;
	return Math.round(n * 100);
}

export function fromCents(cents: number) {
	return (cents / 100).toFixed(2);
}

export function formatCents(cents: number) {
	const currency = (process.env.NEXT_PUBLIC_CURRENCY ?? "NPR").toUpperCase();
	const amount = cents / 100;

	if (currency === "NPR" || currency === "RS" || currency === "NRS") {
		const n = new Intl.NumberFormat("en-IN", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amount);
		return `Rs ${n}`;
	}

	return new Intl.NumberFormat(undefined, {
		style: "currency",
		currency,
		maximumFractionDigits: 2,
	}).format(amount);
}
