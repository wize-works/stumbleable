import * as React from 'react';

/**
 * SVG Icon Components for Email Templates
 * Inspired by Font Awesome duotone style with Stumbleable brand colors
 * 
 * These icons replace emoticons with brand-aligned SVG graphics that work
 * reliably across email clients.
 * 
 * Brand Colors from light.css theme:
 * - Primary: #FF4D6D (Punchy Pink-Red)
 * - Secondary: #00C49A (Neon Mint)
 * - Accent: #FFD600 (Electric Yellow)
 * - Success: #17E68F
 * - Warning: #FF8C42
 * - Error: #FF3355
 * - Info: #0091FF
 */

interface IconProps {
    size?: number;
    primaryColor?: string;
    secondaryColor?: string;
    style?: React.CSSProperties;
}

// Stumbleable Brand Colors
const defaultPrimaryColor = '#FF4D6D'; // Punchy Pink-Red
const defaultSecondaryColor = '#FFB3C1'; // Lighter Pink (for duotone effect)

// Base icon wrapper with consistent sizing
const IconWrapper: React.FC<IconProps & { children: React.ReactNode }> = ({
    size = 24,
    style,
    children
}) => (
    <span style={{
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        verticalAlign: 'middle',
        lineHeight: '1',
        ...style
    }}>
        {children}
    </span>
);

export const PartyIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = defaultPrimaryColor,
    secondaryColor = defaultSecondaryColor,
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M464 256c0-114.9-93.1-208-208-208S48 141.1 48 256c0 79.6 44.7 148.9 110.3 183.6L256 512l97.7-72.4C419.3 404.9 464 335.6 464 256z" />
            <path fill={primaryColor} d="M256 48l-32 80 32 32 32-32-32-80zm-128 80l-48 48 32 32 48-48-32-32zm256 0l-32 32 48 48 32-32-48-48zM96 256l-48 32 48 48 32-32-32-48zm320 0l-32 48 32 32 48-48-48-32zm-240 80l-48 48 32 32 48-48-32-32zm208 0l-32 32 48 48 32-32-48-48z" />
        </svg>
    </IconWrapper>
);

export const LightbulbIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = '#FF8C42', // Brand Warning color
    secondaryColor = '#FFBE9D', // Lighter warning tint
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M272 384V448c0 17.7-14.3 32-32 32H144c-17.7 0-32-14.3-32-32V384h160z" />
            <path fill={primaryColor} d="M297.2 248.9C311.6 228.3 320 203.2 320 176c0-70.7-57.3-128-128-128S64 105.3 64 176c0 27.2 8.4 52.3 22.8 72.9c3.7 5.3 8.1 11.3 12.8 17.7l0 0c12.9 17.7 28.3 38.9 39.8 59.8c10.4 19 15.7 38.8 18.3 57.5H226c2.6-18.7 7.9-38.6 18.3-57.5c11.5-20.9 26.9-42.1 39.8-59.8l0 0c4.7-6.4 9-12.4 12.8-17.7zM192 0c106 0 192 86 192 192c0 40.8-12.4 78.9-33.5 110.3c-5.6 8.3-12 17.2-18.8 26.4c-11.2 15.3-23.9 32.6-33.1 49.7c-14.2 26.4-21.5 52.3-23.8 75.6H126.2c-2.3-23.3-9.6-49.2-23.8-75.6c-9.2-17.1-21.9-34.4-33.1-49.7c-6.8-9.2-13.2-18.1-18.8-26.4C29.4 270.9 17 232.8 17 192C17 86 103 0 192 0z" />
        </svg>
    </IconWrapper>
);

