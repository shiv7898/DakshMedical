// import React, { useEffect, useRef } from 'react';
// import {
//     View,
//     Text,
//     StyleSheet,
//     Animated,
//     Image,
//     StatusBar,
// } from 'react-native';

// const TEXT = "AIRSINE";

// const SplashScreen = ({ navigation }) => {
//     const letters = TEXT.split('');

//     const opacityAnim = useRef(letters.map(() => new Animated.Value(0))).current;
//     const translateAnim = useRef(letters.map(() => new Animated.Value(15))).current;

//     const logoScale = useRef(new Animated.Value(0.7)).current;
//     const logoFade = useRef(new Animated.Value(0)).current;
//     const glow = useRef(new Animated.Value(1)).current;

//     useEffect(() => {
//         // Logo entry
//         Animated.parallel([
//             Animated.spring(logoScale, {
//                 toValue: 1,
//                 friction: 6,
//                 useNativeDriver: true,
//             }),
//             Animated.timing(logoFade, {
//                 toValue: 1,
//                 duration: 600,
//                 useNativeDriver: true,
//             }),
//         ]).start();

//         // Glow pulse
//         Animated.loop(
//             Animated.sequence([
//                 Animated.timing(glow, {
//                     toValue: 1.2,
//                     duration: 1000,
//                     useNativeDriver: true,
//                 }),
//                 Animated.timing(glow, {
//                     toValue: 1,
//                     duration: 1000,
//                     useNativeDriver: true,
//                 }),
//             ])
//         ).start();

//         // Letter animation (top title)
//         letters.forEach((_, i) => {
//             setTimeout(() => {
//                 Animated.parallel([
//                     Animated.timing(opacityAnim[i], {
//                         toValue: 1,
//                         duration: 300,
//                         useNativeDriver: true,
//                     }),
//                     Animated.timing(translateAnim[i], {
//                         toValue: 0,
//                         duration: 300,
//                         useNativeDriver: true,
//                     }),
//                 ]).start();
//             }, i * 150);
//         });

//         // Navigate
//         setTimeout(() => {
//             navigation.replace('Login');
//         }, 2800);

//     }, []);

//     return (
//         <View style={styles.container}>
//             <StatusBar barStyle="dark-content" backgroundColor="transparent" />

//             {/* TOP BRAND NAME */}
//             <View style={styles.topContainer}>
//                 <View style={styles.textRow}>
//                     {letters.map((letter, index) => (
//                         <Animated.Text
//                             key={index}
//                             style={[
//                                 styles.text,
//                                 {
//                                     opacity: opacityAnim[index],
//                                     transform: [{ translateY: translateAnim[index] }],
//                                 },
//                             ]}
//                         >
//                             {letter}
//                         </Animated.Text>
//                     ))}
//                 </View>

//                 <Text style={styles.tagline}>VITAL MONITORING SYSTEMS</Text>
//             </View>

//             {/* CENTER LOGO */}
//             <View style={styles.centerContainer}>
//                 <Animated.View
//                     style={[
//                         styles.glow,
//                         { transform: [{ scale: glow }] },
//                     ]}
//                 />

//                 <Animated.View
//                     style={[
//                         styles.logoWrapper,
//                         {
//                             opacity: logoFade,
//                             transform: [{ scale: logoScale }],
//                         },
//                     ]}
//                 >
//                     <Image
//                         source={require('../assets/img/logo1.png')}
//                         style={styles.logo}
//                         resizeMode="contain"
//                     />
//                 </Animated.View>
//             </View>

//             {/* BOTTOM SPACE */}
//             <View style={{ flex: 1 }} />
//         </View>
//     );
// };

// export default SplashScreen;

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#E6F9F2', // light green background
//     },

//     topContainer: {
//         alignItems: 'center',
//         marginTop: 80,
//     },

//     textRow: {
//         flexDirection: 'row',
//     },

//     text: {
//         fontSize: 30,
//         fontWeight: '900',
//         color: '#0F766E', // dark green (login theme)
//         letterSpacing: 5,
//     },

//     tagline: {
//         fontSize: 10,
//         marginTop: 6,
//         color: '#0F766E',
//         letterSpacing: 2,
//         opacity: 0.7,
//     },

//     centerContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },

//     logoWrapper: {
//         width: 110,
//         height: 110,
//         borderRadius: 60,
//         backgroundColor: '#FFFFFF',
//         justifyContent: 'center',
//         alignItems: 'center',

//         elevation: 10,
//         shadowColor: '#10B981',
//         shadowOffset: { width: 0, height: 6 },
//         shadowOpacity: 0.3,
//         shadowRadius: 12,
//     },

//     logo: {
//         width: 80,
//         height: 80,
//         borderRadius: 40, // circular logo
//     },

