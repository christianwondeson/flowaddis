/**
 * Public contact numbers (display + tel: href) for footer, contact, and help pages.
 */
export type OfficePhoneLine = {
    region: string;
    /** Human-readable international format */
    display: string;
    /** E.164 for tel: links (no spaces) */
    tel: string;
};

export const BOOKADDIS_INTERNATIONAL_LINES: OfficePhoneLine[] = [
    { region: 'Italy', display: '+1 (514) 945-7585', tel: '+15149457585' },
    { region: 'USA', display: '+1 (857) 210-9871', tel: '+18572109871' },
    { region: 'France', display: '+33 6 15 62 47 01', tel: '+33615624701' },
];

/** Ethiopia (main local line) */
export const BOOKADDIS_ETHIOPIA_PHONE: OfficePhoneLine = {
    region: 'Ethiopia',
    display: '+251 921 929 159',
    tel: '+251921929159',
};
