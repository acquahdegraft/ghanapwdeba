import { Link } from "react-router-dom";
import { useFeaturedPortfolios } from "@/hooks/usePortfolio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Star } from "lucide-react";

export function FeaturedPortfolios() {
  const { data: portfolios, isLoading } = useFeaturedPortfolios();

  if (isLoading || !portfolios || portfolios.length === 0) return null;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm">
            <Star className="h-4 w-4 text-primary fill-primary" />
            Featured Members
          </div>
          <h2 className="mb-3 text-3xl font-bold">Member Portfolios</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Discover the services and skills our members offer. Connect directly with talented entrepreneurs.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {portfolios.slice(0, 6).map((p) => (
            <Link key={p.id} to={`/portfolios/${p.slug}`}>
              <Card className="group h-full transition-all hover:shadow-lg hover:border-primary/30 overflow-hidden">
                {/* Show first portfolio image as banner if available */}
                {p.portfolio_images?.length > 0 && (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={p.portfolio_images[0]}
                      alt={`${p.full_name}'s work`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {p.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{p.full_name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{p.headline}</p>
                    </div>
                  </div>
                  {(p.city || p.region) && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{[p.city, p.region].filter(Boolean).join(", ")}</span>
                    </div>
                  )}
                  {p.services?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {p.services.slice(0, 3).map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center text-sm font-medium text-primary group-hover:underline">
                    View Portfolio <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" size="lg" asChild>
            <Link to="/portfolios">
              Browse All Portfolios
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