export const RocketIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = defaultPrimaryColor,
    secondaryColor = defaultSecondaryColor,
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M156.6 384.9L125.7 354c-8.5-8.5-11.5-20.8-7.7-32.2l3-8.9c7.6-22.8 12.9-46.8 15.5-71.5l-54.1 16.2c-22.5 6.7-40.2 23.4-46.9 45.9L2.5 460.4c-3.4 11.3 8.5 21.4 19.8 16.8l106.5-43.6c13.4-5.5 25.1-14.2 34.2-25.4l5.6-6.9zM384.4 127.1l-60.3 4.3c-33 2.4-66.1 10.6-97.8 24.4L123.2 202.5c-25.3 11-43.7 33.1-49.3 59.2L45.8 408.6c-3.2 15 9.3 28.9 24.4 27.1l106.8-12.8c33.6-4 65.8-15.8 94.3-34.6l87.7-58.1c32.1-21.3 55.7-52.8 67.2-89.8l18.3-59.2c10.5-33.8-25.5-62.7-60.3-54.1z" />
            <path fill={primaryColor} d="M476.9 2.1C461.7-1.6 447 7.8 443.3 23l-28.6 119.6c-30.8 4.3-58.9 18.3-80.7 39.9l-38.6 38.3 60.7 60.3 38.3-38.6c21.6-21.8 35.6-49.9 39.9-80.7L553.9 68.7c3.7-15.2-5.7-29.9-20.9-33.6L476.9 2.1zM288 256c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32z" />
        </svg>
    </IconWrapper>
);

export const GlobeIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = '#17E68F', // Brand Success color
    secondaryColor = '#7BF3B8', // Lighter success tint
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0 0 114.6 0 256s114.6 256 256 256z" />
            <path fill={primaryColor} d="M256 0c10.9 0 21.5 8.6 29.9 24.5 7.8 14.7 14.1 34.3 18.4 57.5H207.7c4.3-23.2 10.6-42.8 18.4-57.5C234.5 8.6 245.1 0 256 0zm-77.3 82C172 113.8 168 147.6 168 182H88.3C96.6 131.1 133.3 90.1 178.7 82zm0 348c-45.4-8.1-82.1-49.1-90.4-100H168c0 34.4 4 68.2 10.7 100zm155.9-100c6.7-31.8 10.7-65.6 10.7-100h79.7c-8.3 50.9-45 91.9-90.4 100zm90.4-132H345.3c-4.2-23.2-10.6-42.8-18.4-57.5C335.5 126.6 346.1 118 357 118c45.4 8.1 82.1 49.1 90.4 100zM256 432c-10.9 0-21.5-8.6-29.9-24.5-7.8-14.7-14.1-34.3-18.4-57.5h96.6c-4.3 23.2-10.6 42.8-18.4 57.5C277.5 423.4 266.9 432 256 432z" />
        </svg>
    </IconWrapper>
);

export const TargetIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = defaultPrimaryColor,
    secondaryColor = defaultSecondaryColor,
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0 0 114.6 0 256s114.6 256 256 256z" />
            <path fill={primaryColor} d="M256 368c61.9 0 112-50.1 112-112s-50.1-112-112-112-112 50.1-112 112 50.1 112 112 112zm0-160c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48z" />
        </svg>
    </IconWrapper>
);

export const ChartIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = defaultPrimaryColor,
    secondaryColor = defaultSecondaryColor,
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M32 32c17.7 0 32 14.3 32 32V448c0 17.7-14.3 32-32 32s-32-14.3-32-32V64C0 46.3 14.3 32 32 32z" />
            <path fill={primaryColor} d="M160 96c0-17.7 14.3-32 32-32s32 14.3 32 32V448c0 17.7-14.3 32-32 32s-32-14.3-32-32V96zm128 64c0-17.7 14.3-32 32-32s32 14.3 32 32V448c0 17.7-14.3 32-32 32s-32-14.3-32-32V160zm128 96c0-17.7 14.3-32 32-32s32 14.3 32 32V448c0 17.7-14.3 32-32 32s-32-14.3-32-32V256z" />
        </svg>
    </IconWrapper>
);

export const CommentIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = defaultPrimaryColor,
    secondaryColor = defaultSecondaryColor,
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M256 448c141.4 0 256-93.1 256-208S397.4 32 256 32 0 125.1 0 240c0 49.6 21.4 95.1 56.9 130.8L16.5 441.8c-6.9 10.3-8.2 23.8-3.4 35.2s15.2 19 27.7 19H256z" />
            <path fill={primaryColor} d="M144 208c0 8.8 7.2 16 16 16h192c8.8 0 16-7.2 16-16s-7.2-16-16-16H160c-8.8 0-16 7.2-16 16zm16 48c-8.8 0-16 7.2-16 16s7.2 16 16 16h128c8.8 0 16-7.2 16-16s-7.2-16-16-16H160z" />
        </svg>
    </IconWrapper>
);

