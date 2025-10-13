import { useOAuth, useSignIn } from "@clerk/clerk-expo";
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

export default function SignInScreen() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
    const { startOAuthFlow: startFacebookOAuth } = useOAuth({ strategy: "oauth_facebook" });
    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Use Universal StyleSheet instead of custom inline styles
    const styles = useUniversalStyles(); const onSignInPress = async () => {
        if (!isLoaded) {
            return;
        }

        setLoading(true);
        try {
            const completeSignIn = await signIn.create({
                identifier: emailAddress,
                password,
            });

            if (completeSignIn.status === "complete") {
                await setActive({ session: completeSignIn.createdSessionId });
                router.replace("/(tabs)");
            } else {
                console.log(JSON.stringify(completeSignIn, null, 2));
            }
        } catch (err: any) {
            Alert.alert("Error", err.errors?.[0]?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const onGoogleSignIn = async () => {
        try {
            setLoading(true);
            const { createdSessionId, setActive: setActiveOAuth } = await startGoogleOAuth();

            if (createdSessionId && setActiveOAuth) {
                await setActiveOAuth({ session: createdSessionId });
                router.replace("/(tabs)");
            }
        } catch (err: any) {
            Alert.alert("Error", err.errors?.[0]?.message || "Google sign in failed");
        } finally {
            setLoading(false);
        }
    };

    const onFacebookSignIn = async () => {
        try {
            setLoading(true);
            const { createdSessionId, setActive: setActiveOAuth } = await startFacebookOAuth();

            if (createdSessionId && setActiveOAuth) {
                await setActiveOAuth({ session: createdSessionId });
                router.replace("/(tabs)");
            }
        } catch (err: any) {
            Alert.alert("Error", err.errors?.[0]?.message || "Facebook sign in failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.containerPadded}>
            <View style={styles.formContainer}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue stumbling</Text>

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
                    onPress={onSignInPress}
                    style={[styles.button, loading && styles.buttonDisabled]}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? "Signing In..." : "Sign In"}
                    </Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialButtonsRow}>
                    <TouchableOpacity
                        onPress={onGoogleSignIn}
                        style={[styles.socialButtonRow, styles.socialButtonGoogle, loading && styles.buttonDisabled]}
                        disabled={loading}
                    >
                        <FontAwesome name="google" size={20} color="#4285f4" />
                        <Text style={styles.socialButtonText}>Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onFacebookSignIn}
                        style={[styles.socialButtonRow, styles.socialButtonFacebook, loading && styles.buttonDisabled]}
                        disabled={loading}
                    >
                        <FontAwesome name="facebook" size={20} color="#1877f2" />
                        <Text style={styles.socialButtonText}>Facebook</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account?</Text>
                    <Link href="/sign-up" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>Sign Up</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </SafeAreaView>
    );
}