import { Inter } from "next/font/google";
import "./globals.css";
import "flatpickr/dist/flatpickr.css";
import { Providers } from "@/app/providers";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
	title: "Bhandar",
	description: "Bhandar dashboard",
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body
				className={`${inter.className} dark:bg-gray-900`}
				style={{ fontFamily: "Inter, Noto Sans Devanagari, sans-serif" }}
			>
				<ThemeProvider>
					<SidebarProvider>
						<Providers>{children}</Providers>
					</SidebarProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
