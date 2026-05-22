import { Navigate, useParams } from "react-router-dom";
import InlineLoader from "@/components/shared/InlineLoader";
import { ClubCourtsSection } from "@/pages/clubs/components/detail/ClubCourtsSection";
import { ClubDetailHeader } from "@/pages/clubs/components/detail/ClubDetailHeader";
import { ClubDetailNotFound } from "@/pages/clubs/components/detail/ClubDetailNotFound";
import { ClubInfoSection } from "@/pages/clubs/components/detail/ClubInfoSection";
import { ClubSponsorsAside } from "@/pages/clubs/components/detail/ClubSponsorsAside";
import { useClubDetailData } from "@/pages/clubs/hooks/useClubDetailData";
import { useRequireAuth } from "@/pages/auth/hooks";

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { requireAuth } = useRequireAuth();
  const { club, courts, sponsors, isLoading } = useClubDetailData(id);

  if (id === "manage") {
    return <Navigate to="/clubs/manage" replace />;
  }

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
    <div className="min-h-[calc(100vh-4rem)] w-full min-w-0 bg-gray-50">
      <div className="mx-auto box-border w-full min-w-0 max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        <ClubDetailHeader club={club} />
        <div className="mb-8 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="order-2 flex min-w-0 flex-col gap-6 sm:gap-8 lg:order-1 lg:col-span-2">
            <ClubInfoSection club={club} />
            <ClubCourtsSection courts={courts} />
          </div>
          <ClubSponsorsAside
            className="order-1 min-w-0 lg:order-2"
            club={club}
            sponsors={sponsors}
            onRequireAuth={requireAuth}
          />
        </div>
      </div>
    </div>
  );
}
