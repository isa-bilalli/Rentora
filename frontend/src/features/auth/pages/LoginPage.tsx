import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../useAuth";
import Rentora from "../../../assets/rentora-wordmark.svg"
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Link } from "react-router";
import { ApiError, type FieldErrors } from "../../../lib/api/client";

interface LoginLocationState {
    from?: {
        pathname: string;
        search?: string;
        hash?: string;
    };
}

function LoginPage(){
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const state = location.state as LoginLocationState | null;

    function clearFieldError(field: string) {
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
        setFieldErrors({});
        setIsSubmitting(true);
        try {
            await login({
                email,
                password,
            });

            const from = state?.from;

            if (from) {
                navigate(
                    `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`,
                    { replace: true }
                );
            } else {
                navigate("/app/dashboard", { replace: true });
            }
        } catch (error) {
            if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
                setFieldErrors(error.fieldErrors);
            } else {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Login failed"
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#e8e2d6] px-4 py-10">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#14302b]/10 bg-white shadow-xl shadow-[#14302b]/10">
            <div className="h-1.5 w-full bg-[#d4a94f]" aria-hidden="true" />
 
            <div className="px-6 pb-8 pt-8 sm:px-10">
                <div className="flex flex-col items-center text-center">
                    <img src={Rentora} className="h-10 w-auto" alt="Rentora" />
                    <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#14302b]">Welcome back</h1>
                </div>
                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <div>
                        <label htmlFor="email" className="sr-only">Email</label>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#14302b]/40" aria-hidden="true"/>
                            <input id="email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); clearFieldError("email"); }} required autoComplete="email" placeholder="Email address" aria-invalid={fieldErrors.email ? true : undefined} aria-describedby={fieldErrors.email ? "email-error" : undefined} className={`w-full rounded-lg border ${fieldErrors.email ? "border-red-400" : "border-[#14302b]/20"} bg-[#f7f6f1] py-3 pl-11 pr-4 text-sm text-[#14302b] placeholder:text-gray-400 transition-colors focus:border-[#14302b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d4a94f]/60`}/>
                        </div>
                        {fieldErrors.email && (<p id="email-error" className="mt-1.5 text-xs text-red-700">{fieldErrors.email}</p>)}
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <div className="relative">
                            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#14302b]/40" aria-hidden="true"/>
                            <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); clearFieldError("password"); }} required autoComplete="current-password" placeholder="Password" aria-invalid={fieldErrors.password ? true : undefined} aria-describedby={fieldErrors.password ? "password-error" : undefined} className={`w-full rounded-lg border ${fieldErrors.password ? "border-red-400" : "border-[#14302b]/20"} bg-[#f7f6f1] py-3 pl-11 pr-12 text-sm text-[#14302b] placeholder:text-gray-400 transition-colors focus:border-[#14302b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d4a94f]/60`}/>
                            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#14302b]/50 transition-colors hover:bg-[#14302b]/5 hover:text-[#14302b] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#d4a94f]">
                                {showPassword ? (<EyeOff className="h-5 w-5" aria-hidden="true" />) : (<Eye className="h-5 w-5" aria-hidden="true" />)}
                            </button>
                        </div>
                        {fieldErrors.password && (<p id="password-error" className="mt-1.5 text-xs text-red-700">{fieldErrors.password}</p>)}
                    </div>
                    {error && (<p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>)}
                    <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#14302b] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1f4a41] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f] disabled:cursor-not-allowed disabled:opacity-70">
                        {isSubmitting && (<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />)}
                        {isSubmitting ? "Logging in..." : "Login"}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-gray-500">Don&apos;t have an account?{" "}
                    <Link to="/auth/register" className="font-semibold text-[#14302b] transition-colors hover:text-[#1f4a41] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a94f]">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    </div>
    );
}

export default LoginPage;