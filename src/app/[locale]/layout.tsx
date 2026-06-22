import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Cairo } from "next/font/google";
import "../globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-cairo",
});
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getCategoryTree } from "@/lib/api/categories";
import type { Category } from "@/types/category";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { OneSignalProvider } from "@/lib/onesignal-context";
import { ActiveCategoryProvider } from "@/lib/active-category-context";
import { ThemeProvider } from "@/lib/theme-context";
import { SubscriptionProvider } from "@/lib/subscription-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: "Qafila - قافلة",
    description: "Shop the latest fashion, accessories & more",
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  let categoryTree: Category[] = [];
  try {
    categoryTree = await getCategoryTree(true);
  } catch {}

  const dir = locale === "ar" ? "rtl" : "ltr";
  const rootCategories = categoryTree.filter((c) => c.parentId === null);
  const initialSlug = rootCategories[0]?.slug ?? "";

  return (
    <html
      lang={locale}
      dir={dir}
      className={cairo.variable}
      suppressHydrationWarning
    >
      {/* Prevent flash of wrong theme */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';if((t||p)==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-cairo antialiased">
        <NextIntlClientProvider>
          <ThemeProvider>
            <AuthProvider>
              <OneSignalProvider>
                <CartProvider>
                  <SubscriptionProvider>
                    <WishlistProvider>
                      <ActiveCategoryProvider
                        initialSlug={initialSlug}
                        categoryTree={categoryTree}
                      >
                        <Header categoryTree={categoryTree} />
                        <main>{children}</main>
                        <Footer />
                      </ActiveCategoryProvider>
                    </WishlistProvider>
                  </SubscriptionProvider>
                </CartProvider>
              </OneSignalProvider>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
