import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePublicPortfolios } from "@/hooks/usePortfolio";
import { ghanaRegions, businessTypes } from "@/lib/ghanaRegions";
import { Search, MapPin, Briefcase, ArrowRight, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 12;

export default function PublicPortfolios() {
  const { data: portfolios, isLoading } = usePublicPortfolios();
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [page, setPage] = useState(1);

  const allServices = useMemo(() => {
    const set = new Set<string>();
    (portfolios || []).forEach((p) => p.services?.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [portfolios]);

  const hasActiveFilters = regionFilter || businessTypeFilter || serviceFilter;

  const filtered = useMemo(() => (portfolios || []).filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.full_name?.toLowerCase().includes(q) ||
      p.headline?.toLowerCase().includes(q) ||
      p.business_name?.toLowerCase().includes(q) ||
      p.services?.some((s) => s.toLowerCase().includes(q)) ||
      p.skills?.some((s) => s.toLowerCase().includes(q));
    const matchesRegion = !regionFilter || p.region === regionFilter;
    const matchesBusiness = !businessTypeFilter || p.business_type === businessTypeFilter;
    const matchesService = !serviceFilter || p.services?.includes(serviceFilter);
    return matchesSearch && matchesRegion && matchesBusiness && matchesService;
  }), [portfolios, search, regionFilter, businessTypeFilter, serviceFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when filters change
  const resetAndSetSearch = (v: string) => { setSearch(v); setPage(1); };
  const resetAndSetRegion = (v: string) => { setRegionFilter(v); setPage(1); };
  const resetAndSetBusiness = (v: string) => { setBusinessTypeFilter(v); setPage(1); };
  const resetAndSetService = (v: string) => { setServiceFilter(v); setPage(1); };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        <section className="gradient-primary py-16 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold md:text-4xl">Member Portfolios</h1>
            <p className="mt-3 text-primary-foreground/80 max-w-2xl mx-auto">
              Browse the services our members offer and connect with skilled professionals
            </p>
            <div className="mt-6 mx-auto max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => resetAndSetSearch(e.target.value)}
                placeholder="Search by name, service, or skill..."
                className="pl-10 bg-background text-foreground"
              />
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Region</label>
              <Select value={regionFilter} onValueChange={resetAndSetRegion}>
                <SelectTrigger><SelectValue placeholder="All Regions" /></SelectTrigger>
                <SelectContent>
                  {ghanaRegions.map((r) => (
                    <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Business Type</label>
              <Select value={businessTypeFilter} onValueChange={resetAndSetBusiness}>
                <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  {businessTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {allServices.length > 0 && (
              <div className="w-full sm:w-48">
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Service</label>
                <Select value={serviceFilter} onValueChange={resetAndSetService}>
                  <SelectTrigger><SelectValue placeholder="All Services" /></SelectTrigger>
                  <SelectContent>
                    {allServices.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setRegionFilter(""); setBusinessTypeFilter(""); setServiceFilter(""); setPage(1); }}
                className="gap-1"
              >
                <X className="h-3.5 w-3.5" /> Clear filters
              </Button>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No portfolios found</h3>
              <p className="text-muted-foreground">Try a different search term</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} portfolios
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedItems.map((p) => (
                  <Link key={p.id} to={`/portfolios/${p.slug}`}>
                    <Card className="group h-full transition-all hover:shadow-lg hover:border-primary/30">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={p.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {p.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{p.full_name}</h3>
                            <p className="text-sm text-muted-foreground truncate">{p.headline}</p>
                          </div>
                        </div>
                        {p.business_name && (
                          <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Briefcase className="h-3.5 w-3.5" />
                            <span className="truncate">{p.business_name}</span>
                          </div>
                        )}
                        {(p.city || p.region) && (
                          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{[p.city, p.region].filter(Boolean).join(", ")}</span>
                          </div>
                        )}
                        {p.services?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {p.services.slice(0, 3).map((s, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                            ))}
                            {p.services.length > 3 && (
                              <Badge variant="outline" className="text-xs">+{p.services.length - 3}</Badge>
                            )}
                          </div>
                        )}
                        <div className="mt-4 flex items-center text-sm font-medium text-primary group-hover:underline">
                          View Portfolio <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button variant="outline" size="icon" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                    .reduce<(number | string)[]>((acc, n, idx, arr) => {
                      if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("...");
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((item, i) =>
                      typeof item === "string" ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">…</span>
                      ) : (
                        <Button
                          key={item}
                          variant={item === safePage ? "default" : "outline"}
                          size="icon"
                          onClick={() => setPage(item)}
                          className="h-9 w-9"
                        >
                          {item}
                        </Button>
                      )
                    )}
                  <Button variant="outline" size="icon" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
