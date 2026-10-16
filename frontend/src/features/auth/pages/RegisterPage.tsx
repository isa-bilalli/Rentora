import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Rentora from "../../../assets/rentora-wordmark.svg";
import { ApiError, type FieldErrors } from "../../../lib/api/client";
import { register } from "../api/authApi";
import { useAuth } from "../useAuth";

interface RegisterForm {
    organizationName: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    // Checked in the browser only; never sent.
    confirmPassword: string;
}

const EMPTY_FORM: RegisterForm = {
    organizationName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
};

function RegisterPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState<RegisterForm>(EMPTY_FORM);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

    function update(field: keyof RegisterForm, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
        setFieldErrors((current) => {
            if (!(field in current)) return current;
            const next = { ...current };
            delete next[field];
            return next;
        });
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        if (form.password !== form.confirmPassword) {
            setFieldErrors({ confirmPassword: "Passwords don't match" });
            return;
        }

        setFieldErrors({});
        setIsSubmitting(true);
        try {
            const email = form.email.trim();
            await register({
                organizationName: form.organizationName.trim(),
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email,
                password: form.password,
            });

            try {
                await login({ email, password: form.password });
                navigate("/app/dashboard", { replace: true });
            } catch {
                // The account exists; only the automatic login failed, so offer a normal login instead.
                setRegisteredEmail(email);
            }
        } catch (error) {
            if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
                setFieldErrors(error.fieldErrors);
            } else if (error instanceof ApiError && error.status === 409) {
                // Organization names aren't unique, so a conflict here always means the email is taken.
                setFieldErrors({ email: error.message });
            } else {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Registration failed"
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    const passwordToggle = (
        <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide passwords" : "Show passwords"} aria-pressed={showPassword} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#14302b]/50 transition-colors hover:bg-[#14302b]/5 hover:text-[#14302b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#d4a94f]">
            {showPassword ? (<EyeOff className="h-5 w-5" aria-hidden="true" />) : (<Eye className="h-5 w-5" aria-hidden="true" />)}
        </button>
    );

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#e8e2d6] px-4 py-10">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#14302b]/10 bg-white shadow-xl shadow-[#14302b]/10">
            <div className="h-1.5 w-full bg-[#d4a94f]" aria-hidden="true" />

            <div className="px-6 pb-8 pt-8 sm:px-10">
                <div className="flex flex-col items-center text-center">
                    <img src={Rentora} className="h-10 w-auto" alt="Rentora" />
                    <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#14302b]">
                        {registeredEmail ? "Account created" : "Create your account"}
                    </h1>
                    {!registeredEmail && (
                        <p className="mt-2 text-sm text-gray-500">This also creates your organization.</p>
                    )}
                </div>

                {registeredEmail ? (
                    <div className="mt-8 text-center" role="status">
                        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
                        <p className="mt-4 text-sm text-gray-600">
                            We couldn&apos;t log you in automatically. Log in as{" "}
                            <span className="font-medium text-[#14302b]">{registeredEmail}</span>{" "}
                            to continue.
                        </p>
                        <Link to="/auth/login" className="mt-6 flex w-full items-center justify-center rounded-lg bg-[#14302b] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1f4a41] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f]">
                            Go to login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                        <AuthField id="organizationName" label="Organization name" icon={Building2} value={form.organizationName} onChange={(value) => update("organizationName", value)} error={fieldErrors.organizationName} autoComplete="organization" maxLength={150} />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <AuthField id="firstName" label="First name" icon={User} value={form.firstName} onChange={(value) => update("firstName", value)} error={fieldErrors.firstName} autoComplete="given-name" maxLength={100} />
                            <AuthField id="lastName" label="Last name" icon={User} value={form.lastName} onChange={(value) => update("lastName", value)} error={fieldErrors.lastName} autoComplete="family-name" maxLength={100} />
                        </div>
                        <AuthField id="email" label="Email address" icon={Mail} type="email" value={form.email} onChange={(value) => update("email", value)} error={fieldErrors.email} autoComplete="email" maxLength={255} />
                        <AuthField id="password" label="Password (at least 8 characters)" icon={Lock} type={showPassword ? "text" : "password"} value={form.password} onChange={(value) => update("password", value)} error={fieldErrors.password} autoComplete="new-password" minLength={8} maxLength={100} trailing={passwordToggle} />
                        <AuthField id="confirmPassword" label="Confirm password" icon={Lock} type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(value) => update("confirmPassword", value)} error={fieldErrors.confirmPassword} autoComplete="new-password" maxLength={100} />
                        {error && (<p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>)}
                        <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#14302b] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1f4a41] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] disabled:cursor-not-allowed disabled:opacity-70">
                            {isSubmitting && (<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />)}
                            {isSubmitting ? "Creating account..." : "Create account"}
                        </button>
                    </form>
                )}
                {!registeredEmail && (
                    <p className="mt-6 text-center text-sm text-gray-500">Already have an account?{" "}
                        <Link to="/auth/login" className="font-semibold text-[#14302b] transition-colors hover:text-[#1f4a41] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f]">
                            Log in
                        </Link>
                    </p>
                )}
            </div>
        </div>
    </div>
    );
}

interface AuthFieldProps {
    id: string;
    // Read by screen readers and shown as the placeholder.
    label: string;
    icon: LucideIcon;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    type?: string;
    autoComplete: string;
    minLength?: number;
    maxLength?: number;
    // An optional button inside the input's right edge, e.g. the show-password toggle.
    trailing?: ReactNode;
}

// Same markup as the LoginPage inputs: icon on the left, red border and message on error.
function AuthField({ id, label, icon: Icon, value, onChange, error, type = "text", autoComplete, minLength, maxLength, trailing }: AuthFieldProps) {
    const errorId = `${id}-error`;

    return (
        <div>
            <label htmlFor={id} className="sr-only">{label}</label>
            <div className="relative">
                <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#14302b]/40" aria-hidden="true"/>
                <input id={id} name={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} required autoComplete={autoComplete} minLength={minLength} maxLength={maxLength} placeholder={label} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} className={`w-full rounded-lg border ${error ? "border-red-400" : "border-[#14302b]/20"} bg-[#f7f6f1] py-3 pl-11 ${trailing ? "pr-12" : "pr-4"} text-sm text-[#14302b] placeholder:text-gray-400 transition-colors focus:border-[#14302b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d4a94f]/60`}/>
                {trailing}
            </div>
            {error && (<p id={errorId} className="mt-1.5 text-xs text-red-700">{error}</p>)}
        </div>
    );
}

export default RegisterPage;
