import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MemberProfile } from "@/hooks/useAdminData";
import { format, parseISO } from "date-fns";
import { User, Building2, MapPin, GraduationCap, FileCheck, Users, Landmark } from "lucide-react";

interface MemberDetailDialogProps {
  member: MemberProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined | boolean }) {
  const display = typeof value === "boolean"
    ? (value ? "Yes" : "No")
    : (value ?? "—");
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm">{String(display)}</span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="font-semibold text-sm">{title}</h4>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
  );
}

export function MemberDetailDialog({ member, open, onOpenChange }: MemberDetailDialogProps) {
  if (!member) return null;

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try { return format(parseISO(d), "MMM d, yyyy"); } catch { return d; }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {member.full_name}
            <Badge variant={member.membership_status === "active" ? "default" : "secondary"}>
              {member.membership_status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <Section title="General Information" icon={<User className="h-4 w-4 text-primary" />}>
            <DetailRow label="Full Name" value={member.full_name} />
            <DetailRow label="Email" value={member.email} />
            <DetailRow label="Gender" value={member.gender} />
            <DetailRow label="Joined" value={formatDate(member.created_at)} />
            <DetailRow label="Membership Start" value={formatDate(member.membership_start_date)} />
            <DetailRow label="Membership Expiry" value={formatDate(member.membership_expiry_date)} />
          </Section>

          <Separator />

          <Section title="Business Information" icon={<Building2 className="h-4 w-4 text-primary" />}>
            <DetailRow label="Business Name" value={member.business_name} />
            <DetailRow label="Business Type" value={member.business_type} />
            <DetailRow label="Business Address" value={member.business_address} />
            <DetailRow label="Mailing Address" value={member.mailing_address} />
          </Section>

          <Separator />

          <Section title="Location" icon={<MapPin className="h-4 w-4 text-primary" />}>
            <DetailRow label="Region" value={member.region} />
            <DetailRow label="City / District" value={member.city} />
          </Section>

          <Separator />

          <Section title="Education & Skills" icon={<GraduationCap className="h-4 w-4 text-primary" />}>
            <DetailRow label="Education Level" value={member.education_level} />
            <DetailRow label="Special Skills" value={member.special_skills} />
          </Section>

          <Separator />

          <Section title="Certificates & Registration" icon={<FileCheck className="h-4 w-4 text-primary" />}>
            <DetailRow label="BIR Registration No." value={member.bir_registration_number} />
            <DetailRow label="NIS Registration No." value={member.nis_registration_number} />
            <DetailRow label="VAT Registration No." value={member.vat_registration_number} />
            <DetailRow label="Certificate of Registration" value={member.has_certificate_of_registration} />
            <DetailRow label="Certificate of Continuance" value={member.has_certificate_of_continuance} />
          </Section>

          <Separator />

          <Section title="Human Resources" icon={<Users className="h-4 w-4 text-primary" />}>
            <DetailRow label="Permanent Staff" value={member.num_permanent_staff} />
            <DetailRow label="Temporary Staff" value={member.num_temporary_staff} />
          </Section>

          <Separator />

          <Section title="Financial Capacity" icon={<Landmark className="h-4 w-4 text-primary" />}>
            <DetailRow label="Bank / Financial Institution" value={member.bank_name} />
            <DetailRow label="Branch" value={member.bank_branch} />
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
