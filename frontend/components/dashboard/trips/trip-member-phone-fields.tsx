"use client";

import {
  CountrySelector,
  defaultCountries,
  usePhoneInput,
} from "react-international-phone";
import type { ParsedCountry } from "react-international-phone";

const PREFERRED = ["us", "ca", "gb", "au", "in", "de", "fr"] as const;

type TripMemberPhoneFieldsProps = {
  value: string;
  onChange: (e164: string) => void;
  disabled?: boolean;
};

/**
 * Segmented control: Country (+ dial code + picker) | national number only.
 * Matches E.164 in parent `value` for API submission.
 */
export function TripMemberPhoneFields({ value, onChange, disabled }: TripMemberPhoneFieldsProps) {
  const { inputValue, country, setCountry, handlePhoneValueChange, inputRef } = usePhoneInput({
    value,
    defaultCountry: "us",
    disableDialCodeAndPrefix: true,
    preferredCountries: [...PREFERRED],
    onChange: ({ phone: next }) => {
      onChange(next ?? "");
    },
  });

  const handleCountrySelect = (c: ParsedCountry) => {
    setCountry(c.iso2, { focusOnInput: true });
  };

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end sm:gap-0">
      <div className="grid w-max max-w-full shrink-0 gap-1 sm:min-w-0">
        <span className="text-sm font-medium text-foreground">Country</span>
        <div className="add-trip-country-selector relative flex h-10 w-max min-w-0 max-w-full items-stretch rounded-lg border border-border/80 bg-background sm:rounded-l-lg sm:rounded-r-none">
          <span className="flex items-center pl-2.5 pr-1 text-sm tabular-nums text-foreground sm:pl-3">
            +{country.dialCode}
          </span>
          <CountrySelector
            selectedCountry={country.iso2}
            onSelect={handleCountrySelect}
            countries={defaultCountries}
            preferredCountries={[...PREFERRED]}
            disabled={disabled}
            flagClassName="hidden"
            className="flex h-full min-w-0 items-stretch"
            buttonClassName="!h-10 !min-w-[2.25rem] !shrink-0 !rounded-none !border-0 !bg-transparent !px-1.5 !pr-2 hover:!bg-muted/60"
            buttonContentWrapperClassName="!justify-center"
            dropdownArrowClassName="!ml-0"
          />
        </div>
      </div>

      <div className="grid min-w-0 gap-1 sm:min-w-0">
        <span className="text-sm font-medium text-primary">Phone</span>
        <input
          ref={inputRef}
          type="tel"
          name="trip-member-phone-national"
          value={inputValue}
          onChange={handlePhoneValueChange}
          disabled={disabled}
          placeholder="Phone number"
          autoComplete="tel"
          className="h-10 w-full min-w-0 rounded-lg border border-border/80 bg-background px-3 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:z-10 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60 sm:-ml-px sm:rounded-l-none sm:rounded-r-lg sm:border-l sm:border-border/80"
        />
      </div>
    </div>
  );
}
