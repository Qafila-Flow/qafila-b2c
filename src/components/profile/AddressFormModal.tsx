"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import CityRegionSelect from "@/components/address/CityRegionSelect";
import type { City } from "@/lib/api/cities";
import type {
  Address,
  AddressType,
  CreateAddressPayload,
} from "@/lib/api/addresses";

interface AddressFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAddressPayload) => Promise<void>;
  address?: Address | null;
}

export default function AddressFormModal({
  open,
  onClose,
  onSubmit,
  address,
}: AddressFormModalProps) {
  const t = useTranslations("addresses");

  const [type, setType] = useState<AddressType>("HOME");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [street, setStreet] = useState("");
  const [cityId, setCityId] = useState<string | null>(null);
  const [cityName, setCityName] = useState("");
  const [area, setArea] = useState("");
  const [apartmentNo, setApartmentNo] = useState("");
  const [directions, setDirections] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!address;

  // Populate form when editing
  useEffect(() => {
    if (address) {
      setType(address.type);
      setFirstName(address.firstName);
      setLastName(address.lastName);
      setPhoneNumber(address.phoneNumber);
      setStreet(address.street);
      setCityId(address.cityId ?? null);
      setCityName(address.city);
      setArea(address.area);
      setApartmentNo(address.apartmentNo || "");
      setDirections(address.directions || "");
      setIsDefault(address.isDefault);
    } else {
      setType("HOME");
      setFirstName("");
      setLastName("");
      setPhoneNumber("");
      setStreet("");
      setCityId(null);
      setCityName("");
      setArea("");
      setApartmentNo("");
      setDirections("");
      setIsDefault(false);
    }
    setError("");
  }, [address, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // The city picker is a custom control, so it sits outside native form
    // validation and has to be checked here.
    if (!cityId) {
      setError(t("cityRequired"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSubmit({
        type,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        street: street.trim(),
        cityId,
        // Sent alongside cityId during the transition; the server derives the
        // canonical name from cityId regardless.
        city: cityName.trim() || undefined,
        area: area.trim(),
        apartmentNo: apartmentNo.trim() || undefined,
        directions: directions.trim() || undefined,
        isDefault,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const addressTypes: AddressType[] = ["HOME", "WORK", "OTHER"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-dark p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute end-4 top-4 rounded-lg p-1 text-gray-text transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-dark"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-bold text-dark dark:text-gray-100">
          {isEditing ? t("editAddress") : t("addAddress")}
        </h2>
        <p className="mt-1 text-sm text-gray-text">
          {isEditing ? t("editAddressDesc") : t("addAddressDesc")}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Address Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-gray-200">
              {t("type")}
            </label>
            <div className="flex gap-2">
              {addressTypes.map((at) => (
                <button
                  key={at}
                  type="button"
                  onClick={() => setType(at)}
                  className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                    type === at
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-gray-border dark:border-gray-700 text-gray-text hover:border-dark hover:text-dark dark:hover:border-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {t(`types.${at}`)}
                </button>
              ))}
            </div>
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={`${t("firstName")}*`}
              required
              className="w-full rounded-lg border border-gray-border dark:border-gray-700 bg-white dark:bg-dark px-4 py-3 text-sm text-dark dark:text-gray-200 outline-none transition-colors placeholder:text-gray-text dark:placeholder:text-gray-500 focus:border-dark"
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={`${t("lastName")}*`}
              required
              className="w-full rounded-lg border border-gray-border dark:border-gray-700 bg-white dark:bg-dark px-4 py-3 text-sm text-dark dark:text-gray-200 outline-none transition-colors placeholder:text-gray-text dark:placeholder:text-gray-500 focus:border-dark"
            />
          </div>

          {/* Phone Number */}
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder={`${t("phone")}*`}
            required
            className="w-full rounded-lg border border-gray-border px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-text focus:border-dark"
          />

          {/* Street */}
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder={`${t("street")}*`}
            required
            className="w-full rounded-lg border border-gray-border px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-text focus:border-dark"
          />

          {/* Region & City */}
          <CityRegionSelect
            value={cityId}
            onChange={(id, selected: City | null) => {
              setCityId(id);
              setCityName(selected?.nameEn ?? "");
              if (id) setError("");
            }}
            legacyCityName={isEditing && !cityId ? cityName : null}
            required
          />

          {/* Area — stays free text; neighbourhoods are too numerous and too
              local to enumerate, and the map only needs city granularity. */}
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder={`${t("area")}*`}
            required
            className="w-full rounded-lg border border-gray-border dark:border-gray-700 bg-white dark:bg-dark px-4 py-3 text-sm text-dark dark:text-gray-200 outline-none transition-colors placeholder:text-gray-text dark:placeholder:text-gray-500 focus:border-dark"
          />

          {/* Apartment No */}
          <input
            type="text"
            value={apartmentNo}
            onChange={(e) => setApartmentNo(e.target.value)}
            placeholder={t("apartmentNo")}
            className="w-full rounded-lg border border-gray-border px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-text focus:border-dark"
          />

          {/* Directions */}
          <textarea
            value={directions}
            onChange={(e) => setDirections(e.target.value)}
            placeholder={t("directions")}
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-border px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-text focus:border-dark"
          />

          {/* Set as default */}
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm text-dark dark:text-gray-200">{t("makeDefault")}</span>
          </label>

          {/* Error */}
          {error && (
            <p className="text-center text-xs text-discount">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-border dark:border-gray-700 py-3 text-sm font-medium text-dark dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-dark/80"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-dark py-3 text-sm font-semibold text-white transition-colors hover:bg-dark/90 disabled:opacity-50"
            >
              {saving ? t("saving") : isEditing ? t("saveChanges") : t("addAddress")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
