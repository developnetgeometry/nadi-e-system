import React from "react";
import { RotateCcw, Filter, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DuspFilter } from "./DuspFilter";
import { MultiSelectFilter } from "./MultiSelectFilter";
import { SingleSelectFilter } from "./SingleSelectFilter";
import { FilterBadge } from "./FilterBadge";
import { NadiFilter } from "./NadiFilter";
import { DateFilter } from "./DateFilter";
import { DUSP, Phase, NADISite } from "@/hooks/report/use-report-filters";

type ReportFiltersProps = {
  // Filter state
  duspFilter: (string | number)[];
  setDuspFilter: (value: (string | number)[]) => void;
  phaseFilter: string | number | null;
  setPhaseFilter: (value: string | number | null) => void;
  nadiFilter: (string | number)[];
  setNadiFilter: (value: (string | number)[]) => void;
  monthFilter: string | number | null;
  setMonthFilter: (value: string | number | null) => void;
  yearFilter: string | number | null;
  setYearFilter: (value: string | number | null) => void;
  
  // Filter data
  dusps: DUSP[];
  phases: Phase[];
  nadiSites: NADISite[];
  monthOptions: { id: string | number; label: string }[];
  yearOptions: { id: string | number; label: string }[];
  
  // Loading state
  isLoading: boolean;
};

export const ReportFilters = ({
  // Filter state
  duspFilter,
  setDuspFilter,
  phaseFilter,
  setPhaseFilter,
  nadiFilter,
  setNadiFilter,
  monthFilter,
  setMonthFilter,
  yearFilter,
  setYearFilter,
  
  // Filter data
  dusps,
  phases,
  nadiSites,
  monthOptions,
  yearOptions,
  
  // Loading state
  isLoading
}: ReportFiltersProps) => {  const hasActiveFilters = 
    duspFilter.length > 0 || 
    phaseFilter !== null || 
    nadiFilter.length > 0 ||
    monthFilter !== null || 
    yearFilter !== null;
    
  const resetFilters = () => {
    setDuspFilter([]);
    setPhaseFilter(null);
    setNadiFilter([]);
    setMonthFilter(null);
    setYearFilter(null);
  };
  return (
    <>
      {/* Filters Row */}
      <div className="flex flex-wrap gap-2">
        {/* DUSP Filter */}
        <DuspFilter
          duspFilter={duspFilter}
          setDuspFilter={setDuspFilter}
          dusps={dusps}
          isLoading={isLoading}
        />        {/* Phase Filter */}
        <SingleSelectFilter
          selectedItem={phaseFilter}
          setSelectedItem={setPhaseFilter}
          items={phases.map(phase => ({
            id: phase.id,
            label: phase.name
          }))}
          icon={Users}
          label="Phase"
          searchPlaceholder="Search phases..."
          emptyMessage="No phases found."
          isLoading={isLoading}
        />

        {/* NADI Filter */}
        <NadiFilter
          selectedItems={nadiFilter}
          setSelectedItems={setNadiFilter}
          nadiSites={nadiSites}
          isLoading={isLoading}
        />

        {/* Month and Year Filters */}
        <DateFilter
          monthFilter={monthFilter}
          setMonthFilter={setMonthFilter}
          monthOptions={monthOptions}
          yearFilter={yearFilter}
          setYearFilter={setYearFilter}
          yearOptions={yearOptions}
          isLoading={false}
        />
        
        {/* Spacer */}
        <div className="flex-1"></div>
        
        {/* Reset Button */}
        <Button 
          variant="outline" 
          onClick={resetFilters} 
          className="flex items-center gap-2 h-10 text-sm px-4 shadow-sm hover:bg-slate-100"
          disabled={!hasActiveFilters}
        >
          <RotateCcw className="h-4 w-4" />
          Reset Filters
        </Button>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-3 items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="mr-1 flex items-center">
            <Filter className="h-4 w-4 text-slate-500 mr-1" />
            <span className="text-xs font-medium text-slate-500">Active Filters:</span>
          </div>
            {duspFilter.length > 0 && (
            <FilterBadge
              label="DUSP"
              value={duspFilter.length > 1
                ? `${duspFilter.length} selected`
                : duspFilter[0] === "unassigned"
                  ? "Not Assigned"
                  : dusps.find(d => String(d.id) === String(duspFilter[0]))?.name || String(duspFilter[0])}
              onClear={() => setDuspFilter([])}
            />
          )}
            {phaseFilter !== null && (
            <FilterBadge
              label="Phase"
              value={phases.find(p => p.id === phaseFilter)?.name || String(phaseFilter)}
              onClear={() => setPhaseFilter(null)}
            />
          )}
          
          {nadiFilter.length > 0 && (
            <FilterBadge
              label="NADI"
              value={nadiFilter.length > 1 
                ? `${nadiFilter.length} selected` 
                : nadiSites.find(s => s.id === nadiFilter[0])?.sitename || String(nadiFilter[0])}
              onClear={() => setNadiFilter([])}
            />
          )}
          
          {monthFilter !== null && (
            <FilterBadge
              label="Month"
              value={monthOptions.find(m => m.id === monthFilter)?.label || String(monthFilter)}
              onClear={() => setMonthFilter(null)}
            />
          )}
          
          {yearFilter !== null && (
            <FilterBadge
              label="Year"
              value={yearOptions.find(y => y.id === yearFilter)?.label || String(yearFilter)}
              onClear={() => setYearFilter(null)}
            />
          )}
        </div>
      )}
    </>
  );
};
