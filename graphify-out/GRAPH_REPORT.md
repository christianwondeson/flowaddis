# Graph Report - flowaddis  (2026-08-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1750 nodes · 4733 edges · 123 communities (77 shown, 46 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `545ea2e6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useAuth
- payment-form.tsx
- locale-provider.tsx
- hotelAdminFetch
- getApiHeaders
- en/index.ts
- devDependencies
- my-trips-list.tsx
- getSafeBackendBaseUrl
- strapi-server.ts
- (bookings)/hotels/page.tsx
- admin-loader.tsx
- admin/conferences/page.tsx
- button.tsx
- assert-hotel-portal.ts
- booking-modal.tsx
- compilerOptions
- verifyFirebaseIdToken
- hotel-partner-kyc.ts
- cn
- flight-booking-modal.tsx
- reservations-inner.tsx
- rooms-manager.tsx
- useTranslations
- auth-provider.tsx
- [hotelId]/shuttles/page.tsx
- recaptcha-enterprise-assessment.ts
- promo-sections.tsx
- (bookings)/flights/page.tsx
- hotel-reservation-detail-sheet.tsx
- reset-password/page.tsx
- hotel-booking-summary.tsx
- AdminLoader
- signin/page.tsx
- admin-finance-filters.tsx
- admin-cms-client.ts
- searchWidget.tsx
- post-login-path.ts
- adminInventoryFetch
- types/index.ts
- location-input.tsx
- hotels-map-content.tsx
- hotel-detail-availability.tsx
- hotel-filters.tsx
- card.tsx
- dependencies
- signup/page.tsx
- utils.ts
- leaflet-map.tsx
- admin-utils.ts
- firebase.ts
- session/route.ts
- use-hotels.ts
- rates-calendar-manager.tsx
- forgot-password/page.tsx
- direct-hotels-panel.tsx
- billing/page.tsx
- hotel-pricing.ts
- deploy-hosting.mjs
- recaptcha-verify-client.ts
- header.tsx
- login-attempt-guard.ts
- hotel/[hotelId]/page.tsx
- inventory/[hotelId]/calendar/page.tsx
- tickets/route.ts
- next.config.ts
- hotel-admin/[...path]/route.ts
- date-range-calendar.tsx
- getFirebaseAuthUserMessage
- support-tickets/[id]/route.ts
- react-query.ts
- constants/index.ts
- contact/page.tsx
- sanitize.ts
- class-variance-authority
- clsx
- date-fns
- dompurify
- eslint.config.mjs
- firebase
- firebase-admin
- framer-motion
- @google-cloud/recaptcha-enterprise
- html2canvas
- isomorphic-dompurify
- jose
- jspdf
- leaflet
- lucide-react
- @radix-ui/react-accordion
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-label
- @radix-ui/react-popover
- @radix-ui/react-select
- @radix-ui/react-slot
- react
- react-day-picker
- react-dom
- react-error-boundary
- react-hook-form
- react-leaflet
- sharp
- sonner
- stripe
- @stripe/react-stripe-js
- @stripe/stripe-js
- tailwind-merge
- @tanstack/react-query
- tw-animate-css
- @types/dompurify
- @types/leaflet
- @types/uuid
- uuid
- zod
- zustand
- postcss.config.mjs
- tailwind.config.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 99 edges
2. `Button` - 94 edges
3. `useTranslations()` - 62 edges
4. `getSafeBackendBaseUrl()` - 62 edges
5. `useAuth()` - 59 edges
6. `Input` - 47 edges
7. `AdminLoader()` - 35 edges
8. `getApiHeaders()` - 35 edges
9. `formatAdminDate()` - 34 edges
10. `formatDateLocal()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `HotelListProps` --references--> `Hotel`  [EXTRACTED]
  src/components/hotels/hotel-list.tsx → src/types/index.ts
- `HotelMapPreviewProps` --references--> `Hotel`  [EXTRACTED]
  src/components/hotels/hotel-map-preview.tsx → src/types/index.ts
- `ForgotPasswordContent()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/(auth)/forgot-password/page.tsx → src/components/providers/auth-provider.tsx
- `SuperAdminMessagesPage()` --calls--> `cn()`  [EXTRACTED]
  src/app/admin/messages/page.tsx → src/lib/utils.ts
