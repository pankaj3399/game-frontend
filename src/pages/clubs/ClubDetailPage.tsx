import { useParams } from "react-router-dom";
import InlineLoader from "@/components/shared/InlineLoader";
import { ClubCourtsSection } from "@/pages/clubs/components/detail/ClubCourtsSection";
import { ClubDetailHeader } from "@/pages/clubs/components/detail/ClubDetailHeader";
import { ClubDetailNotFound } from "@/pages/clubs/components/detail/ClubDetailNotFound";
import { ClubInfoSection } from "@/pages/clubs/components/detail/ClubInfoSection";
import { ClubSponsorsAside } from "@/pages/clubs/components/detail/ClubSponsorsAside";
import { useClubDetailData } from "@/pages/clubs/hooks/useClubDetailData";

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { club, courts, sponsors, isLoading } = useClubDetailData(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <InlineLoader />
      </div>
    );
  }

  if (!club) {
    return <ClubDetailNotFound />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <ClubDetailHeader club={club} />
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <ClubInfoSection club={club} />
            <ClubCourtsSection courts={courts} />
          </div>
          <ClubSponsorsAside club={club} sponsors={sponsors} />
        </div>
      </div>
    </div>
  );
}
