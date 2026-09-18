import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'routes/app_router.dart';
import 'constants/app_colors.dart';

/// Firebase configuration
/// 
/// Note: For production, create a firebase_options.dart file using:
/// flutterfire configure
/// 
/// For now, using placeholder config. Update with your Firebase project config.
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  try {
    await Firebase.initializeApp(
      // options: const FirebaseOptions(
      //   apiKey: "REPLACE_FIREBASE_API_KEY",
      //   appId: "1:43477714750:web:db4902deb934ed0c2f4e6f",
      //   messagingSenderId: "43477714750",
      //   projectId: "your-firebase-project",
      //   authDomain: "your-firebase-project.firebaseapp.com",
      //   storageBucket: "your-firebase-project.firebasestorage.app",
      // ),
    );
    print('✅ [FRONTEND] Firebase initialized successfully');
  } catch (e) {
    print('❌ [FRONTEND] Firebase initialization failed: $e');
  }

  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = createRouter(ref);

    return MaterialApp.router(
      title: 'RouteHub',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme(
          brightness: Brightness.light,
          primary: AppColors.primary,
          onPrimary: AppColors.primaryForeground,
          secondary: AppColors.secondary,
          onSecondary: AppColors.secondaryForeground,
          error: AppColors.error,
          onError: AppColors.destructiveForeground,
          surface: AppColors.card,
          onSurface: AppColors.foreground,
          background: AppColors.background,
          onBackground: AppColors.foreground,
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.background,
        cardTheme: CardThemeData(
          color: AppColors.card,
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(4), // 0.25rem = 4px
          ),
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.primaryForeground,
          elevation: 0,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.background,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(4), // 0.25rem = 4px
            borderSide: const BorderSide(color: AppColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(4),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(4),
            borderSide: const BorderSide(color: AppColors.ring, width: 2),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.primaryForeground,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(4), // 0.25rem = 4px
            ),
            elevation: 0,
          ),
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: AppColors.foreground),
          bodyMedium: TextStyle(color: AppColors.foreground),
          bodySmall: TextStyle(color: AppColors.mutedForeground),
          labelLarge: TextStyle(color: AppColors.foreground),
          labelMedium: TextStyle(color: AppColors.mutedForeground),
          labelSmall: TextStyle(color: AppColors.mutedForeground),
        ),
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme(
          brightness: Brightness.dark,
          primary: AppColors.primary,
          onPrimary: AppColors.primaryForeground,
          secondary: AppColors.darkSecondary,
          onSecondary: AppColors.darkSecondaryForeground,
          error: AppColors.destructive,
          onError: AppColors.destructiveForeground,
          surface: AppColors.darkCard,
          onSurface: AppColors.darkForeground,
          background: AppColors.darkBackground,
          onBackground: AppColors.darkForeground,
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.darkBackground,
        cardTheme: CardThemeData(
          color: AppColors.darkCard,
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.primaryForeground,
          elevation: 0,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppColors.darkInput,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(4),
            borderSide: const BorderSide(color: AppColors.darkBorder),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(4),
            borderSide: const BorderSide(color: AppColors.darkBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(4),
            borderSide: const BorderSide(color: AppColors.ring, width: 2),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: AppColors.primaryForeground,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(4),
            ),
            elevation: 0,
          ),
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: AppColors.darkForeground),
          bodyMedium: TextStyle(color: AppColors.darkForeground),
          bodySmall: TextStyle(color: AppColors.darkMutedForeground),
          labelLarge: TextStyle(color: AppColors.darkForeground),
          labelMedium: TextStyle(color: AppColors.darkMutedForeground),
          labelSmall: TextStyle(color: AppColors.darkMutedForeground),
        ),
      ),
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}
