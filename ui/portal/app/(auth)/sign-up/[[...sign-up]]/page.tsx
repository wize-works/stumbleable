"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

export default function SignUpPage() {
    const router = useRouter();
    const { isSignedIn } = useUser();

    useEffect(() => {
        // Redirect to dashboard if user is signed in
        if (isSignedIn) {
            router.replace("/dashboard");
        }
    }, [isSignedIn, router]);

    return (
        <Suspense fallback={null}>
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="w-full max-w-md">

                    {!isSignedIn && (
                        <SignUp.Root>
                            <SignUp.Step name="start" className="space-y-4">
                                <div className="card bg-base-100 shadow-xl rounded-2xl p-6">
                                    <h1 className="text-2xl font-bold mb-1">Create your account</h1>
                                    <p className="text-base-content/60 mb-6">Fast with Google or Microsoft. Email works too.</p>
                                    <Clerk.GlobalError />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Clerk.Field name="firstName" className="fieldset">
                                            <Clerk.Label>First Name</Clerk.Label>
                                            <Clerk.Input type="text" className="input w-full" placeholder="Marco" />
                                            <Clerk.FieldError />
                                        </Clerk.Field>

                                        <Clerk.Field name="lastName" className="fieldset">
                                            <Clerk.Label>Last Name</Clerk.Label>
                                            <Clerk.Input type="text" className="input w-full" placeholder="Polo" />
                                            <Clerk.FieldError />
                                        </Clerk.Field>
                                    </div>

                                    <Clerk.Field name="emailAddress" className="fieldset">
                                        <Clerk.Label>What is your email?</Clerk.Label>
                                        <Clerk.Input type="email" className="input w-full" placeholder="explorer@discovery.com" />
                                        <Clerk.FieldError />
                                    </Clerk.Field>

                                    <Clerk.Field name="password" className="fieldset">
                                        <Clerk.Label>What do you want your password to be?</Clerk.Label>
                                        <Clerk.Input type="password" className="input w-full" placeholder="StumbleAround123!" />
                                        <Clerk.FieldError />
                                    </Clerk.Field>

                                    <SignUp.Action submit className="btn btn-primary w-full rounded-xl">Create Account</SignUp.Action>

                                    <div className="divider">or</div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Clerk.Connection name="google" className="btn btn-outline rounded-xl"><Clerk.Icon />Google</Clerk.Connection>
                                        <Clerk.Connection name="facebook" className="btn btn-outline rounded-xl"><Clerk.Icon />Facebook</Clerk.Connection>
                                        {/* <Clerk.Connection name="microsoft" className="btn btn-outline rounded-xl"><Clerk.Icon />Microsoft</Clerk.Connection> */}
                                    </div>

                                    <SignUp.Captcha className="w-full" />

                                    <div className="text-sm text-base-content/60 text-center">
                                        Already have an account? <a className="link link-primary" href="/auth/signin">Sign in</a>
                                    </div>
                                </div>
                            </SignUp.Step>

                            <SignUp.Step name="verifications" className="space-y-4">
                                <div className="card bg-base-100 shadow-xl rounded-2xl p-6">
                                    <h1 className="text-2xl font-bold mb-1">Verify your account</h1>
                                    <p className="text-base-content/60 mb-6">Check your email for the confirmation code</p>
                                    <Clerk.GlobalError />
                                    <SignUp.Strategy name="email_code">
                                        <Clerk.Field name="code" className="fieldset">
                                            <Clerk.Label>Enter the code sent to your email</Clerk.Label>
                                            <Clerk.Input inputMode="numeric" className="input input-bordered w-full" placeholder="123456" />
                                            <Clerk.FieldError />
                                        </Clerk.Field>

                                        <SignUp.Action submit className="btn btn-primary w-full rounded-xl">Verify</SignUp.Action>
                                    </SignUp.Strategy>
                                </div>
                            </SignUp.Step>
                        </SignUp.Root>
                    )}
                </div >
            </div >
        </Suspense >
    );
}