export const BookmarkIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = defaultPrimaryColor,
    secondaryColor = defaultSecondaryColor,
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M0 48C0 21.5 21.5 0 48 0H336c26.5 0 48 21.5 48 48V488.5c0 9.2-5.6 17.5-14.2 21-8.5 3.5-18.2 1.8-24.6-4.3L192 384 38.8 505.1c-6.4 6.1-16.1 7.8-24.6 4.3S0 497.7 0 488.5V48z" />
            <path fill={primaryColor} d="M192 256L48 384V48c0-8.8 7.2-16 16-16H320c8.8 0 16 7.2 16 16V384L192 256z" />
        </svg>
    </IconWrapper>
);

export const FireIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = '#FF3355', // Brand Error color
    secondaryColor = '#FF99AA', // Lighter error tint
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M159.3 5.4c7.8-7.3 19.9-7.2 27.7 .1 27.6 25.9 53.5 53.8 77.7 84.4 11.6-18.6 23.3-37.4 35.7-54.3 8.1-10.9 25.1-13.8 36.2-4.8 48.6 39.2 84.7 87.8 96.7 143.4 1.5 6.9 2.2 14.1 2.2 21.5 0 123.7-100.3 224-224 224S0 319.3 0 195.7c0-7.3 .7-14.5 2.2-21.5 12-55.6 48.1-104.2 96.7-143.4 11.1-9 28.1-6.1 36.2 4.8 12.4 16.9 24.1 35.7 35.7 54.3 24.2-30.6 50.1-58.5 77.7-84.4z" />
            <path fill={primaryColor} d="M216 352c-39.8 0-72-29.1-72-65 0-28.7 19.8-54.1 48-71.1V184c0-13.3 10.7-24 24-24s24 10.7 24 24v31.9c28.2 17 48 42.4 48 71.1 0 35.9-32.2 65-72 65z" />
        </svg>
    </IconWrapper>
);

export const CheckIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = '#17E68F', // Brand Success color
    secondaryColor = '#7BF3B8', // Lighter success tint
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0 0 114.6 0 256s114.6 256 256 256z" />
            <path fill={primaryColor} d="M369 161L241 289l-17 17-17-17-64-64c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 161c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0z" />
        </svg>
    </IconWrapper>
);

export const WarningIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = '#FF8C42', // Brand Warning color
    secondaryColor = '#FFBE9D', // Lighter warning tint
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32z" />
            <path fill={primaryColor} d="M256 128c13.3 0 24 10.7 24 24v112c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zm32 224c0 17.7-14.3 32-32 32s-32-14.3-32-32 14.3-32 32-32 32 14.3 32 32z" />
        </svg>
    </IconWrapper>
);

export const TrashIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = '#FF3355', // Brand Error color
    secondaryColor = '#FF99AA', // Lighter error tint
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M32 96h384v320c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V96z" />
            <path fill={primaryColor} d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM160 160c8.8 0 16 7.2 16 16V400c0 8.8-7.2 16-16 16s-16-7.2-16-16V176c0-8.8 7.2-16 16-16zm96 0c8.8 0 16 7.2 16 16V400c0 8.8-7.2 16-16 16s-16-7.2-16-16V176c0-8.8 7.2-16 16-16z" />
        </svg>
    </IconWrapper>
);

export const CalendarIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = defaultPrimaryColor,
    secondaryColor = defaultSecondaryColor,
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M0 192H448V464c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V192z" />
            <path fill={primaryColor} d="M152 0c13.3 0 24 10.7 24 24V64H272V24c0-13.3 10.7-24 24-24s24 10.7 24 24V64h48c26.5 0 48 21.5 48 48v80H32V112c0-26.5 21.5-48 48-48h48V24c0-13.3 10.7-24 24-24z" />
        </svg>
    </IconWrapper>
);

export const LockIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = '#1F262E', // Brand Neutral color
    secondaryColor = '#9CA3AF', // Lighter neutral tint
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z" />
            <path fill={primaryColor} d="M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zm80 176c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32z" />
        </svg>
    </IconWrapper>
);

