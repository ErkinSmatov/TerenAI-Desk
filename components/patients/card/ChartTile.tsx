"use client";

import { useId, useState, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type ChartTileProps = {
  title: string;
  unitLabel?: string;
  summaryLabel: string;
  isEmpty: boolean;
  table: { header: string[]; rows: string[][] };
  headerExtra?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
};

export function ChartTile({
  title,
  unitLabel,
  summaryLabel,
  isEmpty,
  table,
  headerExtra,
  children,
  fullWidth,
}: ChartTileProps) {
  const [open, setOpen] = useState(false);
  const tableId = useId();

  return (
    <section
      className={cn(
        "rounded-[36px] bg-td-tile p-6 text-td-ink",
        fullWidth && "lg:col-span-3",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {unitLabel ? (
            <p className="mt-1 text-sm leading-[1.4] font-semibold text-td-ink-2">{unitLabel}</p>
          ) : null}
        </div>
        {headerExtra ? <div>{headerExtra}</div> : null}
      </div>

      {isEmpty ? (
        <p className="mt-4 flex h-[240px] items-center justify-center text-base leading-normal font-normal text-td-ink-2">
          Нет измерений за выбранный период
        </p>
      ) : (
        <>
          <div role="img" aria-label={summaryLabel} className="mt-4 h-[240px] w-full">
            {children}
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={tableId}
            onClick={() => setOpen((v) => !v)}
            className="mt-2 inline-flex min-h-11 items-center text-sm leading-[1.4] font-semibold underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-[#C9F14C]"
          >
            {open ? "Скрыть таблицу" : "Показать таблицу"}
          </button>
          <div id={tableId} hidden={!open} className="max-h-72 overflow-auto">
            {open ? (
              <Table className="tabular-nums">
                <TableHeader>
                  <TableRow>
                    {table.header.map((h) => (
                      <TableHead key={h} className="text-sm font-semibold">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.rows.map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j} className="text-sm font-normal">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
