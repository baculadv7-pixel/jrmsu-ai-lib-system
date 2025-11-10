import { createContext, useContext, useMemo, useState } from "react";

export type RegRole = "student" | "admin";

export interface RegistrationData {
  role: RegRole;
  // Personal
  firstName: string;
  middleName: string;
  lastName: string;
  suffix?: string;
  birthdate: string;
  age: string; // Age as input/dropdown
  gender?: string;
  email: string;
  phone: string;
  
  // Current Address (all required except street)
  addressStreet?: string;
  addressBarangay?: string;
  addressMunicipality?: string;
  addressProvince?: string;
  addressRegion?: string; // Added region field
  addressCountry?: string;
  addressZip?: string;
  
  // Permanent address and notes
  address: string;
  addressPermanent?: string;
  sameAsCurrent?: boolean; // Checkbox for "Same as Current Address"
  addressPermanentNotes?: string; // Landmark/Notes field
  
  // Permanent address fields (when not same as current)
  permanentAddressStreet?: string;
  permanentAddressBarangay?: string;
  permanentAddressMunicipality?: string;
  permanentAddressProvince?: string;
  permanentAddressRegion?: string;
  permanentAddressCountry?: string;
  permanentAddressZip?: string;
  
  // Current Address fields (for admin)
  currentStreet?: string;
  currentBarangay?: string;
  currentMunicipality?: string;
  currentProvince?: string;
  currentRegion?: string;
  currentZipCode?: string;
  currentLandmark?: string;
  
  // Institutional (student)
  department?: string;
  course?: string;
  yearLevel?: string;
  block?: string;
  studentId?: string;
  
  // Institutional (admin)
  adminId?: string;
  position?: string;
  
  // Security
  password?: string;
  confirmPassword?: string;
}

interface RegistrationContextValue {
  data: RegistrationData;
  update: (partial: Partial<RegistrationData>) => void;
  reset: () => void;
}

const KEY = "jrmsu_registration_draft";
const RegistrationContext = createContext<RegistrationContextValue | undefined>(undefined);

const defaultData: RegistrationData = {
  role: "student",
  firstName: "",
  middleName: "",
  lastName: "",
  birthdate: "",
  age: "",
  gender: "",
  email: "",
  phone: "",
  addressStreet: "",
  addressBarangay: "",
  addressMunicipality: "",
  addressProvince: "",
  addressRegion: "",
  addressCountry: "Philippines",
  addressZip: "",
  address: "",
  addressPermanent: "",
  sameAsCurrent: false,
  addressPermanentNotes: "",
  permanentAddressStreet: "",
  permanentAddressBarangay: "",
  permanentAddressMunicipality: "",
  permanentAddressProvince: "",
  permanentAddressRegion: "",
  permanentAddressCountry: "Philippines",
  permanentAddressZip: "",
};

export function RegistrationProvider({ children }: { children: React.ReactNode }) {
  const initial = (() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as RegistrationData) : defaultData;
    } catch {
      return defaultData;
    }
  })();
  const [data, setData] = useState<RegistrationData>(initial);

  const update = (partial: Partial<RegistrationData>) => {
    setData((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const reset = () => {
    localStorage.removeItem(KEY);
    setData(defaultData);
  };

  const value = useMemo(() => ({ data, update, reset }), [data]);
  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export function useRegistration() {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error("useRegistration must be used within RegistrationProvider");
  return ctx;
}


