import type { Messages } from '../en';
import { shellAm } from './shell';
import { contactAm } from './contact';
import { helpAm } from './help';
import { bookingFlowAm } from './bookingFlow';
import { aboutAm } from './about';
import { hotelDetailAm } from './hotelDetail';
import { flightSearchAm } from './flightSearch';
import { conferencesAm } from './conferences';
import { shuttlesAm } from './shuttles';
import { bookingUiAm } from './bookingUi';

export const am = {
    ...shellAm,
    ...contactAm,
    ...helpAm,
    ...bookingFlowAm,
    ...aboutAm,
    ...hotelDetailAm,
    ...flightSearchAm,
    ...conferencesAm,
    ...shuttlesAm,
    ...bookingUiAm,
} as const satisfies Messages;
