// Shared profile completion calculation for use in both frontend and admin views
export const PROFILE_FIELDS = [
  { key: "full_name", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "gender", label: "Gender" },
  { key: "disability_type", label: "Disability Type" },
  { key: "business_name", label: "Business Name" },
  { key: "business_type", label: "Business Type" },
  { key: "business_address", label: "Business Address" },
  { key: "mailing_address", label: "Mailing Address" },
  { key: "region", label: "Region" },
  { key: "city", label: "District" },
  { key: "education_level", label: "Education Level" },
  { key: "special_skills", label: "Special Skills" },
  { key: "bir_registration_number", label: "BIR Registration" },
  { key: "nis_registration_number", label: "NIS Registration" },
  { key: "vat_registration_number", label: "VAT Registration" },
  { key: "num_permanent_staff", label: "Permanent Staff" },
  { key: "num_temporary_staff", label: "Temporary Staff" },
  { key: "bank_name", label: "Bank Name" },
  { key: "bank_branch", label: "Bank Branch" },
] as const;

export function getProfileCompletion(profile: Record<string, unknown>): number {
  const filled = PROFILE_FIELDS.filter((f) => {
    const val = profile[f.key];
    return val !== null && val !== undefined && val !== "";
  });
  return Math.round((filled.length / PROFILE_FIELDS.length) * 100);
}

export function getMissingFields(profile: Record<string, unknown>): string[] {
  return PROFILE_FIELDS
    .filter((f) => {
      const val = profile[f.key];
      return val === null || val === undefined || val === "";
    })
    .map((f) => f.label);
}
