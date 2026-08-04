"use client";

import { useTranslations, useLocale } from "next-intl";
import {
  MapPin,
  Pencil,
  Trash2,
  Star,
  Home,
  Briefcase,
  MapPinned,
  Phone,
} from "lucide-react";
import type { Address } from "@/lib/api/addresses";

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
  onSetDefault: (address: Address) => void;
}

const typeIcons = {
  HOME: Home,
  WORK: Briefcase,
  OTHER: MapPinned,
};

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  const t = useTranslations("addresses");
  const locale = useLocale();

  const TypeIcon = typeIcons[address.type] || MapPin;

  return (
    <div
      className={`relative rounded-xl border p-4 transition-colors ${
        address.isDefault
          ? "border-primary bg-primary/5"
          : "border-gray-border dark:border-gray-700 hover:border-gray-text/30"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              address.isDefault ? "bg-primary/10 text-primary" : "bg-gray-100 dark:bg-gray-700 text-gray-text"
            }`}
          >
            <TypeIcon size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-dark dark:text-gray-100">
                {t(`types.${address.type}`)}
              </span>
              {address.isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  <Star size={10} className="fill-current" />
                  {t("default")}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-text">
              {address.firstName} {address.lastName}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(address)}
            className="rounded-lg p-1.5 text-gray-text transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-dark"
            title={t("edit")}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(address)}
            className="rounded-lg p-1.5 text-gray-text transition-colors hover:bg-red-50 hover:text-discount"
            title={t("delete")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Address details */}
      <div className="mt-3 space-y-1 ps-10">
        <p className="text-sm text-dark dark:text-gray-200">
          {address.street}
          {address.apartmentNo && `, ${address.apartmentNo}`}
        </p>
        <p className="text-sm text-gray-text">
          {address.area},{" "}
          {/* Canonical bilingual name when the city is mapped; the original
              free text otherwise, so a legacy address never renders blank. */}
          {(locale === "ar" ? address.cityNameAr : address.cityNameEn) ??
            address.city}
        </p>
        {address.directions && (
          <p className="text-xs text-gray-text italic">{address.directions}</p>
        )}
        <div className="flex items-center gap-1 text-xs text-gray-text">
          <Phone size={12} />
          <span dir="ltr">{address.phoneNumber}</span>
        </div>
      </div>

      {/* Set as default button */}
      {!address.isDefault && (
        <div className="mt-3 ps-10">
          <button
            onClick={() => onSetDefault(address)}
            className="text-xs font-medium text-primary transition-colors hover:text-primary-hover"
          >
            {t("setAsDefault")}
          </button>
        </div>
      )}
    </div>
  );
}
