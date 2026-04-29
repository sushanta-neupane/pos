"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCents } from "@/lib/money";

export type ActivityItem = {
	id: string;
	type: "add-product" | "update-product" | "add-stock" | "sell-product";
	label: string;
	name: string;
	details: string;
	createdAt: string;
	amount?: number;
};

type ActivityFilter = "all" | "add-stock" | "sell-product";

const filterOptions: Array<{ key: ActivityFilter; label: string }> = [
	{ key: "all", label: "All" },
	{ key: "add-stock", label: "Add Stock" },
	{ key: "sell-product", label: "Sell Product" },
];

function badgeClass(type: ActivityItem["type"]) {
	switch (type) {
		case "add-product":
			return "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300";
		case "update-product":
			return "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300";
		case "add-stock":
			return "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-300";
		case "sell-product":
			return "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-300";
	}
}

export function ActivitiesCard({ activities }: { activities: ActivityItem[] }) {
	const [filter, setFilter] = React.useState<ActivityFilter>("all");

	const filteredActivities = React.useMemo(() => {
		if (filter === "all") {
			return activities;
		}
		return activities.filter((activity) => activity.type === filter);
	}, [activities, filter]);

	return (
		<Card className="rounded-2xl bg-white border-0 shadow-theme-sm">
			<CardHeader className="flex flex-col gap-4 border-b border-gray-100 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<CardTitle className="text-base text-gray-800 dark:text-white/90">
						Activities
					</CardTitle>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Recent product and sales activity with quick filtering.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{filterOptions.map((option) => {
						const active = filter === option.key;
						return (
							<button
								key={option.key}
								type="button"
								onClick={() => setFilter(option.key)}
								className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
									active
										? "bg-brand-500 text-white"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
								}`}
							>
								{option.label}
							</button>
						);
					})}
				</div>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Activity</TableHead>
							<TableHead>Name</TableHead>
							<TableHead>Details</TableHead>
							<TableHead>Date</TableHead>
							<TableHead className="text-right">Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredActivities.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-center text-sm text-gray-500"
								>
									No activities found
								</TableCell>
							</TableRow>
						) : (
							filteredActivities.map((activity) => (
								<TableRow key={activity.id}>
									<TableCell>
										<span
											className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(
												activity.type,
											)}`}
										>
											{activity.label}
										</span>
									</TableCell>
									<TableCell className="font-medium text-gray-800 dark:text-white/90">
										{activity.name}
									</TableCell>
									<TableCell className="text-sm text-gray-500 dark:text-gray-400">
										{activity.details}
									</TableCell>
									<TableCell className="text-sm text-gray-500 dark:text-gray-400">
										{new Date(activity.createdAt).toLocaleString()}
									</TableCell>
									<TableCell className="text-right text-sm font-medium text-gray-700 dark:text-gray-200">
										{typeof activity.amount === "number"
											? formatCents(activity.amount)
											: "-"}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
