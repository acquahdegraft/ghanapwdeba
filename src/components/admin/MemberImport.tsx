import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ParsedMember {
  full_name: string;
  email: string;
  phone?: string;
  region?: string;
  city?: string;
  business_name?: string;
  business_type?: string;
  disability_type?: string;
  membership_status?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; email: string; error: string }[];
}

const SAMPLE_CSV = `full_name,email,phone,region,city,business_name,business_type,disability_type,membership_status
John Doe,john@example.com,0241234567,Greater Accra,Accra,Doe Enterprises,retail,physical,pending
Jane Smith,jane@example.com,0551234567,Ashanti,Kumasi,Smith Services,services,visual,active`;

export function MemberImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [_file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedMember[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setParseErrors([]);
    setImportProgress(0);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "member_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (content: string): { data: ParsedMember[]; errors: string[] } => {
    const lines = content.trim().split("\n");
    const errors: string[] = [];
    const data: ParsedMember[] = [];

    if (lines.length < 2) {
      errors.push("CSV file must have at least a header row and one data row");
      return { data, errors };
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    
    // Validate required headers
    if (!headers.includes("full_name") || !headers.includes("email")) {
      errors.push("CSV must include 'full_name' and 'email' columns");
      return { data, errors };
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || "";
      });

      // Validate required fields
      if (!row.full_name) {
        errors.push(`Row ${i + 1}: Missing full_name`);
        continue;
      }
      if (!row.email) {
        errors.push(`Row ${i + 1}: Missing email`);
        continue;
      }
      if (!isValidEmail(row.email)) {
        errors.push(`Row ${i + 1}: Invalid email format - ${row.email}`);
        continue;
      }

      // Validate disability_type if provided
      const validDisabilityTypes = ["physical", "visual", "hearing", "intellectual", "psychosocial", "multiple", "other"];
      if (row.disability_type && !validDisabilityTypes.includes(row.disability_type.toLowerCase())) {
        errors.push(`Row ${i + 1}: Invalid disability_type - ${row.disability_type}`);
        continue;
      }

      // Validate membership_status if provided
      const validStatuses = ["active", "pending", "suspended", "expired"];
      if (row.membership_status && !validStatuses.includes(row.membership_status.toLowerCase())) {
        errors.push(`Row ${i + 1}: Invalid membership_status - ${row.membership_status}`);
        continue;
      }

      data.push({
        full_name: row.full_name,
        email: row.email.toLowerCase(),
        phone: row.phone || undefined,
        region: row.region || undefined,
        city: row.city || undefined,
        business_name: row.business_name || undefined,
        business_type: row.business_type || undefined,
        disability_type: row.disability_type?.toLowerCase() || undefined,
        membership_status: row.membership_status?.toLowerCase() || "pending",
      });
    }

    return { data, errors };
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.replace(/^"|"$/g, ""));
    return result;
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFile(selectedFile);
    setImportResult(null);

    try {
      const content = await selectedFile.text();
      const { data, errors } = parseCSV(content);
      setParsedData(data);
      setParseErrors(errors);

      if (data.length === 0 && errors.length > 0) {
        toast.error("Failed to parse CSV file");
      } else {
        toast.success(`Parsed ${data.length} members from CSV`);
      }
    } catch (error) {
      toast.error("Failed to read file");
      console.error(error);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Get current session for auth
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        toast.error("Authentication required");
        setIsImporting(false);
        return;
      }

      // Call edge function to import members with proper auth user creation
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ members: parsedData }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Import failed");
        setIsImporting(false);
        return;
      }

      // Transform result to match expected format
      const importResult: ImportResult = {
        success: result.success || 0,
        failed: result.failed || 0,
        errors: (result.errors || []).map((err: { email: string; error: string }, index: number) => ({
          row: index + 2,
          email: err.email,
          error: err.error,
        })),
      };

      setImportResult(importResult);
      setImportProgress(100);

      if (importResult.success > 0) {
        queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
        toast.success(`Successfully imported ${importResult.success} members with auth accounts`);
      }

      if (importResult.failed > 0) {
        toast.warning(`${importResult.failed} members failed to import`);
      }
    } catch (error: unknown) {
      console.error("Import error:", error);
      toast.error("An error occurred during import");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Members from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import members. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">CSV Template</p>
                <p className="text-xs text-muted-foreground">Download to see the expected format</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <Input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isImporting}
            />
          </div>

          {/* Parse Errors */}
          {parseErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Parsing errors ({parseErrors.length}):</p>
                <ScrollArea className="max-h-24">
                  <ul className="text-sm space-y-1">
                    {parseErrors.slice(0, 10).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {parseErrors.length > 10 && (
                      <li>...and {parseErrors.length - 10} more errors</li>
                    )}
                  </ul>
                </ScrollArea>
              </AlertDescription>
            </Alert>
          )}

          {/* Parsed Data Preview */}
          {parsedData.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Preview ({parsedData.length} members)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-48">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 20).map((member, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{member.full_name}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{member.phone || "-"}</TableCell>
                          <TableCell>{member.region || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{member.membership_status || "pending"}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parsedData.length > 20 && (
                    <p className="text-center text-sm text-muted-foreground py-2">
                      ...and {parsedData.length - 20} more members
                    </p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing members...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} />
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <Alert variant={importResult.failed > 0 ? "destructive" : "default"}>
              {importResult.failed > 0 ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertDescription>
                <p className="font-medium mb-2">
                  Import complete: {importResult.success} succeeded, {importResult.failed} failed
                </p>
                {importResult.errors.length > 0 && (
                  <ScrollArea className="max-h-24">
                    <ul className="text-sm space-y-1">
                      {importResult.errors.slice(0, 10).map((err, i) => (
                        <li key={i}>Row {err.row} ({err.email}): {err.error}</li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li>...and {importResult.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </ScrollArea>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isImporting}>
            Close
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedData.length === 0 || isImporting}
          >
            {isImporting ? "Importing..." : `Import ${parsedData.length} Members`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