//     glow: {
//         position: 'absolute',
//         width: 140,
//         height: 140,
//         borderRadius: 70,
//         backgroundColor: '#10B981',
//         opacity: 0.15,
//     },
// });
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Image,
    StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';

const TITLE = "AIRSINE";

const SplashScreen = ({ navigation }) => {
    const letters = TITLE.split('');

    const opacityAnim = useRef(letters.map(() => new Animated.Value(0))).current;
    const translateAnim = useRef(letters.map(() => new Animated.Value(20))).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    const brandFade = useRef(new Animated.Value(0)).current;
    const heartbeatFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Main branding fade in
        Animated.timing(brandFade, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        // Heartbeat fade in slightly later
        Animated.timing(heartbeatFade, {
            toValue: 0.35,
            duration: 1500,
            delay: 500,
            useNativeDriver: true,
        }).start();

        // Letters animation
        letters.forEach((_, i) => {
            Animated.sequence([
                Animated.delay(i * 80 + 600),
                Animated.parallel([
                    Animated.timing(opacityAnim[i], {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateAnim[i], {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            ]).start();
        });

        // Subtitle/Tagline Pop
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
            delay: 1500,
        }).start();

        // Navigate
        setTimeout(() => {
            navigation.replace('Login');
        }, 4500);

    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <LinearGradient
                colors={['#F0FAF6', '#FFFFFF', '#F0FAF6']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* 💓 Heartbeat Backdrop (Subtle Glow) */}
                <Animated.View style={[styles.heartbeatWrapper, { opacity: heartbeatFade }]}>
                    <LottieView
                        source={require('../assets/animations/heartbeat.json')}
                        autoPlay
                        loop
                        style={styles.heartbeatLottie}
                    />
                </Animated.View>

                {/* 🏛️ Integrated Premium Branding Unit */}
                <Animated.View style={[styles.brandingUnit, { opacity: brandFade }]}>

                    {/* Visual Logo (Subtle) */}
                    <View style={styles.logoBox}>
                        <Image
                            source={require('../assets/img/logo1.png')}
                            style={styles.premiumLogo}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Text Components */}
                    <Text style={styles.welcomeText}>ESTABLISHED HEALTHCARE</Text>

                    <Animated.View style={[styles.titleGroup, { transform: [{ scale: scaleAnim }] }]}>
                        <View style={styles.textRow}>
                            {letters.map((letter, index) => (
                                <Animated.Text
                                    key={index}
                                    style={[
                                        styles.title,
                                        index < 3 ? styles.titleBold : styles.titleLight,
                                        {
                                            opacity: opacityAnim[index],
                                            transform: [{ translateY: translateAnim[index] }],
                                        },
                                    ]}
                                >
                                    {letter}
                                </Animated.Text>
                            ))}
                        </View>
                        <View style={styles.accentLine} />
                    </Animated.View>

                    <Text style={styles.tagline}>Smart Vital Monitoring System</Text>
                </Animated.View>

                {/* Dynamic Footer */}
                <View style={styles.footer}>
                    <View style={styles.loadingBar} />
                    <Text style={styles.footerText}>SECURE HEALTH ANALYSIS</Text>
                </View>
            </LinearGradient>
        </View>
    );
};

export default SplashScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heartbeatWrapper: {
        position: 'absolute',
        width: 320,
        height: 320,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heartbeatLottie: {
        width: '100%',
        height: '100%',
    },
    brandingUnit: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    logoBox: {
        marginBottom: 20,
        opacity: 0.5, // Ultra-modern subtle logo 🔥
    },
    premiumLogo: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    welcomeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0F766E',
        letterSpacing: 6,
        marginBottom: 8,
        opacity: 0.4,
    },
    titleGroup: {
        alignItems: 'center',
        marginBottom: 15,
    },
    textRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    title: {
        fontSize: 52, // Larger, more impactful branding
        color: '#0D9488',
        letterSpacing: 2,
    },
    titleBold: {
        fontWeight: '900',
    },
    titleLight: {
        fontWeight: '300',
    },
    accentLine: {
        height: 2,
        width: 30,
        backgroundColor: '#14B8A6',
        marginTop: -2,
        borderRadius: 1,
        opacity: 0.6,
    },
    tagline: {
        fontSize: 13,
        fontWeight: '500',
        color: '#0F766E',
        opacity: 0.35,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        alignItems: 'center',
    },
    loadingBar: {
        width: 100,
        height: 2,
        backgroundColor: '#E6F9F2',
        borderRadius: 1,
        marginBottom: 15,
        overflow: 'hidden',
    },
    footerText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#0F766E',
        opacity: 0.25,
        letterSpacing: 3,
    }
});