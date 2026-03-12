import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface GoogleDriveIconProps {
  linked: boolean;
  url?: string | null;
  size?: "sm" | "md";
}

const GoogleDriveIcon = ({ linked, url, size = "sm" }: GoogleDriveIconProps) => {
  const px = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const color = linked ? "#1967D2" : "#9ca3af";

  const icon = (
    <svg className={px} viewBox="0 0 24 24" fill={color}>
      <path d="M7.71 3.5L1.15 15l3.44 5.97h6.47l-3.44-5.97L7.71 3.5zm1.14 0l6.47 11.5H21.85L15.29 3.5H8.85zm6.56 12.5L12 21.97h12.85L21.41 16H15.41z" />
    </svg>
  );

  if (url && linked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex hover:opacity-80">
            {icon}
          </a>
        </TooltipTrigger>
        <TooltipContent>Open in Google Drive</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{icon}</span>
      </TooltipTrigger>
      <TooltipContent>{linked ? "Google Drive gekoppeld" : "Geen Drive map"}</TooltipContent>
    </Tooltip>
  );
};

export default GoogleDriveIcon;
