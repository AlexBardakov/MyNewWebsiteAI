// app/admin/products/search-input.tsx
"use client";

import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState } from "react";
import { Search } from "lucide-react";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (val) {
        params.set("q", val);
      } else {
        params.delete("q");
      }
      router.replace(`/admin/products?${params.toString()}`);
    });
  };

  return (
    <div className="relative w-full max-w-sm mb-6">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>
      <Input
        type="search"
        placeholder="Поиск по наименованию..."
        className="pl-9"
        value={query}
        onChange={handleSearch}
      />
    </div>
  );
}