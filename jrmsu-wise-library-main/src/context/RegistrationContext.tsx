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
  age: string;
  gender?: string;
  email: string;
  phone: string;
  // Address (current)
  addressStreet?: string;
  addressBarangay?: string;
  addressMunicipality?: string;
  addressProvince?: string;
  addressCountry?: string;
  addressZip?: string;
  // Permanent address and notes
  address: string;
  addressPermanent?: string;
  addressPermanentNotes?: string;
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
  addressCountry: "",
  addressZip: "",
  address: "",
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


