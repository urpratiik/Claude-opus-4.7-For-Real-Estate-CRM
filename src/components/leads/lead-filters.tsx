"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_TEMPERATURES } from "@/lib/constants";

interface AgentOpt {
  id: string;
  full_name: string;
}

export function LeadFilters({ agents }: { agents: AgentOpt[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(search.get("q") ?? "");

  useEffect(() => {
    setQ(search.get("q") ?? "");
  }, [search]);

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(search.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`));
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    set("q", q);
  };

  const status = search.get("status") ?? "all";
  const source = search.get("source") ?? "all";
  const temperature = search.get("temperature") ?? "all";
  const scope = search.get("scope") ?? "all";
  const agentId = search.get("agentId") ?? "all";

  return (
    <div className="space-y-2">
      <form onSubmit={onSearch} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, phone, email, location"
          className="pl-9 pr-9"
          inputMode="search"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              set("q", null);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <FilterChip
          options={[
            { value: "all", label: "All leads" },
            { value: "mine", label: "My leads" },
            { value: "unassigned", label: "Unassigned" },
          ]}
          value={scope}
          onChange={(v) => set("scope", v)}
          placeholder="Scope"
        />
        <FilterChip
          options={[
            { value: "all", label: "Any status" },
            ...LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label })),
          ]}
          value={status}
          onChange={(v) => set("status", v)}
          placeholder="Status"
        />
        <FilterChip
          options={[
            { value: "all", label: "Any source" },
            ...LEAD_SOURCES.map((s) => ({ value: s.value, label: s.label })),
          ]}
          value={source}
          onChange={(v) => set("source", v)}
          placeholder="Source"
        />
        <FilterChip
          options={[
            { value: "all", label: "Any temp" },
            ...LEAD_TEMPERATURES.map((t) => ({ value: t.value, label: t.label })),
          ]}
          value={temperature}
          onChange={(v) => set("temperature", v)}
          placeholder="Temperature"
        />
        <FilterChip
          options={[
            { value: "all", label: "Any agent" },
            ...agents.map((a) => ({ value: a.id, label: a.full_name })),
          ]}
          value={agentId}
          onChange={(v) => set("agentId", v)}
          placeholder="Agent"
        />
        {(status !== "all" ||
          source !== "all" ||
          temperature !== "all" ||
          agentId !== "all" ||
          scope !== "all" ||
          q) && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => router.replace(pathname)}
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-auto min-w-[110px] gap-1 px-3 text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
