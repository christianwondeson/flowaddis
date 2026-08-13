'use client'

import type { MultiFactorResolver } from 'firebase/auth'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Preloader } from '@/components/ui/preloader'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useAuth } from '@/components/providers/auth-provider'
import type { HotelPartnerKyc, RegisterAccountType, UserRole } from '@/types/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/layout/auth-layout'
import { FormField } from '@/components/auth/form-field'
import {
    validatePasswordStrength,
    PASSWORD_POLICY_HINT,
} from '@/lib/password-policy'
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter'
import {
    executeRecaptchaEnterprise,
    getRecaptchaEnterpriseSiteKey,
} from '@/lib/recaptcha-enterprise'
import {
    annotateRecaptchaAssessmentWithApi,
    verifyRecaptchaEnterpriseWithApi,
} from '@/lib/recaptcha-verify-client'
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha-actions'
import { getPostLoginPath } from '@/lib/auth/post-login-path'
import { isMfaSignInRequiredError } from '@/lib/mfa-sign-in-error'
import { MfaSignInPanel } from '@/components/auth/mfa-sign-in-panel'
import { SignupStepRail } from '@/components/auth/signup-step-rail'
import { BillingPlanPicker } from '@/components/auth/billing-plan-picker'
import { KycDocUploader } from '@/components/account/kyc-doc-uploader'
import {
    getBillingPlan,
    isBillingPlanCode,
    type BillingPlanCode,
} from '@/lib/billing-plans'
import {
    omitUndefinedDeep,
    validateHotelPayoutFields,
    validateHotelPropertyFields,
} from '@/lib/hotel-partner-kyc'
import { auth, db } from '@/lib/firebase'
import { Building2, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/react-query'

const GUEST_STEPS = ['Account type', 'Your details', 'Create'] as const
const HOTEL_STEPS = [
    'Account type',
    'Choose plan',
    'Login details',
    'Property & legal',
    'KYC documents',
    'Payout',
    'Review',
] as const

function SignUpContent() {
    const searchParams = useSearchParams()
    const initialType = searchParams.get('type')
    const initialPlan = searchParams.get('plan')

    const [step, setStep] = useState(0)
    const [accountType, setAccountType] = useState<RegisterAccountType>(() =>
        initialType === 'hotel_partner' ? 'hotel_partner' : 'guest',
    )
    const [planCode, setPlanCode] = useState<BillingPlanCode>(() =>
        isBillingPlanCode(String(initialPlan || ''))
            ? (String(initialPlan) as BillingPlanCode)
            : 'starter',
    )

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [referralCode, setReferralCode] = useState('')

    const [legalBusinessName, setLegalBusinessName] = useState('')
    const [hotelName, setHotelName] = useState('')
    const [city, setCity] = useState('')
    const [businessAddress, setBusinessAddress] = useState('')
    const [phone, setPhone] = useState('')
    const [tin, setTin] = useState('')
    const [regNumber, setRegNumber] = useState('')
    const [ownershipRole, setOwnershipRole] = useState('owner')
    const [roomCount, setRoomCount] = useState('')
    const [message, setMessage] = useState('')
    const [logoUrl, setLogoUrl] = useState('')
    const [licenseUrl, setLicenseUrl] = useState('')
    const [taxUrl, setTaxUrl] = useState('')
    const [ownerIdUrl, setOwnerIdUrl] = useState('')
    const [accountName, setAccountName] = useState('')
    const [cbeAccount, setCbeAccount] = useState('')
    const [bankName, setBankName] = useState('')
    const [accountNumber, setAccountNumber] = useState('')
    const [ackBilling, setAckBilling] = useState(false)

    const [accountReady, setAccountReady] = useState(false)
    const [loading, setLoading] = useState(false)
    const [googleSubmitting, setGoogleSubmitting] = useState(false)
    const [recaptchaSolved, setRecaptchaSolved] = useState(false)
    const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null)

    const {
        user,
        register,
        sendVerificationEmail,
        loginWithGoogle,
        renderRecaptcha,
        clearRecaptcha,
        logout,
    } = useAuth()
    const router = useRouter()
    const queryClient = useQueryClient()

    const steps = accountType === 'hotel_partner' ? HOTEL_STEPS : GUEST_STEPS
    const selectedPlan = useMemo(() => getBillingPlan(planCode), [planCode])

    /** Resume hotel KYC if user already has a draft account. */
    useEffect(() => {
        if (!user) return
        if (user.hotelPartnerStatus === 'draft') {
            setAccountType('hotel_partner')
            setAccountReady(true)
            if (user.hotelPartnerRequest?.preferredPlanCode &&
                isBillingPlanCode(user.hotelPartnerRequest.preferredPlanCode)) {
                setPlanCode(user.hotelPartnerRequest.preferredPlanCode)
            }
            setStep(3)
            if (user.name) setName(user.name)
            if (user.email) setEmail(user.email)
            if (user.hotelPartnerRequest?.hotelName &&
                user.hotelPartnerRequest.hotelName !== 'Draft application') {
                setHotelName(user.hotelPartnerRequest.hotelName)
            }
            if (user.hotelPartnerRequest?.city) setCity(user.hotelPartnerRequest.city)
            if (user.hotelPartnerRequest?.phone) setPhone(user.hotelPartnerRequest.phone)
        } else if (user.hotelPartnerStatus === 'pending') {
            router.replace('/partner/pending')
        }
    }, [user, router])

    useEffect(() => {
        if (accountType === 'hotel_partner' && accountReady) return
        if (step !== (accountType === 'guest' ? 2 : 2)) return
        let cancelled = false
        setRecaptchaSolved(false)
        void renderRecaptcha('recaptcha-container', 'normal', () => {
            if (!cancelled) setRecaptchaSolved(true)
        })
        return () => {
            cancelled = true
            clearRecaptcha()
            setRecaptchaSolved(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, accountType, accountReady, clearRecaptcha])

    const pushAfterGoogleSignUp = (role: UserRole) => {
        router.replace(getPostLoginPath(role, '/'))
    }

    const verifyEnterprise = async () => {
        if (!getRecaptchaEnterpriseSiteKey()) return true
        let enterpriseToken: string | undefined
        try {
            enterpriseToken = await executeRecaptchaEnterprise(RECAPTCHA_ACTIONS.SIGNUP)
        } catch {
            toast.error(
                'Security verification failed. Check your BookAddis site key, refresh, and try again.',
            )
            return false
        }
        if (!enterpriseToken) {
            toast.error('Security verification failed. Refresh the page and try again.')
            return false
        }
        const accountId = email.trim().toLowerCase()
        const verified = await verifyRecaptchaEnterpriseWithApi(
            enterpriseToken,
            RECAPTCHA_ACTIONS.SIGNUP,
            { email: accountId, accountId },
        )
        if (!verified.ok) {
            toast.error(verified.reason || 'Verification failed. Please try again.')
            return false
        }
        return true
    }

    const establishSession = async () => {
        try {
            const { auth } = await import('@/lib/firebase')
            const token = await auth?.currentUser?.getIdToken(true)
            if (token) {
                await fetch('/api/auth/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                })
            }
        } catch {
            /* continue */
        }
    }

    const validateCredentials = () => {
        if (!name.trim() || name.trim().length < 2) {
            toast.error('Full name is required')
            return false
        }
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        if (!emailOk) {
            toast.error('Please enter a valid email')
            return false
        }
        const pw = validatePasswordStrength(password)
        if (!pw.ok) {
            toast.error(pw.message)
            return false
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return false
        }
        return true
    }

    const validatePropertyStep = () => {
        const result = validateHotelPropertyFields({
            legalBusinessName,
            hotelName,
            tin,
            regNumber,
            city,
            phone,
            businessAddress,
            roomCount,
        })
        if (!result.ok) {
            toast.error(result.message || 'Complete all property & legal fields')
            return null
        }
        return result
    }

    const validatePayoutStep = () => {
        const result = validateHotelPayoutFields({
            accountName,
            cbeAccount,
            bankName,
            accountNumber,
        })
        if (!result.ok) {
            toast.error(result.message || 'Complete payout details')
            return null
        }
        return result
    }

    const createGuestAccount = async () => {
        if (!validateCredentials()) return
        if (!recaptchaSolved) {
            toast.error('Please verify that you are not a robot.')
            return
        }
        if (!(await verifyEnterprise())) return

        setLoading(true)
        try {
            await register(name, email, password, {
                accountType: 'guest',
                referralCode: referralCode.trim() || undefined,
            })
            void sendVerificationEmail()
            void annotateRecaptchaAssessmentWithApi({
                annotation: 'LEGITIMATE',
                accountId: email.trim().toLowerCase(),
                clearStored: true,
            })
            await establishSession()
            toast.success('Account created! Please check your email to verify.')
            router.replace(
                `/auth/continue?redirect=${encodeURIComponent('/dashboard')}`,
            )
        } catch (error: unknown) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred during registration.',
            )
        } finally {
            setLoading(false)
        }
    }

    const createHotelDraftAccount = async () => {
        if (!validateCredentials()) return
        if (!recaptchaSolved) {
            toast.error('Please verify that you are not a robot.')
            return
        }
        if (!(await verifyEnterprise())) return

        setLoading(true)
        try {
            await register(name, email, password, {
                accountType: 'hotel_partner',
                hotelPartner: {
                    asDraft: true,
                    preferredPlanCode: planCode,
                    hotelName: 'Draft application',
                },
            })
            void sendVerificationEmail()
            void annotateRecaptchaAssessmentWithApi({
                annotation: 'LEGITIMATE',
                accountId: email.trim().toLowerCase(),
                clearStored: true,
            })
            await establishSession()
            setAccountReady(true)
            setStep(3)
            toast.success('Account created  continue with property & KYC documents.')
        } catch (error: unknown) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred during registration.',
            )
        } finally {
            setLoading(false)
        }
    }

    const submitHotelApplication = async () => {
        const uid = auth?.currentUser?.uid || user?.id
        if (!db || !uid) {
            toast.error(
                'Sign in required to submit documents. Go back to Login details if your session expired.',
            )
            return
        }
        if (!ackBilling) {
            toast.error('Please acknowledge the SaaS subscription terms')
                return
            }
        const property = validatePropertyStep()
        if (!property) {
            setStep(3)
                return
            }
        if (!logoUrl || !licenseUrl || !taxUrl || !ownerIdUrl) {
            toast.error('Upload all required KYC documents')
            setStep(4)
                return
            }
        const payout = validatePayoutStep()
        if (!payout) {
            setStep(5)
            return
        }

        setLoading(true)
        try {
            const contactEmail =
                user?.email || auth?.currentUser?.email || email.trim()
            const kyc: HotelPartnerKyc = omitUndefinedDeep({
                legalBusinessName: legalBusinessName.trim(),
                tradeName: hotelName.trim(),
                businessRegistrationNumber: regNumber.trim(),
                tin: property.tin!,
                businessAddress: businessAddress.trim(),
                city: city.trim(),
                country: 'ET',
                contactPhone: property.phone!,
                contactEmail: contactEmail || undefined,
                logoUrl,
                businessLicenseUrl: licenseUrl,
                taxCertificateUrl: taxUrl,
                ownerIdUrl,
                ownershipRole,
                declaredRoomCount: Number(roomCount),
                payoutDraft: omitUndefinedDeep({
                    accountName: accountName.trim(),
                    cbeAccount: payout.cbeAccount!,
                    bankName: bankName.trim(),
                    accountNumber: payout.accountNumber,
                }),
                acknowledgedSaaSBilling: true,
            })
            await updateDoc(
                doc(db, 'users', uid),
                omitUndefinedDeep({
                    hotelPartnerStatus: 'pending',
                    role: 'user',
                    hotelPartnerRequest: {
                        hotelName: hotelName.trim(),
                        city: city.trim() || null,
                        phone: property.phone || null,
                        message: message.trim() || null,
                        preferredPlanCode: planCode,
                        kyc,
                        submittedAt: serverTimestamp(),
                    },
                    updatedAt: serverTimestamp(),
                }),
            )
            await queryClient.invalidateQueries({ queryKey: queryKeys.user.all })
            toast.success(
                'Submitted for Super Admin review. Hotel Portal stays locked until approval.',
            )
            // Leave portal-facing session: they wait for email, then sign in after approve.
            try {
                await logout()
            } catch {
                /* still navigate */
            }
            router.replace('/partner/pending')
        } catch (err) {
            console.error(err)
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Could not submit application  check you are online and try again.',
            )
        } finally {
            setLoading(false)
        }
    }

    const goNext = () => {
        if (accountType === 'guest') {
            if (step === 0) {
                setStep(1)
                return
            }
            if (step === 1) {
                if (!validateCredentials()) return
                setStep(2)
                return
            }
            void createGuestAccount()
            return
        }

        // hotel
        if (step === 0) {
            setStep(1)
            return
        }
        if (step === 1) {
            setStep(2)
            return
        }
        if (step === 2) {
            if (accountReady) {
                setStep(3)
                return
            }
            void createHotelDraftAccount()
            return
        }
        if (step === 3) {
            if (!validatePropertyStep()) return
            setStep(4)
            return
        }
        if (step === 4) {
            if (!logoUrl || !licenseUrl || !taxUrl || !ownerIdUrl) {
                toast.error('Upload logo, license, tax certificate, and owner ID')
                return
            }
            setStep(5)
            return
        }
        if (step === 5) {
            if (!validatePayoutStep()) return
            setStep(6)
            return
        }
        void submitHotelApplication()
    }

    const goBack = () => {
        if (accountType === 'hotel_partner' && accountReady && step === 3) {
            toast.message('Account already created  finish KYC to submit.')
            return
        }
        setStep((s) => Math.max(0, s - 1))
    }

    const handleGoogleSignUp = async () => {
        setGoogleSubmitting(true)
        try {
            const role = await loginWithGoogle()
            if (accountType === 'hotel_partner') {
                toast.success(
                    'Signed in with Google  choose a plan and finish hotel KYC on Profile.',
                )
                router.replace('/profile')
                return
            }
            toast.success('Welcome to BookAddis!')
            pushAfterGoogleSignUp(role)
        } catch (error: unknown) {
            if (isMfaSignInRequiredError(error)) {
                setMfaResolver(error.resolver)
                return
            }
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred during sign-up.',
            )
        } finally {
            setGoogleSubmitting(false)
        }
    }

    if (mfaResolver) {
        return (
            <AuthLayout title="Two-step verification" subtitle="Complete sign-up with your phone">
                <MfaSignInPanel
                    resolver={mfaResolver}
                    onSuccess={(role) => {
                        void annotateRecaptchaAssessmentWithApi({
                            annotation: 'LEGITIMATE',
                            reasons: ['PASSED_TWO_FACTOR'],
                            clearStored: true,
                        })
                        setMfaResolver(null)
                        toast.success('Welcome to BookAddis!')
                        pushAfterGoogleSignUp(role)
                    }}
                    onCancel={() => setMfaResolver(null)}
                />
            </AuthLayout>
        )
    }

    const primaryLabel = (() => {
        if (loading) return 'Please wait…'
        if (accountType === 'guest') {
            return step < 2 ? 'Continue' : 'Create guest account'
        }
        if (step === 2 && !accountReady) return 'Create account & continue'
        if (step === 6) return 'Submit for approval'
        return 'Continue'
    })()

    return (
        <AuthLayout
            wide
            title="Create Account"
            subtitle={
                accountType === 'hotel_partner'
                    ? 'Stepped partner signup: plan → account → KYC → payout → review'
                    : 'Book stays as a guest in a few short steps'
            }
            footerLink={{
                text: 'Already have an account?',
                href: '/signin',
                linkText: 'Sign In',
            }}
        >
            <div className="space-y-5">
                <SignupStepRail steps={steps} current={step} />

                {step === 0 && (
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-900">I want to</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setAccountType('guest')
                                    setAccountReady(false)
                                }}
                                className={cn(
                                    'flex items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                                    accountType === 'guest'
                                        ? 'border-brand-primary bg-brand-primary/5'
                                        : 'border-gray-200 hover:bg-gray-50',
                                )}
                            >
                                <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
                                <span>
                                    <span className="block text-sm font-semibold text-gray-900">
                                        Book as a guest
                                    </span>
                                    <span className="mt-0.5 block text-xs text-gray-500">
                                        Search hotels and complete bookings
                                    </span>
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setAccountType('hotel_partner')}
                                className={cn(
                                    'flex items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                                    accountType === 'hotel_partner'
                                        ? 'border-brand-primary bg-brand-primary/5'
                                        : 'border-gray-200 hover:bg-gray-50',
                                )}
                            >
                                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
                                <span>
                                    <span className="block text-sm font-semibold text-gray-900">
                                        List my hotel
                                    </span>
                                    <span className="mt-0.5 block text-xs text-gray-500">
                                        Choose a plan → KYC docs → Super Admin review
                                    </span>
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {accountType === 'guest' && step === 1 && (
                    <CredentialsFields
                        name={name}
                        setName={setName}
                        email={email}
                        setEmail={setEmail}
                        password={password}
                        setPassword={setPassword}
                        confirmPassword={confirmPassword}
                        setConfirmPassword={setConfirmPassword}
                        referralCode={referralCode}
                        setReferralCode={setReferralCode}
                        showReferral
                    />
                )}

                {accountType === 'guest' && step === 2 && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Confirm you are not a robot, then create your guest account.
                        </p>
                        <GoogleButton
                            loading={googleSubmitting || loading}
                            onClick={() => void handleGoogleSignUp()}
                        />
                        <div
                            id="recaptcha-container"
                            className="flex justify-center overflow-hidden rounded-lg min-h-[78px]"
                        />
                    </div>
                )}

                {accountType === 'hotel_partner' && step === 1 && (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-600">
                            Pick the management plan you intend to subscribe to after approval
                            (paid with CBE Birr in Hotel Portal → Billing).
                        </p>
                        <BillingPlanPicker value={planCode} onChange={setPlanCode} />
                    </div>
                )}

                {accountType === 'hotel_partner' && step === 2 && !accountReady && (
                    <div className="space-y-4">
                        <p className="text-xs rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2 text-teal-900">
                            Selected:{' '}
                            <strong>
                                {selectedPlan?.name} ·{' '}
                                {selectedPlan?.priceEtb.toLocaleString()} ETB/mo
                            </strong>
                            . Next steps collect property details and KYC documents.
                        </p>
                        <CredentialsFields
                            name={name}
                            setName={setName}
                            email={email}
                            setEmail={setEmail}
                            password={password}
                            setPassword={setPassword}
                            confirmPassword={confirmPassword}
                            setConfirmPassword={setConfirmPassword}
                        />
                        <GoogleButton
                            loading={googleSubmitting || loading}
                            onClick={() => void handleGoogleSignUp()}
                        />
                        <p className="text-xs text-center text-gray-500">
                            Google sign-in creates a guest profile  finish hotel KYC from Profile.
                        </p>
                        <div
                            id="recaptcha-container"
                            className="flex justify-center overflow-hidden rounded-lg min-h-[78px]"
                        />
                    </div>
                )}

                {accountType === 'hotel_partner' && step === 3 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Legal business name</Label>
                            <Input
                                value={legalBusinessName}
                                onChange={(e) => setLegalBusinessName(e.target.value)}
                                placeholder="As on registration certificate"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Hotel / trade name</Label>
                            <Input
                                value={hotelName}
                                onChange={(e) => setHotelName(e.target.value)}
                                placeholder="e.g. Momona Hotel"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>TIN (10 digits)</Label>
                            <Input
                                value={tin}
                                onChange={(e) => setTin(e.target.value)}
                                inputMode="numeric"
                                autoComplete="off"
                                placeholder="e.g. 0000000000"
                                maxLength={14}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Business registration no.</Label>
                            <Input
                                value={regNumber}
                                onChange={(e) => setRegNumber(e.target.value)}
                                placeholder="As on license"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>City</Label>
                    <Input
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="e.g. Addis Ababa"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact phone</Label>
                            <Input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+2519… or 09…"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Business address</Label>
                            <Input
                                value={businessAddress}
                                onChange={(e) => setBusinessAddress(e.target.value)}
                                placeholder="Street / kebele / building"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Your role</Label>
                            <select
                                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                value={ownershipRole}
                                onChange={(e) => setOwnershipRole(e.target.value)}
                            >
                                <option value="owner">Owner</option>
                                <option value="general_manager">General manager</option>
                                <option value="agent">Authorized agent</option>
                                <option value="reservation_desk">Reservation desk lead</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Declared room count</Label>
                            <Input
                                type="number"
                                min={1}
                                value={roomCount}
                                onChange={(e) => setRoomCount(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {accountType === 'hotel_partner' && step === 4 && (
                    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                        <p className="text-sm font-semibold text-brand-dark">
                            Required documents (KYC)
                        </p>
                        {(
                            [
                                ['Property logo', logoUrl, setLogoUrl, 'Upload logo'],
                                [
                                    'Business license',
                                    licenseUrl,
                                    setLicenseUrl,
                                    'Upload license',
                                ],
                                [
                                    'Tax / TIN certificate',
                                    taxUrl,
                                    setTaxUrl,
                                    'Upload tax certificate',
                                ],
                                [
                                    'Authorized person ID',
                                    ownerIdUrl,
                                    setOwnerIdUrl,
                                    'Upload ID',
                                ],
                            ] as const
                        ).map(([label, url, setUrl, btn]) => (
                            <div key={label} className="space-y-2">
                                <Label>{label}</Label>
                                {url ? (
                                    <p className="text-xs text-green-700 truncate">Uploaded</p>
                                ) : null}
                                <KycDocUploader label={btn} onUploaded={setUrl} />
                            </div>
                        ))}
                    </div>
                )}

                {accountType === 'hotel_partner' && step === 5 && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                            Where BookAddis will send your cut for prepaid guest bookings
                            (later). Separate from the SaaS subscription you pay us.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Account name</Label>
                                <Input
                                    value={accountName}
                                    onChange={(e) => setAccountName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>CBE account (8–16 digits)</Label>
                                <Input
                                    value={cbeAccount}
                                    onChange={(e) => setCbeAccount(e.target.value)}
                                    inputMode="numeric"
                                    placeholder="Commercial Bank of Ethiopia account"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bank name</Label>
                                <Input
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    placeholder="e.g. Commercial Bank of Ethiopia"
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Other account number (optional)</Label>
                                <Input
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    inputMode="numeric"
                                    placeholder="Leave blank if same as CBE"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {accountType === 'hotel_partner' && step === 6 && (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4 text-sm space-y-2">
                            <p className="font-semibold text-brand-dark">Review</p>
                            <p>
                                <strong>{hotelName}</strong>
                                {city ? ` · ${city}` : ''} · Plan{' '}
                                <strong>{selectedPlan?.name}</strong> (
                                {selectedPlan?.priceEtb.toLocaleString()} ETB/mo)
                            </p>
                            <ul className="list-disc pl-5 text-slate-600 space-y-1">
                                <li>
                                    You → BookAddis: SaaS subscription (CBE Birr) after approval
                                </li>
                                <li>
                                    Guests → BookAddis → you: prepaid settlements to your payout
                                    account
                                </li>
                            </ul>
                        </div>
                        <label className="flex items-start gap-3 text-sm cursor-pointer">
                    <input
                        type="checkbox"
                                className="mt-1"
                                checked={ackBilling}
                                onChange={(e) => setAckBilling(e.target.checked)}
                            />
                            <span>
                                I understand access activates only after a validated
                                subscription payment (or Super Admin trial), and guest payouts
                                are separate from SaaS fees.
                            </span>
                        </label>
                        <div className="space-y-2">
                            <Label>Notes for Super Admin</Label>
                            <textarea
                                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="PMS, star rating, existing Booking.com listing…"
                            />
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 justify-between pt-1">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={step === 0 || loading}
                        onClick={goBack}
                        className="rounded-xl"
                    >
                        Back
                    </Button>
                <Button
                        type="button"
                        disabled={
                            loading ||
                            googleSubmitting ||
                            ((accountType === 'guest' && step === 2) ||
                            (accountType === 'hotel_partner' &&
                                step === 2 &&
                                !accountReady)
                                ? !recaptchaSolved
                                : false)
                        }
                        onClick={() => void goNext()}
                        className="rounded-xl min-w-[140px] bg-brand-primary hover:bg-brand-primary/90"
                    >
                        {primaryLabel}
                </Button>
                </div>

                <p className="text-xs text-center text-gray-500">
                    By continuing, you agree to our{' '}
                    <a href="/terms" className="text-brand-primary hover:underline">
                        Terms
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-brand-primary hover:underline">
                        Privacy Policy
                    </a>
                    .
                </p>
            </div>
        </AuthLayout>
    )
}

function CredentialsFields(props: {
    name: string
    setName: (v: string) => void
    email: string
    setEmail: (v: string) => void
    password: string
    setPassword: (v: string) => void
    confirmPassword: string
    setConfirmPassword: (v: string) => void
    referralCode?: string
    setReferralCode?: (v: string) => void
    showReferral?: boolean
}) {
    return (
        <div className="space-y-4">
            <FormField label="Full Name">
                <Input
                    value={props.name}
                    onChange={(e) => props.setName(e.target.value)}
                    placeholder="John Doe"
                />
            </FormField>
            <FormField label="Email Address">
                <Input
                    type="email"
                    value={props.email}
                    onChange={(e) => props.setEmail(e.target.value)}
                    placeholder="name@company.com"
                />
            </FormField>
            <FormField label="Password">
                <p className="text-xs text-gray-600 mb-1.5">{PASSWORD_POLICY_HINT}</p>
                <PasswordInput
                    value={props.password}
                    onChange={(e) => props.setPassword(e.target.value)}
                    placeholder="••••••••"
                />
                <PasswordStrengthMeter password={props.password} className="mt-2" />
            </FormField>
            <FormField label="Confirm Password">
                <PasswordInput
                    value={props.confirmPassword}
                    onChange={(e) => props.setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                />
            </FormField>
            {props.showReferral && props.setReferralCode ? (
                <FormField label="Referral code (optional)">
                    <Input
                        value={props.referralCode || ''}
                        onChange={(e) => props.setReferralCode!(e.target.value)}
                        placeholder="Friend or promo code"
                    />
                </FormField>
            ) : null}
        </div>
    )
}

function GoogleButton({
    loading,
    onClick,
}: {
    loading: boolean
    onClick: () => void
}) {
    return (
        <Button
            type="button"
            variant="outline"
            disabled={loading}
            className="w-full py-2.5 flex items-center justify-center gap-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium bg-transparent rounded-xl"
            onClick={onClick}
        >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-4.3 0-8.01 2.47-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
            </svg>
            <span>{loading ? 'Connecting…' : 'Continue with Google'}</span>
        </Button>
    )
}

export default function SignUpPage() {
    return (
        <Suspense
            fallback={
                <Preloader fullScreen size="lg" label="Loading…" />
            }
        >
            <SignUpContent />
        </Suspense>
    )
}
