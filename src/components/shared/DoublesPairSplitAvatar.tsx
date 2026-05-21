import { useEffect, useState } from "react";
import { UserCircle2 } from "@/icons/figma-icons";
import { cn } from "@/lib/utils";

interface HalfPlayer {
  profilePictureUrl?: string | null;
  name?: string | null;
  alias?: string | null;
}

function PlayerHalfAvatar({
  player,
  side,
}: {
  player: HalfPlayer;
  side: "left" | "right";
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const profilePictureUrl = player.profilePictureUrl?.trim() ?? "";

  useEffect(() => {
    setImageFailed(false);
  }, [profilePictureUrl]);

  const showImage = profilePictureUrl.length > 0 && !imageFailed;

  return (
    <div className="relative h-full w-1/2 overflow-hidden">
      {showImage ? (
        <img
          src={profilePictureUrl}
          alt=""
          className={cn(
            "absolute top-0 h-full w-[200%] max-w-none object-cover",
            side === "left" ? "left-0" : "right-0",
          )}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#dddddd]/60">
          <UserCircle2
            size={side === "left" ? 16 : 16}
            className="text-[#010a04]/70"
            aria-hidden
          />
        </div>
      )}
    </div>
  );
}

interface DoublesPairSplitAvatarProps {
  leftPlayer: HalfPlayer;
  rightPlayer: HalfPlayer;
  className?: string;
}

export function DoublesPairSplitAvatar({
  leftPlayer,
  rightPlayer,
  className,
}: DoublesPairSplitAvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-9 w-9 shrink-0 overflow-hidden rounded-[20px] bg-[#dddddd]/60 sm:h-10 sm:w-10",
        className,
      )}
      aria-hidden
    >
      <PlayerHalfAvatar player={leftPlayer} side="left" />
      <div className="absolute inset-y-1 left-1/2 z-10 w-px -translate-x-1/2 bg-[#010a04]/30" />
      <PlayerHalfAvatar player={rightPlayer} side="right" />
    </div>
  );
}
