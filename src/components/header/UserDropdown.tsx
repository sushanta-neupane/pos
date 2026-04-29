"use client";
import React, { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

export default function UserDropdown() {
  const { data } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const initials = (data?.user?.name ?? data?.user?.email ?? "U").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button onClick={(e) => { e.stopPropagation(); setIsOpen((value) => !value); }} className="dropdown-toggle flex items-center text-gray-700 dark:text-gray-400">
        <span className="mr-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-brand-500 text-sm font-semibold text-white">{initials}</span>
        <span className="mr-1 block text-theme-sm font-medium">{data?.user?.name ?? data?.user?.email ?? "Guest"}</span>
        <svg className={`stroke-gray-500 transition-transform duration-200 dark:stroke-gray-400 ${isOpen ? "rotate-180" : ""}`} width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.3125 8.65625L9 13.3437L13.6875 8.65625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark">
        <div>
          <span className="block text-theme-sm font-medium text-gray-700 dark:text-gray-300">{data?.user?.name ?? "Signed in"}</span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">{data?.user?.email ?? ""}</span>
        </div>
        <ul className="flex flex-col gap-1 border-b border-gray-200 pb-3 pt-4 dark:border-gray-800">
          <li>
            <DropdownItem onItemClick={() => setIsOpen(false)} tag="a" href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 text-theme-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">Dashboard</DropdownItem>
          </li>
          <li>
            <DropdownItem onItemClick={() => setIsOpen(false)} tag="a" href="/pos" className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 text-theme-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">Sell</DropdownItem>
          </li>
        </ul>
        <button onClick={() => signOut({ callbackUrl: "/signin" })} className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2 text-left font-medium text-gray-700 text-theme-sm hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">Sign out</button>
      </Dropdown>
    </div>
  );
}
