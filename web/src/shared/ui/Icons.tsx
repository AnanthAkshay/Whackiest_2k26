import type { SVGProps } from "react";
import {
  ArrowRight,
  ArrowUp,
  ArrowSquareOut,
  BookOpen,
  Briefcase,
  CaretDown,
  ChatCircle,
  Check,
  Clock,
  CloudCheck,
  Copy,
  Desktop,
  DownloadSimple,
  FileXls,
  Fingerprint,
  GitDiff,
  Globe,
  Info,
  List,
  Lock,
  MagnifyingGlass,
  MapPin,
  Microphone,
  MicrophoneSlash,
  Minus,
  Moon,
  PaperPlaneRight,
  Plus,
  Question,
  ShareNetwork,
  ShieldCheck,
  SpeakerHigh,
  Sun,
  Trash,
  UploadSimple,
  User,
  Warning,
  WarningCircle,
  WifiSlash,
  X,
} from "@phosphor-icons/react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function IconBook({ size = 18, ...rest }: IconProps): JSX.Element {
  return <BookOpen size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconSheet({ size = 18, ...rest }: IconProps): JSX.Element {
  return <FileXls size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconMic({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Microphone size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconMicOff({ size = 18, ...rest }: IconProps): JSX.Element {
  return <MicrophoneSlash size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconShield({ size = 18, ...rest }: IconProps): JSX.Element {
  return <ShieldCheck size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconBriefcase({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Briefcase size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconUser({ size = 18, ...rest }: IconProps): JSX.Element {
  return <User size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconSun({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Sun size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconMoon({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Moon size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconMonitor({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Desktop size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconSearch({ size = 18, ...rest }: IconProps): JSX.Element {
  return <MagnifyingGlass size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconMenu({ size = 18, ...rest }: IconProps): JSX.Element {
  return <List size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconClose({ size = 18, ...rest }: IconProps): JSX.Element {
  return <X size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconArrowUp({ size = 18, ...rest }: IconProps): JSX.Element {
  return <ArrowUp size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconArrowRight({ size = 18, ...rest }: IconProps): JSX.Element {
  return <ArrowRight size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconChevronDown({ size = 18, ...rest }: IconProps): JSX.Element {
  return <CaretDown size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconCopy({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Copy size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconCheck({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Check size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconAlert({ size = 18, ...rest }: IconProps): JSX.Element {
  return <WarningCircle size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconWarn({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Warning size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconUpload({ size = 18, ...rest }: IconProps): JSX.Element {
  return <UploadSimple size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconClock({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Clock size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconCloudCheck({ size = 18, ...rest }: IconProps): JSX.Element {
  return <CloudCheck size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconMessage({ size = 18, ...rest }: IconProps): JSX.Element {
  return <ChatCircle size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconSend({ size = 18, ...rest }: IconProps): JSX.Element {
  return <PaperPlaneRight size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconVolume({ size = 18, ...rest }: IconProps): JSX.Element {
  return <SpeakerHigh size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconInfo({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Info size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconInfoFilled({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Info size={size} weight="fill" aria-hidden="true" {...rest} />;
}

export function IconMapPin({ size = 18, ...rest }: IconProps): JSX.Element {
  return <MapPin size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconGlobe({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Globe size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconDownload({ size = 18, ...rest }: IconProps): JSX.Element {
  return <DownloadSimple size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconExternalLink({ size = 18, ...rest }: IconProps): JSX.Element {
  return <ArrowSquareOut size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconTrash({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Trash size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconLock({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Lock size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconShare({ size = 18, ...rest }: IconProps): JSX.Element {
  return <ShareNetwork size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconHelp({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Question size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconCompare({ size = 18, ...rest }: IconProps): JSX.Element {
  return <GitDiff size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconFingerprint({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Fingerprint size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconWifiOff({ size = 18, ...rest }: IconProps): JSX.Element {
  return <WifiSlash size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconMinus({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Minus size={size} weight="regular" aria-hidden="true" {...rest} />;
}

export function IconPlus({ size = 18, ...rest }: IconProps): JSX.Element {
  return <Plus size={size} weight="regular" aria-hidden="true" {...rest} />;
}
