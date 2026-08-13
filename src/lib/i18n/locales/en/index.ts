import { shellEn } from './shell';
import { contactEn } from './contact';
import { helpEn } from './help';
import { bookingFlowEn } from './bookingFlow';
import { aboutEn } from './about';
import { hotelDetailEn } from './hotelDetail';
import { flightSearchEn } from './flightSearch';
import { conferencesEn } from './conferences';
import { shuttlesEn } from './shuttles';
import { bookingUiEn } from './bookingUi';
import { reserveEn } from './reserve';

export const en = {
    ...shellEn,
    ...contactEn,
    ...helpEn,
    ...bookingFlowEn,
    ...aboutEn,
    ...hotelDetailEn,
    ...flightSearchEn,
    ...conferencesEn,
    ...shuttlesEn,
    ...bookingUiEn,
    ...reserveEn,
} as const;

type DeepStringValues<T> = {
    [K in keyof T]: T[K] extends Record<string, unknown> ? DeepStringValues<T[K]> : string;
};

export type Messages = DeepStringValues<typeof en>;
