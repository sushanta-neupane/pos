'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { addStock } from '@/actions/product.actions';
import { searchProducts } from '@/actions/pos.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanDialog } from '@/app/(app)/pos/scan-dialog';
import { getErrorMessage } from '@/lib/errors';
import { FormCard, PageTitle } from '@/components/form-shell';
import { Code39Barcode } from '@/components/barcode/code39';

export default function StockPage() {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Awaited<ReturnType<typeof searchProducts>>>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [barcode, setBarcode] = React.useState('');
  const [add, setAdd] = React.useState('1');
  const [loading, setLoading] = React.useState(false);
  const [scannerOpen, setScannerOpen] = React.useState(false);
  const barcodeRef = React.useRef<HTMLInputElement>(null);
  const qtyRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearchLoading(false);
      return;
    }

    const t = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const r = await searchProducts(q);
        setResults(r);
      } catch {
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => window.clearTimeout(t);
  }, [query]);

  function pick(barcodeValue: string, name: string) {
    setBarcode(barcodeValue);
    setQuery('');
    setResults([]);
    toast.success(`Selected: ${name}`);
    window.setTimeout(() => qtyRef.current?.focus(), 0);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await addStock({
        barcode: barcode.trim(),
        add: Number(add) || 0,
      });
      toast.success(`Stock updated: ${updated.name} (${updated.stock})`);
      setBarcode('');
      setAdd('1');
      barcodeRef.current?.focus();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to add stock'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle
        title="Add Stock"
        subtitle="Scan barcode and update inventory quickly."
        right={
          <Button variant="outline" type="button" onClick={() => setScannerOpen(true)}>
            Camera scan
          </Button>
        }
      />

      <FormCard title="Stock onboarding" description="Keep focus on barcode for fast scanning.">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <div className="text-sm font-medium">Search product</div>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or barcode"
              className="h-11 rounded-md"
            />
            {query.trim() ? (
              <div className="rounded-md border bg-white">
                <div className="flex items-center justify-between border-b px-3 py-2 text-xs text-muted-foreground">
                  <div>{searchLoading ? 'Searching…' : `Results (${results.length})`}</div>
                  <button
                    type="button"
                    className="text-xs hover:text-foreground"
                    onClick={() => {
                      setQuery('');
                      setResults([]);
                    }}
                  >
                    Clear
                  </button>
                </div>
                <div className="max-h-56 overflow-auto">
                  {results.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted/50"
                      onClick={() => pick(p.barcode, p.name)}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{p.name}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="origin-left scale-[0.65]">
                            <Code39Barcode value={p.barcode} height={38} narrow={2} wide={5} quiet={10} />
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">{p.barcode}</div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-xs text-muted-foreground">
                        <div>Stock</div>
                        <div className="mt-0.5 text-sm font-semibold text-foreground">{p.stock}</div>
                      </div>
                    </button>
                  ))}
                  {!searchLoading && results.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No products found
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="text-sm font-medium">Barcode</div>
            <Input
              ref={barcodeRef}
              autoFocus
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan or type barcode and press Enter"
              className="h-11 rounded-md font-mono"
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Quantity to add</div>
            <Input
              ref={qtyRef}
              type="number"
              step="1"
              value={add}
              onChange={(e) => setAdd(e.target.value)}
              className="h-11 rounded-md"
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-end">
            <Button disabled={loading} type="submit" className="h-11 px-6">
              {loading ? 'Updating...' : 'Add stock'}
            </Button>
          </div>
        </form>
      </FormCard>

      <ScanDialog
        open={scannerOpen}
        onOpenChange={(v) => {
          setScannerOpen(v);
          if (!v) barcodeRef.current?.focus();
        }}
        onScan={(code) => {
          setBarcode(code);
          setQuery('');
          setResults([]);
          toast.success('Scanned');
          setScannerOpen(false);
          setTimeout(() => barcodeRef.current?.focus(), 0);
        }}
      />
    </div>
  );
}