export const UserIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = defaultPrimaryColor,
    secondaryColor = defaultSecondaryColor,
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128z" />
            <path fill={primaryColor} d="M0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3z" />
        </svg>
    </IconWrapper>
);

export const SaveIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = defaultPrimaryColor,
    secondaryColor = defaultSecondaryColor,
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M48 96V416c0 8.8 7.2 16 16 16H384c8.8 0 16-7.2 16-16V128L336 64H64c-8.8 0-16 7.2-16 16z" />
            <path fill={primaryColor} d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V163.9c0-12.7-5.1-24.9-14.1-33.9L366.1 62.1c-9-9-21.2-14.1-33.9-14.1H64zM224 416c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64zm96-304V184c0 13.3-10.7 24-24 24H88c-13.3 0-24-10.7-24-24V112c0-13.3 10.7-24 24-24H296c13.3 0 24 10.7 24 24z" />
        </svg>
    </IconWrapper>
);

export const HeartIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = '#FF3355', // Brand Error color
    secondaryColor = '#FF99AA', // Lighter error tint
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z" />
            <path fill={primaryColor} d="M256 416L47.6 231.2C17.2 202.9 0 163.2 0 121.7v-5.8c0-69.9 50.5-129.5 119.4-141C165 -32.5 211.4-17.6 244 15l12 12 12-12c32.6-32.6 79-47.5 124.6-39.9C461.5-13.4 512 46.2 512 116.1v5.8c0 41.5-17.2 81.2-47.6 109.5L256 416z" />
        </svg>
    </IconWrapper>
);

export const SettingsIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = '#1F262E', // Brand Neutral color
    secondaryColor = '#9CA3AF', // Lighter neutral tint
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6 4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2 5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8 8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3z" />
            <path fill={primaryColor} d="M256 336c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z" />
        </svg>
    </IconWrapper>
);

export const SparklesIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = '#FFD600', // Brand Accent color (Electric Yellow)
    secondaryColor = '#FFEB80', // Lighter accent tint
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M327.5 85.2c-4.5 1.7-7.5 6-7.5 10.8s3 9.1 7.5 10.8L384 128l21.2 56.5c1.7 4.5 6 7.5 10.8 7.5s9.1-3 10.8-7.5L448 128l56.5-21.2c4.5-1.7 7.5-6 7.5-10.8s-3-9.1-7.5-10.8L448 64 426.8 7.5C425.1 3 420.8 0 416 0s-9.1 3-10.8 7.5L384 64 327.5 85.2zM205.1 73.3c-2.6-5.7-8.3-9.3-14.5-9.3s-11.9 3.6-14.5 9.3L123.3 187.3 9.3 240.1C3.6 242.7 0 248.4 0 254.6s3.6 11.9 9.3 14.5l114.1 52.8 52.8 114.1c2.6 5.7 8.3 9.3 14.5 9.3s11.9-3.6 14.5-9.3l52.8-114.1 114.1-52.8c5.7-2.6 9.3-8.3 9.3-14.5s-3.6-11.9-9.3-14.5L257.9 187.3 205.1 73.3z" />
            <path fill={primaryColor} d="M384 384l-42.4 15.9c-4.5 1.7-7.5 6-7.5 10.8s3 9.1 7.5 10.8L384 437.3l15.9 42.4c1.7 4.5 6 7.5 10.8 7.5s9.1-3 10.8-7.5L437.3 437.3l42.4-15.9c4.5-1.7 7.5-6 7.5-10.8s-3-9.1-7.5-10.8L437.3 384l-15.9-42.4c-1.7-4.5-6-7.5-10.8-7.5s-9.1 3-10.8 7.5L384 384z" />
        </svg>
    </IconWrapper>
);

export const ClipboardIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = defaultPrimaryColor,
    secondaryColor = defaultSecondaryColor,
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M280 64h40c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128C0 92.7 28.7 64 64 64h40 9.6C121 27.5 153.3 0 192 0s71 27.5 78.4 64H280z" />
            <path fill={primaryColor} d="M192 0c-26.5 0-48 21.5-48 48v16c0 8.8 7.2 16 16 16h64c8.8 0 16-7.2 16-16V48c0-26.5-21.5-48-48-48z" />
        </svg>
    </IconWrapper>
);

