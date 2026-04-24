"use client";

import * as React from "react";

export function PrintClient() {
  React.useEffect(() => {
    const t = window.setTimeout(() => window.print(), 100);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}

