import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function SvgIcon({ size = 18, children, ...rest }: IconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconBook(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </SvgIcon>
  );
}

export function IconSheet(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </SvgIcon>
  );
}

export function IconMic(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </SvgIcon>
  );
}

export function IconMicOff(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <path d="M15 9.34V5a3 3 0 0 0-5.94-.6" />
      <path d="M5 10v2a7 7 0 0 0 12 4.9" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </SvgIcon>
  );
}

export function IconShield(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </SvgIcon>
  );
}

export function IconBriefcase(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </SvgIcon>
  );
}

export function IconUser(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
    </SvgIcon>
  );
}

export function IconSun(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
    </SvgIcon>
  );
}

export function IconMoon(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </SvgIcon>
  );
}

export function IconSearch(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </SvgIcon>
  );
}

export function IconMenu(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </SvgIcon>
  );
}

export function IconClose(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </SvgIcon>
  );
}

export function IconArrowUp(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </SvgIcon>
  );
}

export function IconChevronDown(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <polyline points="6 9 12 15 18 9" />
    </SvgIcon>
  );
}

export function IconCopy(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </SvgIcon>
  );
}

export function IconCheck(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <polyline points="20 6 9 17 4 12" />
    </SvgIcon>
  );
}

export function IconAlert(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </SvgIcon>
  );
}

export function IconWarn(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </SvgIcon>
  );
}

export function IconUpload(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </SvgIcon>
  );
}

export function IconClock(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </SvgIcon>
  );
}

export function IconCloudCheck(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
      <polyline points="9 14 11 16 15 12" />
    </SvgIcon>
  );
}

export function IconMessage(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </SvgIcon>
  );
}

export function IconSend(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </SvgIcon>
  );
}

export function IconVolume(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </SvgIcon>
  );
}

export function IconInfo(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </SvgIcon>
  );
}

export function IconMapPin(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </SvgIcon>
  );
}

export function IconGlobe(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </SvgIcon>
  );
}

export function IconDownload(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </SvgIcon>
  );
}

export function IconExternalLink(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </SvgIcon>
  );
}

export function IconTrash(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </SvgIcon>
  );
}

export function IconLock(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </SvgIcon>
  );
}

export function IconShare(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </SvgIcon>
  );
}

export function IconHelp(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </SvgIcon>
  );
}

export function IconCompare(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <path d="M11 18H8a2 2 0 0 1-2-2V9" />
    </SvgIcon>
  );
}

export function IconFingerprint(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <path d="M12 11v5" />
      <path d="M8.5 11a3.5 3.5 0 0 1 7 0v3" />
      <path d="M5.5 11a6.5 6.5 0 0 1 13 0v2" />
      <path d="M12 2a10 10 0 0 0-8 4" />
    </SvgIcon>
  );
}

export function IconWifiOff(props: IconProps): JSX.Element {
  return (
    <SvgIcon {...props}>
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M5 12.86a10 10 0 0 1 5.17-2.69" />
      <path d="M19 12.86a10 10 0 0 0-2.06-1.5" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </SvgIcon>
  );
}
