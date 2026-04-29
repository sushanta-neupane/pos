"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useSidebar } from "@/context/SidebarContext";
import {
	AlertIcon,
	BoxCubeIcon,
	BoxIconLine,
	DollarLineIcon,
	GridIcon,
	TaskIcon,
	UserCircleIcon,
} from "@/icons";

type NavItem = {
	name: string;
	icon: React.ReactNode;
	path: string;
};

const navItems: NavItem[] = [
	{ icon: <GridIcon />, name: "Dashboard", path: "/dashboard" },
	{ icon: <DollarLineIcon />, name: "Sell", path: "/pos" },
	{ icon: <BoxCubeIcon />, name: "Products", path: "/products" },
	{ icon: <BoxIconLine />, name: "Stock", path: "/stock" },
	{ icon: <AlertIcon />, name: "Alerts", path: "/alerts" },
	{ icon: <TaskIcon />, name: "Activities", path: "/activities" },
	{ icon: <UserCircleIcon />, name: "Users", path: "/dashboard/users" },
];

const AppSidebar: React.FC = () => {
	const { isMobileOpen } = useSidebar();
	const pathname = usePathname();

	return (
		<aside
			className={`fixed left-0 top-0 z-9999 flex h-screen w-[290px] flex-col overflow-y-hidden border-r border-gray-200 bg-white px-5 text-gray-900 duration-300 ease-linear dark:border-gray-800 dark:bg-gray-dark dark:text-gray-300 ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
		>
			<div className="flex items-center gap-2 pb-7 pt-8">
				<Link href="/dashboard" className="flex items-center gap-3">
					<span className="text-xl font-semibold text-gray-800 dark:text-white/90">
						bhandar.
					</span>
				</Link>
			</div>
			<div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
				<nav className="mb-6">
					<h3 className="mb-4 text-xs font-semibold uppercase leading-[20px] text-gray-400">
						Main
					</h3>
					<ul className="flex flex-col gap-4">
						{navItems.map((nav) => {
							const active = pathname === nav.path;

							return (
								<li key={nav.name}>
									<Link
										href={nav.path}
										className={`menu-item group ${active ? "menu-item-active" : "menu-item-inactive"}`}
									>
										<span
											className={
												active
													? "menu-item-icon-active"
													: "menu-item-icon-inactive"
											}
										>
											{nav.icon}
										</span>
										<span className="menu-item-text">{nav.name}</span>
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>
			</div>
		</aside>
	);
};

export default AppSidebar;
