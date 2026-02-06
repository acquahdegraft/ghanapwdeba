import { useProfile } from "@/hooks/useProfile";
import { useMembershipTypes } from "@/hooks/useMembershipTypes";

const DEFAULT_DUES_AMOUNT = 100;

export function useMemberDues() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: membershipTypes, isLoading: typesLoading } = useMembershipTypes();

  const isLoading = profileLoading || typesLoading;

  // Find the user's membership type
  const userMembershipType = membershipTypes?.find(
    (type) => type.id === profile?.membership_type_id
  );

  // If user has a membership type, use its dues; otherwise find default or use fallback
  let duesAmount = DEFAULT_DUES_AMOUNT;
  let membershipTypeName = "Standard Member";

  if (userMembershipType) {
    duesAmount = userMembershipType.annual_dues;
    membershipTypeName = userMembershipType.name;
  } else if (membershipTypes && membershipTypes.length > 0) {
    // Use the first active membership type as default
    const defaultType = membershipTypes[0];
    duesAmount = defaultType.annual_dues;
    membershipTypeName = defaultType.name;
  }

  return {
    duesAmount,
    membershipTypeName,
    membershipType: userMembershipType,
    allMembershipTypes: membershipTypes,
    isLoading,
  };
}
