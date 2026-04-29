"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ScanDialog({
  open,
  onOpenChange,
  onScan,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onScan: (barcode: string) => void;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const [supported, setSupported] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function start() {
      try {
        if (!("BarcodeDetector" in window)) {
          setSupported(false);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        // @ts-expect-error - BarcodeDetector is not in TS lib by default.
        const detector = new BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e", "qr_code"],
        });

        const tick = async () => {
          if (cancelled) return;
          try {
            const results = await detector.detect(video);
            const value = results?.[0]?.rawValue;
            if (value) {
              onScan(value);
              onOpenChange(false);
              return;
            }
          } catch {
            // ignore
          }
          rafRef.current = window.setTimeout(() => {
            tick().catch(() => {});
          }, 250) as unknown as number;
        };

        await tick();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Camera not available");
        onOpenChange(false);
      }
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) window.clearTimeout(rafRef.current);
      rafRef.current = null;
      const stream = streamRef.current;
      streamRef.current = null;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [open, onOpenChange, onScan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan barcode</DialogTitle>
          <DialogDescription>Use your camera to scan.</DialogDescription>
        </DialogHeader>
        {supported ? (
          <div className="w-full rounded-sm border overflow-hidden">
            <video ref={videoRef} className="w-full h-[320px] object-cover" playsInline />
          </div>
        ) : (
          <div className="rounded-sm border p-3 text-sm text-muted-foreground">
            Camera scanning is not supported in this browser. Use the barcode input instead.
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