- `FilterSection()` --calls--> `cn()`  [EXTRACTED]
  src/components/hotels/hotel-filters.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (123 total, 46 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.05
Nodes (56): HotelExtranetChrome(), HotelPortalHomePage(), AdminLayout(), isHotelPortalPath(), AuthContinueContent(), GuestHotelMessagesPage(), MfaSettingsPage(), SettingsPage() (+48 more)

### Community 1 - "payment-form.tsx"
Cohesion: 0.05
Nodes (51): dynamic, GET(), convertRapidApiHotelToEtb(), fetchEtbPerUsd(), GET(), CancelContent(), MpgsCheckoutContent(), Window (+43 more)

### Community 2 - "locale-provider.tsx"
Cohesion: 0.05
Nodes (45): metadata, CATEGORY_ORDER, HelpPage(), SERVICE_ORDER, htmlLang(), metadata, RootLayout(), viewport (+37 more)

### Community 3 - "hotelAdminFetch"
Cohesion: 0.06
Nodes (44): HotelExtrasPricingPage(), FacilitiesInner(), CATEGORIES, Photo, PhotosInner(), RoomType, EMPTY, HotelPoliciesPage() (+36 more)

### Community 4 - "getApiHeaders"
Cohesion: 0.10
Nodes (37): GET(), cache, FALLBACK_PRESETS, GET(), GET(), GET(), GET(), GET() (+29 more)

### Community 5 - "en/index.ts"
Cohesion: 0.06
Nodes (26): aboutAm, bookingFlowAm, bookingUiAm, conferencesAm, contactAm, flightSearchAm, helpAm, hotelDetailAm (+18 more)

### Community 6 - "devDependencies"
Cohesion: 0.04
Nodes (47): eslint, eslint-config-next, jsdom, devDependencies, eslint, eslint-config-next, jsdom, tailwindcss (+39 more)

### Community 7 - "my-trips-list.tsx"
Cohesion: 0.09
Nodes (28): CustomerDashboard(), ProfilePage(), TripsPage(), AccountNav(), links, AccountOverviewStats(), AccountShell(), AccountShellProps (+20 more)

### Community 8 - "getSafeBackendBaseUrl"
Cohesion: 0.12
Nodes (29): GET(), GET(), POST(), GET(), PUT(), GET(), POST(), Ctx (+21 more)

### Community 9 - "strapi-server.ts"
Cohesion: 0.11
Nodes (33): ALLOWED, dynamic, POST(), dynamic, GET(), mergePopulate(), POST(), POST() (+25 more)

### Community 10 - "(bookings)/hotels/page.tsx"
Cohesion: 0.18
Nodes (20): AdminDateField(), HotelsPageContent(), formatShortDate(), HotelDetailBookingSidebar(), HotelDetailBookingSidebarProps, HotelSearchForm(), HotelSearchFormProps, BulkCalendarEdit() (+12 more)

### Community 11 - "admin-loader.tsx"
Cohesion: 0.13
Nodes (24): CommissionInvoice, Overview, HotelStatementPage(), resultBadge(), Statement, StatementRow, Tx, AdminStatementInner() (+16 more)

### Community 12 - "admin/conferences/page.tsx"
Cohesion: 0.13
Nodes (21): AdminConferencesPage(), fmtDate(), AdminFlightsPage(), fmtDate(), AdminHotelsPage(), AdminShuttlesPage(), ALLOWED_MIME, dynamic (+13 more)

### Community 13 - "button.tsx"
Cohesion: 0.19
Nodes (16): emptyForm(), HotelConferenceHall, HotelConferencesPage(), HotelForm, STEPS, ShuttleFormProps, Props, ProfileBackendSection() (+8 more)

### Community 14 - "assert-hotel-portal.ts"
Cohesion: 0.15
Nodes (23): clientIp(), isAllowedOrigin(), POST(), runtime, normalizeEmail(), POST(), assertHotelPortalAccess(), HotelPortalAuthError (+15 more)

### Community 15 - "booking-modal.tsx"
Cohesion: 0.10
Nodes (23): ApiItem, ShuttleProduct, ShuttlesPageContent(), AdContainer(), BookingFormData, BookingModal(), BookingModalProps, COUNTRIES (+15 more)

### Community 16 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 17 - "verifyFirebaseIdToken"
Cohesion: 0.16
Nodes (16): GET(), POST(), POST(), POST(), POST(), GET(), GET(), PATCH() (+8 more)

### Community 18 - "hotel-partner-kyc.ts"
Cohesion: 0.13
Nodes (24): PartnerPendingPage(), HotelPartnerRequestForm(), AssignHotelAdminModal(), authHeaders(), HotelOption, Props, HotelPartnerRequests(), HotelPartnerReviewModal() (+16 more)

### Community 19 - "cn"
Cohesion: 0.12
Nodes (24): Props, SignupStepRail(), HotelFAQ(), HotelFAQProps, AccordionContent, AccordionItem, AccordionTrigger, DropdownMenuCheckboxItem (+16 more)

### Community 20 - "flight-booking-modal.tsx"
Cohesion: 0.11
Nodes (24): COUNTRIES, Country, FlightBookingFormData, FlightBookingModal(), FlightBookingModalProps, flightBookingSchema, PaymentFormProps, BookingReceiptDetails (+16 more)

### Community 21 - "reservations-inner.tsx"
Cohesion: 0.20
Nodes (21): BookingRow, HotelReservationsPage(), AdminReservationsInner(), PortfolioResponse, toDetail(), AdminPeriodRangeFilter(), Props, commissionCell() (+13 more)

### Community 22 - "rooms-manager.tsx"
Cohesion: 0.17
Nodes (20): AdvancedRoomForm(), Props, invFetch(), Props, RoomsManager(), RoomType, formatMoney(), AdvancedRoomFormState (+12 more)

### Community 23 - "useTranslations"
Cohesion: 0.14
Nodes (19): HotelDetailPageInner(), HotelReservePage(), ReserveInner(), ConferencesPage(), HotelReserveDraft, FlightDetails(), FlightDetailsProps, HotelDetailAbout() (+11 more)

### Community 24 - "auth-provider.tsx"
Cohesion: 0.18
Nodes (19): AuthContext, AuthProvider(), postSessionCookie(), Window, parseHotelPartnerStatus(), useUserProfile(), parseUserRole(), clearAuthRelatedSessionStorage() (+11 more)

### Community 25 - "[hotelId]/shuttles/page.tsx"
Cohesion: 0.14
Nodes (19): emptyForm(), HotelShuttle, HotelShuttlesPage(), TransactionsPage(), KycDocUploader(), Props, ShuttleForm(), HotelImageUploader() (+11 more)

### Community 26 - "recaptcha-enterprise-assessment.ts"
Cohesion: 0.17
Nodes (19): ALLOWED_ANNOTATIONS, ALLOWED_REASONS, POST(), runtime, POST(), runtime, ALLOWED_RECAPTCHA_ACTIONS, RecaptchaAnnotateReason (+11 more)

### Community 27 - "promo-sections.tsx"
Cohesion: 0.15
Nodes (14): DESTINATION_IMAGES, PopularDestinationsTabs(), HeroSlider(), HeroSliderProps, slides, destinations, EXPLORE_ETHIOPIA_DESTINATIONS, ExploreEthiopia() (+6 more)

### Community 28 - "(bookings)/flights/page.tsx"
Cohesion: 0.15
Nodes (17): cabinClassLabel(), FlightsPageContent(), getLocationName(), LOCATION_NAME_MAPPING, SeatMap(), SeatMapProps, FlightRouteSelect, FlightRouteSelect() (+9 more)

### Community 29 - "hotel-reservation-detail-sheet.tsx"
Cohesion: 0.15
Nodes (15): HotelReservationDetailSheet(), Props, FLEXIBILITY_META, FlexibilityCode, HotelBookingIndustrySnapshot, MEAL_ALIASES, MEAL_PLAN_OPTIONS, MealPlanCode (+7 more)

### Community 30 - "reset-password/page.tsx"
Cohesion: 0.16
Nodes (15): ResetPasswordForm(), activeBarClass(), PasswordStrengthMeter(), Props, COMMON_PASSWORDS, getPasswordStrengthMeter(), PASSWORD_MIN_LENGTH, PASSWORD_POLICY_HINT (+7 more)

### Community 31 - "hotel-booking-summary.tsx"
Cohesion: 0.21
Nodes (16): empty(), HotelPromotionsPage(), HotelBookingSummary(), nightsBetween(), Props, buildStayCodes(), rateSegmentFromBookingType(), cryptoRandom() (+8 more)

### Community 32 - "AdminLoader"
Cohesion: 0.15
Nodes (12): AdminDashboard(), BREAKDOWN_COLORS, changeLabel(), DashboardData, formatCompact(), formatMoney(), METHOD_COLORS, RangeKey (+4 more)

### Community 33 - "signin/page.tsx"
Cohesion: 0.20
Nodes (12): SignInContent(), SignUpContent(), buildAuthContinueHref(), getSignInMethodsForEmail(), isGoogleOnlySignIn(), isMfaSignInRequiredError(), MfaSignInRequiredError, executeRecaptchaEnterprise() (+4 more)

### Community 34 - "admin-finance-filters.tsx"
Cohesion: 0.16
Nodes (14): AdminFinanceFilters(), FinanceStatusFilter, HotelOption, Props, useTheme(), AppearanceThemeSection(), SelectContent, SelectItem (+6 more)

### Community 35 - "admin-cms-client.ts"
Cohesion: 0.21
Nodes (14): ConferenceForm(), ConferenceFormProps, FlightForm(), FlightFormProps, commonFacilities, GalleryItem, HotelForm(), HotelFormProps (+6 more)

### Community 36 - "searchWidget.tsx"
Cohesion: 0.13
Nodes (19): formatTimeDisplay(), GuestSelector, SearchWidget(), TABS, TabType, TravelerCabinSelector, HotelDetailHeaderProps, SavedToTripPopover() (+11 more)

### Community 37 - "post-login-path.ts"
Cohesion: 0.21
Nodes (15): BROWSE_PATH_PREFIXES, canEnterAdminPath(), defaultHomeForRole(), getPostLoginPath(), isHotelMessagesPath(), shouldHonorPostLoginRedirect(), isAppLocale(), getSafeAppRedirectPath() (+7 more)

### Community 38 - "adminInventoryFetch"
Cohesion: 0.17
Nodes (10): Hotel, InventoryHotelOverviewPage(), PropertyInner(), HotelRow, SuperAdminMessagesPage(), DisputedReviewRow, DisputedReviewsPanel(), InventoryHotelNav() (+2 more)

### Community 39 - "types/index.ts"
Cohesion: 0.21
Nodes (12): HotelCard(), HotelCardProps, HotelCollection(), HotelCollectionProps, HotelInventoryBadge(), isBookaddisBookableHotel(), FEATURED_HOTELS, Booking (+4 more)

### Community 40 - "location-input.tsx"
Cohesion: 0.17
Nodes (13): LocationInputProps, HOTEL_LOCATION_PRESETS, LOCATION_PRESETS, ApiResponse, Flight, HotelFilters, HotelSearchResponse, LocationSuggestion (+5 more)

### Community 41 - "hotels-map-content.tsx"
Cohesion: 0.22
Nodes (11): dynamic, buildHighlightHotelFromParamsKey(), dedupeHotels(), HotelsMapContent(), useHotelsInfinite(), DEFAULT_HOTEL_DESTINATION_QUERY, buildHotelsListUrlAfterClosingMap(), destinationQueryFromUrlParams() (+3 more)

### Community 42 - "hotel-detail-availability.tsx"
Cohesion: 0.23
Nodes (13): DirectOffer, HotelBookSelection, HotelDetailAvailability(), HotelDetailAvailabilityProps, inferBedCount(), offerFitsTravelers(), paymentLabel(), safeRoomName() (+5 more)

### Community 43 - "hotel-filters.tsx"
Cohesion: 0.17
Nodes (12): HotelFilterBar(), HotelFilterBarProps, FilterSection(), FilterSectionProps, HotelFilters(), HotelFiltersProps, UseHotelsInfiniteOptions, UseHotelsInfiniteParams (+4 more)

### Community 44 - "card.tsx"
Cohesion: 0.21
Nodes (9): Props, FlightCardSkeleton(), HotelCardSkeleton(), HotelList(), HotelListProps, Card(), CardProps, cn() (+1 more)

### Community 45 - "dependencies"
Cohesion: 0.15
Nodes (13): axios, @hookform/resolvers, next, dependencies, axios, @hookform/resolvers, next, @paypal/react-paypal-js (+5 more)

### Community 46 - "signup/page.tsx"
Cohesion: 0.18
Nodes (7): GUEST_STEPS, HOTEL_STEPS, InputProps, PasswordInput, RECAPTCHA_ACTIONS, RecaptchaAction, RegisterAccountType

### Community 47 - "utils.ts"
Cohesion: 0.31
Nodes (8): AdSidebar(), Props, SponsoredUnit(), TONE, AdConfig, AdContainerProps, AdSidebarProps, AdTone

### Community 48 - "leaflet-map.tsx"
Cohesion: 0.21
Nodes (8): HotelMapPreview(), HotelMapPreviewProps, LeafletMap, LeafletMap, createPriceIcon(), LeafletMap(), LeafletMapProps, PriceMarker

### Community 49 - "admin-utils.ts"
Cohesion: 0.26
Nodes (10): ADMIN_STATUS, AdminStatus, canAccessHotelPortal(), canAccessSuperAdmin(), getAdminStatus(), getAdminStatusMessage(), isAdminApproved(), isAdminBlocked() (+2 more)

### Community 50 - "firebase.ts"
Cohesion: 0.23
Nodes (6): AdminSupportInner(), statusBadge(), statusLabel(), firebaseConfig, resolveFirestoreDatabaseId(), SupportTicketStatus

### Community 51 - "session/route.ts"
Cohesion: 0.32
Nodes (10): clearSessionCookie(), DELETE(), POST(), Entry, failStore, getClientIpFromHeaders(), isAuthSessionIpBlocked(), pruneFails() (+2 more)

### Community 52 - "use-hotels.ts"
Cohesion: 0.36
Nodes (8): FeaturedHotels(), HomesGuestsLoveSection(), PerfectStaySection(), useHotels(), UseHotelsQueryOptions, mergeHotelSearchLocation(), optimizeHotelImageUrl(), useTripStore

### Community 53 - "rates-calendar-manager.tsx"
Cohesion: 0.29
Nodes (8): CalendarDay, invFetch(), monthRange(), RatesCalendarManager(), RoomType, shiftMonth(), weekday(), formatAdminMonth()

### Community 54 - "forgot-password/page.tsx"
Cohesion: 0.22
Nodes (7): ForgotPasswordContent(), forgotPasswordSchema, ForgotPasswordValues, FormField(), FormFieldProps, AuthLayout(), AuthLayoutProps

### Community 55 - "direct-hotels-panel.tsx"
Cohesion: 0.29
Nodes (7): authHeaders(), DirectHotelRow, DirectHotelsPanel(), statusBadge(), getHotelVerification(), HotelVerification, hotelVerificationReady()

### Community 56 - "billing/page.tsx"
Cohesion: 0.29
Nodes (9): CommissionInvoice, CommissionOutstanding, copyRef(), formatPeriod(), HotelBillingPage(), Overview, PayoutProfile, statementHref() (+1 more)

### Community 57 - "hotel-pricing.ts"
Cohesion: 0.27
Nodes (9): breakdownPrice(), clampPct(), DEFAULT_PRICING, normalizeCurrency(), normalizePricing(), PriceBreakdown, PricingCurrency, PricingSettings (+1 more)

### Community 58 - "deploy-hosting.mjs"
Cohesion: 0.22
Nodes (7): env, fbPath, json, original, rapidKey, root, strapiToken

### Community 59 - "recaptcha-verify-client.ts"
Cohesion: 0.31
Nodes (8): MfaSignInPanel(), annotateRecaptchaAssessmentWithApi(), clearRecaptchaAssessment(), peekRecaptchaAssessment(), StoredAssessment, storeRecaptchaAssessment(), VerifyRecaptchaApiResult, verifyRecaptchaEnterpriseWithApi()

### Community 60 - "header.tsx"
Cohesion: 0.42
Nodes (7): SignInPromo(), Header(), HeaderLanguageSwitch(), UserMenu(), UserMenuProps, canAccessAdmin(), buildSignInHref()

### Community 61 - "login-attempt-guard.ts"
Cohesion: 0.42
Nodes (8): assertEmailLoginAllowed(), clearEmailLoginGuard(), formatWait(), GuardState, key(), readState(), recordEmailLoginFailure(), writeState()

### Community 62 - "hotel/[hotelId]/page.tsx"
Cohesion: 0.29
Nodes (7): AdminFinancePage(), formatPeriod(), Dashboard, HotelDashboardPage(), TimelineItem, HotelTransactionsPage(), formatAdminDateTime()

### Community 63 - "inventory/[hotelId]/calendar/page.tsx"
Cohesion: 0.36
Nodes (3): BookAddisLiveNote(), Props, useHotelPortalOptional()

### Community 64 - "tickets/route.ts"
Cohesion: 0.46
Nodes (7): GET(), getStore(), makeId(), nowIso(), POST(), proxyToBackend(), requireSignedIn()

### Community 65 - "next.config.ts"
Cohesion: 0.38
Nodes (5): buildContentSecurityPolicy(), MPGS_GATEWAY_ORIGINS, nextConfig, resolveFirebaseAuthFrameOrigins(), resolveMpgsGatewayOrigins()

### Community 66 - "hotel-admin/[...path]/route.ts"
Cohesion: 0.43
Nodes (7): Ctx, DELETE(), GET(), PATCH(), POST(), proxy(), PUT()

### Community 67 - "date-range-calendar.tsx"
Cohesion: 0.38
Nodes (5): DateRangeCalendar(), DateRangeCalendarProps, formatDate(), MONTH_NAMES, parseDate()

### Community 68 - "getFirebaseAuthUserMessage"
Cohesion: 0.52
Nodes (5): codeFrom(), GENERIC_AUTH_FAILURE, getFirebaseAuthUserMessage(), logFirebaseAuthError(), handleAuthError()

### Community 69 - "support-tickets/[id]/route.ts"
Cohesion: 0.29
Nodes (9): getStore(), nowIso(), PATCH(), proxyToBackend(), readPatchBody(), GET(), getStore(), proxyToBackend() (+1 more)

### Community 70 - "react-query.ts"
Cohesion: 0.40
Nodes (3): queryClient, queryConfig, queryKeys

### Community 71 - "constants/index.ts"
Cohesion: 0.47
Nodes (3): APP_CONSTANTS, clearAuthCookie(), deleteAuthCookie()

## Knowledge Gaps
- **397 isolated node(s):** `AdminSidebarProps`, `Props`, `Ctx`, `PortalHotel`, `Props` (+392 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **46 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button` connect `button.tsx` to `useAuth`, `payment-form.tsx`, `locale-provider.tsx`, `hotelAdminFetch`, `my-trips-list.tsx`, `(bookings)/hotels/page.tsx`, `admin-loader.tsx`, `admin/conferences/page.tsx`, `booking-modal.tsx`, `hotel-partner-kyc.ts`, `cn`, `flight-booking-modal.tsx`, `reservations-inner.tsx`, `rooms-manager.tsx`, `useTranslations`, `[hotelId]/shuttles/page.tsx`, `promo-sections.tsx`, `(bookings)/flights/page.tsx`, `hotel-reservation-detail-sheet.tsx`, `reset-password/page.tsx`, `hotel-booking-summary.tsx`, `AdminLoader`, `signin/page.tsx`, `admin-finance-filters.tsx`, `admin-cms-client.ts`, `searchWidget.tsx`, `adminInventoryFetch`, `types/index.ts`, `hotels-map-content.tsx`, `hotel-detail-availability.tsx`, `signup/page.tsx`, `leaflet-map.tsx`, `firebase.ts`, `rates-calendar-manager.tsx`, `forgot-password/page.tsx`, `direct-hotels-panel.tsx`, `billing/page.tsx`, `header.tsx`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `useAuth`, `payment-form.tsx`, `(bookings)/hotels/page.tsx`, `admin-loader.tsx`, `admin/conferences/page.tsx`, `button.tsx`, `booking-modal.tsx`, `hotel-partner-kyc.ts`, `reservations-inner.tsx`, `promo-sections.tsx`, `(bookings)/flights/page.tsx`, `reset-password/page.tsx`, `hotel-booking-summary.tsx`, `signin/page.tsx`, `admin-finance-filters.tsx`, `searchWidget.tsx`, `adminInventoryFetch`, `location-input.tsx`, `hotel-filters.tsx`, `card.tsx`, `signup/page.tsx`, `utils.ts`, `firebase.ts`, `billing/page.tsx`, `hotel/[hotelId]/page.tsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `getSafeBackendBaseUrl()` connect `getSafeBackendBaseUrl` to `tickets/route.ts`, `payment-form.tsx`, `hotel-admin/[...path]/route.ts`, `support-tickets/[id]/route.ts`, `strapi-server.ts`, `assert-hotel-portal.ts`, `verifyFirebaseIdToken`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `AdminSidebarProps`, `Props`, `Ctx` to the rest of the system?**
  _397 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.05246913580246913 - nodes in this community are weakly interconnected._
- **Should `payment-form.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.054414414414414414 - nodes in this community are weakly interconnected._
- **Should `locale-provider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05336951605608322 - nodes in this community are weakly interconnected._