import { useOAuth, useSignUp } from "@clerk/clerk-expo";
import { FontAwesome } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUniversalStyles } from "../../lib/useThemedStyles";

export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
    const { startOAuthFlow: startFacebookOAuth } = useOAuth({ strategy: "oauth_facebook" });
    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    // Use Universal StyleSheet instead of custom inline styles
    const styles = useUniversalStyles(); const onSignUpPress = async () => {
        if (!isLoaded) {
            return;
        }

        setLoading(true);
        try {
            await signUp.create({
                emailAddress,
                password,
            });

            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err: any) {
            Alert.alert("Error", err.errors?.[0]?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const onPressVerify = async () => {
        if (!isLoaded) {
            return;
        }

        setLoading(true);
        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (completeSignUp.status === "complete") {
                await setActive({ session: completeSignUp.createdSessionId });
                router.replace("/(tabs)");
            } else {
                console.error(JSON.stringify(completeSignUp, null, 2));
            }
        } catch (err: any) {
            Alert.alert("Error", err.errors?.[0]?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const onGoogleSignUp = async () => {
        try {
            setLoading(true);
            const { createdSessionId, setActive: setActiveOAuth } = await startGoogleOAuth();

            if (createdSessionId && setActiveOAuth) {
                await setActiveOAuth({ session: createdSessionId });
                router.replace("/(tabs)");
            }
        } catch (err: any) {
            Alert.alert("Error", err.errors?.[0]?.message || "Google sign up failed");
        } finally {
            setLoading(false);
        }
    };

    const onFacebookSignUp = async () => {
        try {
            setLoading(true);
            const { createdSessionId, setActive: setActiveOAuth } = await startFacebookOAuth();

            if (createdSessionId && setActiveOAuth) {
                await setActiveOAuth({ session: createdSessionId });
                router.replace("/(tabs)");
            }
        } catch (err: any) {
            Alert.alert("Error", err.errors?.[0]?.message || "Facebook sign up failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.containerPadded}>
            <View style={styles.formContainer}>
                {!pendingVerification && (
                    <>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join the discovery journey</Text>

                        <TextInput
                            autoCapitalize="none"
                            value={emailAddress}
                            placeholder="Email..."
                            onChangeText={setEmailAddress}
                            style={styles.input}
                        />
                        <TextInput
                            value={password}
                            placeholder="Password..."
                            secureTextEntry={true}
                            onChangeText={setPassword}
                            style={styles.input}
                        />

                        <TouchableOpacity
                            onPress={onSignUpPress}
                            style={[styles.button, loading && styles.buttonDisabled]}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? "Creating Account..." : "Sign Up"}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.socialButtons}>
                            <TouchableOpacity
                                onPress={onGoogleSignUp}
                                style={[styles.socialButton, styles.socialButtonGoogle, loading && styles.buttonDisabled]}
                                disabled={loading}
                            >
                                <FontAwesome name="google" size={20} color="#4285f4" />
                                <Text style={styles.socialButtonText}>Google</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={onFacebookSignUp}
                                style={[styles.socialButton, styles.socialButtonFacebook, loading && styles.buttonDisabled]}
                                disabled={loading}
                            >
                                <FontAwesome name="facebook" size={20} color="#1877f2" />
                                <Text style={styles.socialButtonText}>Facebook</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account?</Text>
                            <Link href="/sign-in" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.linkText}>Sign In</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </>
                )}

                {pendingVerification && (
                    <>
                        <Text style={styles.title}>Verify Email</Text>
                        <Text style={styles.subtitle}>
                            Enter the verification code sent to {emailAddress}
                        </Text>

                        <TextInput
                            value={code}
                            placeholder="Verification code..."
                            onChangeText={setCode}
                            style={styles.input}
                            keyboardType="number-pad"
                        />

                        <TouchableOpacity
                            onPress={onPressVerify}
                            style={[styles.button, loading && styles.buttonDisabled]}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? "Verifying..." : "Verify Email"}
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}