export const BanIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = '#FF3355', // Brand Error color
    secondaryColor = '#FF99AA', // Lighter error tint
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0 0 114.6 0 256s114.6 256 256 256z" />
            <path fill={primaryColor} d="M175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z" />
        </svg>
    </IconWrapper>
);

export const LinkIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = defaultPrimaryColor,
    secondaryColor = defaultSecondaryColor,
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76.2-19.3 103.8 8.6 31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7z" />
            <path fill={primaryColor} d="M60.2 244.3c-56.5 56.5-56.5 148 0 204.5 50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76.2 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0 27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z" />
        </svg>
    </IconWrapper>
);

export const TrendingIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = '#17E68F', // Brand Success color
    secondaryColor = '#7BF3B8', // Lighter success tint
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M384 160c-17.7 0-32-14.3-32-32s14.3-32 32-32H544c17.7 0 32 14.3 32 32V288c0 17.7-14.3 32-32 32s-32-14.3-32-32V205.3L342.6 374.6c-12.5 12.5-32.8 12.5-45.3 0L192 269.3 54.6 406.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l160-160c12.5-12.5 32.8-12.5 45.3 0L320 306.7 466.7 160H384z" />
            <path fill={primaryColor} d="M512 96V288c0 17.7-14.3 32-32 32s-32-14.3-32-32V205.3L342.6 310.6c-12.5 12.5-32.8 12.5-45.3 0L192 205.3 54.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l160-160c12.5-12.5 32.8-12.5 45.3 0L320 242.7 466.7 96H384c-17.7 0-32-14.3-32-32s14.3-32 32-32H544c17.7 0 32 14.3 32 32z" />
        </svg>
    </IconWrapper>
);

export const ClockIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = defaultPrimaryColor,
    secondaryColor = defaultSecondaryColor,
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0 0 114.6 0 256s114.6 256 256 256z" />
            <path fill={primaryColor} d="M232 120V256c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z" />
        </svg>
    </IconWrapper>
);

export const RotateIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = defaultPrimaryColor,
    secondaryColor = defaultSecondaryColor,
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M463.5 224H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5z" />
            <path fill={primaryColor} d="M386.3 160H344c-13.3 0-24 10.7-24 24s10.7 24 24 24h89.5c13.3 0 24-10.7 24-24V95.5c0-13.3-10.7-24-24-24s-24 10.7-24 24v42.3l-23.2-23.2z" />
        </svg>
    </IconWrapper>
);

export const BookIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = defaultPrimaryColor,
    secondaryColor = defaultSecondaryColor,
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M0 96C0 43 43 0 96 0H384h32c17.7 0 32 14.3 32 32V352c0 17.7-14.3 32-32 32v64c17.7 0 32 14.3 32 32s-14.3 32-32 32H96c-53 0-96-43-96-96V96zM64 416c0 17.7 14.3 32 32 32H384V384H96c-17.7 0-32 14.3-32 32z" />
            <path fill={primaryColor} d="M384 0H96C43 0 0 43 0 96V416c0-17.7 14.3-32 32-32H384V0z" />
        </svg>
    </IconWrapper>
);

export const InboxIcon: React.FC<IconProps> = ({
    size = 24,
    primaryColor = defaultPrimaryColor,
    secondaryColor = defaultSecondaryColor,
    style
}) => (
    <IconWrapper size={size} style={style}>
        <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path fill={secondaryColor} opacity="0.4" d="M121 32C91.6 32 66 52 58.9 80.5L1.9 308.4C.6 313.5 0 318.7 0 323.9V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V323.9c0-5.2-.6-10.4-1.9-15.5l-57-227.9C446 52 420.4 32 391 32H121z" />
            <path fill={primaryColor} d="M0 323.9V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V323.9c0-5.2-.6-10.4-1.9-15.5L453.2 288H368c-8.8 0-16 7.2-16 16 0 26.5-21.5 48-48 48H208c-26.5 0-48-21.5-48-48 0-8.8-7.2-16-16-16H58.8L1.9 308.4C.6 313.5 0 318.7 0 323.9z" />
        </svg>
    </IconWrapper>
);
