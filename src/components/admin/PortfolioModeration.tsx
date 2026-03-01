import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAllPortfoliosAdmin, useTogglePortfolioFeatured, useTogglePortfolioPublished } from "@/hooks/usePortfolio";
import { Loader2, Star, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function PortfolioModeration() {
  const { data: portfolios, isLoading } = useAllPortfoliosAdmin();
  const toggleFeatured = useTogglePortfolioFeatured();
  const togglePublished = useTogglePortfolioPublished();

  const handleToggleFeatured = (id: string, current: boolean) => {
    toggleFeatured.mutate(
      { id, is_featured: !current },
      { onSuccess: () => toast.success(current ? "Portfolio unfeatured" : "Portfolio featured on homepage") }
    );
  };

  const handleTogglePublished = (id: string, current: boolean) => {
    togglePublished.mutate(
      { id, is_published: !current },
      { onSuccess: () => toast.success(current ? "Portfolio unpublished" : "Portfolio published") }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Moderation</CardTitle>
      </CardHeader>
      <CardContent>
        {!portfolios || portfolios.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No portfolios created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Headline</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolios.map((p) => {
                  const memberName = (p as any).profiles?.full_name || "Unknown";
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{memberName}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{p.headline}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(p.services || []).slice(0, 2).map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                          {(p.services || []).length > 2 && (
                            <Badge variant="outline" className="text-xs">+{p.services.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{(p.portfolio_images || []).length}</TableCell>
                      <TableCell>
                        <Switch
                          checked={p.is_published}
                          onCheckedChange={() => handleTogglePublished(p.id, p.is_published)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={p.is_featured ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleFeatured(p.id, p.is_featured)}
                          disabled={toggleFeatured.isPending}
                        >
                          <Star className={`h-4 w-4 ${p.is_featured ? "fill-current" : ""}`} />
                        </Button>
                      </TableCell>
                      <TableCell>
                        {p.is_published && (
                          <a
                            href={`/portfolios/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
