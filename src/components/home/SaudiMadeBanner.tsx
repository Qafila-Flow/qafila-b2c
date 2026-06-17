import { getTranslations } from "next-intl/server";
import ProductCard, { type Product } from "@/components/shared/ProductCard";
import { Link } from "@/i18n/navigation";

interface Props {
  products: Product[];
}

export default async function SaudiMadeBanner({ products }: Props) {
  const t = await getTranslations("saudiMade");

  return (
    <section className="mx-4 max-w-360 px-0 py-6 md:mx-20">
      {/* Top: Banner */}
      <div className="relative mb-5 flex h-55 w-full items-center overflow-hidden rounded-2xl md:h-65">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-linear-to-r from-[#4A4035] via-[#5A5045] to-[#706558]" />
        <div className="absolute inset-0 bg-linear-to-t from-black/25 via-transparent to-black/5" />
        <img
          src="/images/sa-bg.png"
          alt="Saudi Made Banner"
          className="absolute inset-0 h-full w-full object-cover object-top top-0"
        />
        {/* Content */}

        <div className="relative z-10 px-8 md:px-12">
          <div className="mb-3 flex items-center gap-2">
            {/* <span className="text-3xl">🇸🇦</span> */}
            {/* <img src="/images/sa.png" /> */}
            <span className="text-xl font-bold italic text-white">
              {/* {t("title")} */}.
            </span>
          </div>
          <h2 className="text-[36px] font-bold italic leading-tight text-white md:text-[44px]">
            {/* {t("discount")} */}
          </h2>
          <Link
            href="/tags/saudi-made"
            className="mt-6 inline-block rounded-full border-2 border-white px-7 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white hover:text-dark"
          >
            {t("shopNow")}
          </Link>
        </div>
      </div>

      {/* Bottom: Product cards */}
      <div className="scrollbar-hide flex gap-4 overflow-x-auto">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
