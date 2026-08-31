import React from "react"
import { Sparkline } from "./Sparkline"


export interface SummaryCardProps {
  label: string
  value?: number | string
  subtext?: string
  icon?: React.ReactNode
  iconBgColor?: string
  labelColor?: string
  sparklineData?: number[]
  sparklineColor?: string
}

export default function SummaryCard({
  label,
  value,
  subtext,
  icon,
  iconBgColor = "bg-green-100",
  labelColor = "text-green-primary",
  sparklineData,
  sparklineColor = "#15803d",
}: SummaryCardProps) {
  const isSparkline = Boolean(sparklineData && sparklineData.length > 0);

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl p-3 sm:p-4 shadow-[1px_1px_0px_2px_rgba(0,0,0,0.25)] flex flex-col justify-between min-h-[90px] sm:min-h-[110px] w-full">
      {isSparkline ? (
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {icon && (
            <div className={`p-2 sm:p-3 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}>
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className={`text-xs sm:text-sm font-bold truncate block ${labelColor}`} title={label}>
              {label}
            </span>
            <p className="text-xl sm:text-3xl font-bold text-black-primary mt-1">
              {value === undefined ? "—" : value}
            </p>
            {subtext && <p className="text-[10px] sm:text-xs text-black-200 mt-0.5 truncate">{subtext}</p>}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {icon && (
            <div className={`p-2 sm:p-3 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}>
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className={`text-xs sm:text-sm font-bold block truncate ${labelColor}`} title={label}>
              {label}
            </span>
            <p className="text-lg sm:text-2xl font-bold text-black-primary leading-tight mt-0.5">
              {value === undefined ? "—" : value}
            </p>
            {subtext && <p className="text-[10px] sm:text-xs text-black-200 truncate">{subtext}</p>}
          </div>
        </div>
      )}

      {isSparkline && sparklineData && (
        <div className="absolute bottom-0 left-0 right-0 -mb-1 w-full pointer-events-none overflow-hidden rounded-b-2xl">
          <Sparkline data={sparklineData} color={sparklineColor} />
        </div>
      )}
    </div>
  );
}