"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useSidebar } from "@/context/SidebarContext";
import {
	BoxCubeIcon,
	ChevronDownIcon,
	GridIcon,
	UserCircleIcon,
} from "@/icons";

type NavItem = {
	name: string;
	icon: React.ReactNode;
	path?: string;
	subItems?: { name: string; path: string }[];
};

const navItems: NavItem[] = [
	{
		icon: <GridIcon />,
		name: "Overview",
		subItems: [
			{ name: "Dashboard", path: "/dashboard" },
			{ name: "POS", path: "/pos" },
		],
	},
	{
		icon: <BoxCubeIcon />,
		name: "Inventory",
		subItems: [
			{ name: "Products", path: "/products" },
			{ name: "Stock", path: "/stock" },
			{ name: "Alerts", path: "/alerts" },
		],
	},
	{ icon: <UserCircleIcon />, name: "Users", path: "/dashboard/users" },
];

const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
	const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
	const pathname = usePathname();
	const [submenuOverride, setSubmenuOverride] = useState<{
		pathname: string;
		submenu: {
			type: "main" | "others";
			index: number;
		} | null;
	} | null>(null);
	const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
		{},
	);
	const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
	const isActive = (path: string) => path === pathname;

	const matchedSubmenu = (() => {
		for (const menuType of ["main", "others"] as const) {
			const items = menuType === "main" ? navItems : othersItems;
			for (const [index, nav] of items.entries()) {
				if (nav.subItems?.some((subItem) => isActive(subItem.path))) {
					return { type: menuType, index };
				}
			}
		}
		return null;
	})();

	const activeOpenSubmenu =
		submenuOverride?.pathname === pathname ? submenuOverride.submenu : matchedSubmenu;

	useEffect(() => {
		Object.entries(subMenuRefs.current).forEach(([key, value]) => {
			if (value)
				setSubMenuHeight((prev) => ({ ...prev, [key]: value.scrollHeight }));
		});
	}, [activeOpenSubmenu, isExpanded, isHovered, isMobileOpen]);

	function handleSubmenuToggle(index: number, type: "main" | "others") {
		setSubmenuOverride((prev) => {
			const current =
				prev?.pathname === pathname ? prev.submenu : matchedSubmenu;
			const nextSubmenu =
				current?.type === type && current.index === index
					? null
					: { type, index };
			return { pathname, submenu: nextSubmenu };
		});
	}

	const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
		<ul className="flex flex-col gap-4">
			{items.map((nav, index) => (
				<li key={nav.name}>
					{nav.subItems ? (
						<button
							onClick={() => handleSubmenuToggle(index, menuType)}
							className={`menu-item group ${activeOpenSubmenu?.type === menuType && activeOpenSubmenu?.index === index ? "menu-item-active" : "menu-item-inactive"} ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
						>
							<span
								className={
									activeOpenSubmenu?.type === menuType && activeOpenSubmenu?.index === index
										? "menu-item-icon-active"
										: "menu-item-icon-inactive"
								}
							>
								{nav.icon}
							</span>
							{(isExpanded || isHovered || isMobileOpen) && (
								<span className="menu-item-text">{nav.name}</span>
							)}
							{(isExpanded || isHovered || isMobileOpen) && (
								<ChevronDownIcon
									className={`ml-auto h-5 w-5 transition-transform duration-200 ${activeOpenSubmenu?.type === menuType && activeOpenSubmenu?.index === index ? "rotate-180 text-brand-500" : ""}`}
								/>
							)}
						</button>
					) : nav.path ? (
						<Link
							href={nav.path}
							className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
						>
							<span
								className={
									isActive(nav.path)
										? "menu-item-icon-active"
										: "menu-item-icon-inactive"
								}
							>
								{nav.icon}
							</span>
							{(isExpanded || isHovered || isMobileOpen) && (
								<span className="menu-item-text">{nav.name}</span>
							)}
						</Link>
					) : null}
					{nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
						<div
							ref={(el) => {
								subMenuRefs.current[`${menuType}-${index}`] = el;
							}}
							className="overflow-hidden transition-all duration-300"
							style={{
								height:
									activeOpenSubmenu?.type === menuType && activeOpenSubmenu?.index === index
										? `${subMenuHeight[`${menuType}-${index}`] ?? 0}px`
										: "0px",
							}}
						>
							<ul className="ml-9 mt-2 space-y-1">
								{nav.subItems.map((subItem) => (
									<li key={subItem.name}>
										<Link
											href={subItem.path}
											className={`menu-dropdown-item ${isActive(subItem.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}
										>
											{subItem.name}
										</Link>
									</li>
								))}
							</ul>
						</div>
					)}
				</li>
			))}
		</ul>
	);

	return (
		<aside
			className={`fixed left-0 top-0 z-9999 flex h-screen flex-col overflow-y-hidden border-r border-gray-200 bg-white px-5 text-gray-900 duration-300 ease-linear dark:border-gray-800 dark:bg-gray-dark dark:text-gray-300 ${isExpanded || isMobileOpen ? "w-[290px]" : "w-[90px]"} ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<div className="flex items-center gap-2 pb-7 pt-8">
				<Link href="/dashboard" className="flex items-center gap-3">
					{(isExpanded || isHovered || isMobileOpen) && (
						<span className="text-xl font-semibold text-gray-800 dark:text-white/90">
							bhandar.
						</span>
					)}
				</Link>
			</div>
			<div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
				<nav className="mb-6">
					<div className="mb-4">
						<h3
							className={`mb-4 text-xs font-semibold uppercase leading-[20px] text-gray-400 ${!isExpanded && !isHovered && !isMobileOpen ? "lg:hidden" : ""}`}
						>
							Main
						</h3>
						{renderMenuItems(navItems, "main")}
					</div>
					{othersItems.length > 0 ? (
						<div>
							<h3
								className={`mb-4 text-xs font-semibold uppercase leading-[20px] text-gray-400 ${!isExpanded && !isHovered && !isMobileOpen ? "lg:hidden" : ""}`}
							>
								More
							</h3>
							{renderMenuItems(othersItems, "others")}
						</div>
					) : null}
				</nav>
			</div>
		</aside>
	);
};

export default AppSidebar;
