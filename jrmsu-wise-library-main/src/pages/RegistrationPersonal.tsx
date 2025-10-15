import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/context/RegistrationContext";
import { useEffect, useMemo, useState } from "react";

const RegistrationPersonal = () => {
  const navigate = useNavigate();
  const { data, update } = useRegistration();
  const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || ""), [data.email]);
  const firstOk = useMemo(() => /^[A-Za-z]{2,}$/.test(data.firstName || ""), [data.firstName]);
  const middleOk = useMemo(() => !data.middleName || /^[A-Za-z]+$/.test(data.middleName), [data.middleName]);
  const lastOk = useMemo(() => /^[A-Za-z]{2,}$/.test(data.lastName || ""), [data.lastName]);
  const birthOk = useMemo(() => {
    if (!data.birthdate) return false;
    const d = new Date(data.birthdate);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    if (d > today) return false;
    const age = today.getFullYear() - d.getFullYear() - (today < new Date(today.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
    return age >= 16;
  }, [data.birthdate]);
  const phoneOk = useMemo(() => {
    const v = (data.phone || "").trim();
    return /^09\d{9}$/.test(v) || /^\+639\d{9}$/.test(v);
  }, [data.phone]);
  const barangayOk = Boolean(data.addressBarangay?.trim());
  const municipalityOk = Boolean(data.addressMunicipality?.trim());
  const provinceOk = Boolean(data.addressProvince?.trim());
  const countryOk = Boolean(data.addressCountry?.trim());
  const zipOk = useMemo(() => /^\d{4}$/.test(data.addressZip || ""), [data.addressZip]);

  const allValid = firstOk && lastOk && birthOk && emailOk && phoneOk && barangayOk && municipalityOk && provinceOk && countryOk && zipOk;
  const [showErrors, setShowErrors] = useState(false);
  const [sameAsCurrent, setSameAsCurrent] = useState(false);

  useEffect(() => {
    if (sameAsCurrent) {
      const currentAddr = [data.addressStreet, data.addressBarangay, data.addressMunicipality, data.addressProvince, data.addressCountry, data.addressZip]
        .filter(Boolean)
        .join(", ");
      update({ addressPermanent: currentAddr });
    }
  }, [sameAsCurrent, data.addressStreet, data.addressBarangay, data.addressMunicipality, data.addressProvince, data.addressCountry, data.addressZip]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl shadow-jrmsu-gold">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Phase 2 of 4: Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first">First Name *</Label>
              <Input id="first" value={data.firstName} onChange={(e) => update({ firstName: e.target.value })} className={!firstOk && showErrors ? "border-destructive" : undefined} />
              {!firstOk && showErrors && (
                <p className="text-xs text-destructive">⚠️ Please fill in all required (*) fields. These are part of your credentials.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="middle">Middle Name</Label>
              <Input id="middle" value={data.middleName} onChange={(e) => update({ middleName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last">Last Name *</Label>
              <Input id="last" value={data.lastName} onChange={(e) => update({ lastName: e.target.value })} className={!lastOk && showErrors ? "border-destructive" : undefined} />
              {!lastOk && showErrors && (
                <p className="text-xs text-destructive">⚠️ Please fill in all required (*) fields. These are part of your credentials.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="suffix">Suffix</Label>
              <Input id="suffix" placeholder="Jr., Sr., II" value={data.suffix || ""} onChange={(e) => update({ suffix: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="birth">Birthdate *</Label>
              <Input id="birth" type="date" value={data.birthdate} onChange={(e) => update({ birthdate: e.target.value })} className={!birthOk && showErrors ? "border-destructive" : undefined} />
              {!birthOk && showErrors && (
                <p className="text-xs text-destructive">⚠️ Please fill in all required (*) fields. These are part of your credentials.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Input id="gender" placeholder="Male/Female/Prefer not to say" value={data.gender || ""} onChange={(e) => update({ gender: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={data.email} onChange={(e) => update({ email: e.target.value })} className={!emailOk && showErrors ? "border-destructive" : undefined} />
              {!emailOk && showErrors && (
                <p className="text-xs text-destructive">⚠️ Please fill in all required (*) fields. These are part of your credentials.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" value={data.phone} onChange={(e) => update({ phone: e.target.value })} className={!phoneOk && showErrors ? "border-destructive" : undefined} />
              {!phoneOk && showErrors && (
                <p className="text-xs text-destructive">⚠️ Please fill in all required (*) fields. These are part of your credentials.</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street</Label>
              <Input id="street" value={data.addressStreet || ""} onChange={(e) => update({ addressStreet: e.target.value.slice(0, 100) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brgy">Barangay *</Label>
              <Input id="brgy" value={data.addressBarangay || ""} onChange={(e) => update({ addressBarangay: e.target.value })} className={!barangayOk && showErrors ? "border-destructive" : undefined} />
              {!barangayOk && showErrors && (<p className="text-xs text-destructive">⚠️ Please fill in all required (*) fields. These are part of your credentials.</p>)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mun">Municipality *</Label>
              <Input id="mun" value={data.addressMunicipality || ""} onChange={(e) => update({ addressMunicipality: e.target.value })} className={!municipalityOk && showErrors ? "border-destructive" : undefined} />
              {!municipalityOk && showErrors && (<p className="text-xs text-destructive">⚠️ Please fill in all required (*) fields. These are part of your credentials.</p>)}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="prov">Province *</Label>
              <Input id="prov" value={data.addressProvince || ""} onChange={(e) => update({ addressProvince: e.target.value })} className={!provinceOk && showErrors ? "border-destructive" : undefined} />
              {!provinceOk && showErrors && (<p className="text-xs text-destructive">⚠️ Please fill in all required (*) fields. These are part of your credentials.</p>)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input id="country" value={data.addressCountry || ""} onChange={(e) => update({ addressCountry: e.target.value })} className={!countryOk && showErrors ? "border-destructive" : undefined} />
              {!countryOk && showErrors && (<p className="text-xs text-destructive">⚠️ Please fill in all required (*) fields. These are part of your credentials.</p>)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">Zip Code *</Label>
              <Input id="zip" value={data.addressZip || ""} onChange={(e) => update({ addressZip: e.target.value })} className={!zipOk && showErrors ? "border-destructive" : undefined} />
              {!zipOk && showErrors && (<p className="text-xs text-destructive">⚠️ Please fill in all required (*) fields. These are part of your credentials.</p>)}
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label htmlFor="perm">Permanent Address</Label>
            <Input id="perm" value={data.addressPermanent || ""} onChange={(e) => update({ addressPermanent: e.target.value })} />
            <Label htmlFor="notes">Landmark / Notes</Label>
            <Input id="notes" placeholder="near the church, in front of a sari-sari store" value={data.addressPermanentNotes || ""} onChange={(e) => update({ addressPermanentNotes: e.target.value })} />
            <div className="flex items-center gap-2 mt-2">
              <input id="sameaddr" type="checkbox" checked={sameAsCurrent} onChange={(e) => setSameAsCurrent(e.target.checked)} />
              <Label htmlFor="sameaddr">Same as Current Address</Label>
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => navigate("/register")}>Back</Button>
            <Button disabled={!allValid} onClick={() => { if (!allValid) { setShowErrors(true); return; } navigate("/register/institution"); }}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationPersonal;


