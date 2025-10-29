import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, useLocation } from "react-router-dom";
import { useRegistration } from "@/context/RegistrationContext";
import { useEffect, useMemo, useState } from "react";
import { 
  getRegionNames, 
  getProvinceNames, 
  getMunicipalityNames, 
  getZipCode,
  searchRegions,
  searchProvinces, 
  searchMunicipalities
} from "@/data/philippines-geography";
import { NavigationProgress } from "@/components/ui/navigation-progress";

const RegistrationPersonal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, update } = useRegistration();
  
  // Check URL parameters to determine navigation source
  const urlParams = new URLSearchParams(location.search);
  const fromSource = urlParams.get('from');
  const userType = urlParams.get('type') || data.role;
  const [showErrors, setShowErrors] = useState(false);
  const [sameAsCurrent, setSameAsCurrent] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [regionOpen, setRegionOpen] = useState(false);
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [municipalityOpen, setMunicipalityOpen] = useState(false);
  const [ageOpen, setAgeOpen] = useState(false);
  // Permanent address selectors
  const [permRegionOpen, setPermRegionOpen] = useState(false);
  const [permProvinceOpen, setPermProvinceOpen] = useState(false);
  const [permMunicipalityOpen, setPermMunicipalityOpen] = useState(false);
  const [permSelectedRegion, setPermSelectedRegion] = useState("");
  const [permSelectedProvince, setPermSelectedProvince] = useState("");
  const [permSelectedMunicipality, setPermSelectedMunicipality] = useState("");

  // Real-time validation for required fields
  const firstNameOk = useMemo(() => Boolean(data.firstName?.trim()), [data.firstName]);
  const middleNameOk = useMemo(() => Boolean(data.middleName?.trim()), [data.middleName]);
  const lastNameOk = useMemo(() => Boolean(data.lastName?.trim()), [data.lastName]);
  const birthdateOk = useMemo(() => {
    if (!data.birthdate) return false;
    const d = new Date(data.birthdate);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    if (d > today) return false;
    const age = today.getFullYear() - d.getFullYear() - (today < new Date(today.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
    return age >= 16;
  }, [data.birthdate]);
  const genderOk = useMemo(() => Boolean(data.gender?.trim()), [data.gender]);
  const emailOk = useMemo(() => {
    const email = data.email || "";
    return email.includes("@") && email.includes(".com");
  }, [data.email]);
  const phoneOk = useMemo(() => {
    const v = (data.phone || "").trim();
    return /^09\d{9}$/.test(v) || /^\+639\d{9}$/.test(v);
  }, [data.phone]);
  const regionOk = Boolean(data.addressRegion?.trim());
  const provinceOk = Boolean(data.addressProvince?.trim());
  const municipalityOk = Boolean(data.addressMunicipality?.trim());
  const countryOk = Boolean(data.addressCountry?.trim());
  const zipOk = useMemo(() => /^\d{4}$/.test(data.addressZip || ""), [data.addressZip]);
  const barangayOk = Boolean(data.addressBarangay?.trim());
  const permanentAddressOk = Boolean(data.addressPermanent?.trim());
  const ageOk = useMemo(() => {
    const age = parseInt(data.age || "");
    return !isNaN(age) && age >= 16 && age <= 100;
  }, [data.age]);

  // All required fields validation (Note: Barangay is now required as manual input)
  const allValid = firstNameOk && middleNameOk && lastNameOk && ageOk && birthdateOk && genderOk && 
    emailOk && phoneOk && regionOk && provinceOk && municipalityOk && barangayOk && 
    countryOk && zipOk && permanentAddressOk;

  // Initialize country as Philippines
  useEffect(() => {
    if (!data.addressCountry) {
      update({ addressCountry: "Philippines" });
    }
  }, []);

  // Get current provinces based on selected region
  const currentProvinces = useMemo(() => {
    return selectedRegion ? getProvinceNames(selectedRegion) : [];
  }, [selectedRegion]);

  // Get current municipalities based on selected region and province
  const currentMunicipalities = useMemo(() => {
    return selectedRegion && selectedProvince ? 
      getMunicipalityNames(selectedRegion, selectedProvince) : [];
  }, [selectedRegion, selectedProvince]);

  // Permanent address dependent lists
  const permanentProvinces = useMemo(() => {
    return permSelectedRegion ? getProvinceNames(permSelectedRegion) : [];
  }, [permSelectedRegion]);

  const permanentMunicipalities = useMemo(() => {
    return permSelectedRegion && permSelectedProvince ?
      getMunicipalityNames(permSelectedRegion, permSelectedProvince) : [];
  }, [permSelectedRegion, permSelectedProvince]);

  // Auto-fill zip code when Region, Province, and Municipality are selected
  useEffect(() => {
    if (selectedRegion && selectedProvince && selectedMunicipality) {
      // Use official ZIP code from processed data
      const zipCode = getZipCode(selectedRegion, selectedProvince, selectedMunicipality);
      if (zipCode) {
        update({ addressZip: zipCode });
      }
    }
  }, [selectedRegion, selectedProvince, selectedMunicipality, update]);

  // Auto-fill permanent ZIP code when permanent Region/Province/Municipality are selected
  useEffect(() => {
    if (permSelectedRegion && permSelectedProvince && permSelectedMunicipality) {
      const zip = getZipCode(permSelectedRegion, permSelectedProvince, permSelectedMunicipality);
      if (zip) {
        update({ permanentAddressZip: zip });
      }
    }
  }, [permSelectedRegion, permSelectedProvince, permSelectedMunicipality, update]);

  // Handle same as current address checkbox
  useEffect(() => {
    if (sameAsCurrent) {
      const currentAddr = [data.addressStreet, data.addressBarangay, data.addressMunicipality, 
        data.addressProvince, data.addressRegion, data.addressCountry, data.addressZip]
        .filter(Boolean)
        .join(", ");
      
      // Update both the permanent address string and the individual components
      update({ 
        addressPermanent: currentAddr,
        permanentAddressStreet: data.addressStreet,
        permanentAddressBarangay: data.addressBarangay,
        permanentAddressMunicipality: data.addressMunicipality,
        permanentAddressProvince: data.addressProvince,
        permanentAddressRegion: data.addressRegion,
        permanentAddressCountry: data.addressCountry,
        permanentAddressZip: data.addressZip,
        sameAsCurrent: true
      });
    } else {
      // Clear permanent address components when not same as current
      update({ 
        sameAsCurrent: false 
      });
    }
  }, [sameAsCurrent, data.addressStreet, data.addressBarangay, data.addressMunicipality, 
      data.addressProvince, data.addressRegion, data.addressCountry, data.addressZip]);

  // Auto-sync permanent address string when individual permanent address fields change
  useEffect(() => {
    if (!sameAsCurrent && (data.permanentAddressRegion || data.permanentAddressProvince || 
        data.permanentAddressMunicipality || data.permanentAddressBarangay)) {
      const permanentAddr = [data.permanentAddressStreet, data.permanentAddressBarangay, 
        data.permanentAddressMunicipality, data.permanentAddressProvince, 
        data.permanentAddressRegion, data.permanentAddressCountry || 'Philippines', 
        data.permanentAddressZip]
        .filter(Boolean)
        .join(", ");
      
      if (permanentAddr !== data.addressPermanent) {
        update({ addressPermanent: permanentAddr });
      }
    }
  }, [sameAsCurrent, data.permanentAddressStreet, data.permanentAddressBarangay, 
      data.permanentAddressMunicipality, data.permanentAddressProvince, 
      data.permanentAddressRegion, data.permanentAddressCountry, data.permanentAddressZip]);

  // Smart back navigation handler
  const handleBackNavigation = () => {
    if (fromSource === 'student-management') {
      navigate('/students');
    } else if (fromSource === 'admin-management') {
      navigate('/admins');
    } else {
      // Default behavior - go back to registration select (Phase 1)
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl shadow-jrmsu-gold">
        <CardHeader>
          <NavigationProgress currentStep={2} totalSteps={4} />
          <CardTitle className="text-2xl text-primary mt-4">Phase 2 of 4: Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input 
                id="firstName" 
                value={data.firstName || ""} 
                onChange={(e) => update({ firstName: e.target.value })}
                className={!firstNameOk && showErrors ? "border-destructive" : undefined}
              />
              {!firstNameOk && showErrors && (
                <p className="text-xs text-destructive">⚠ Please fill in all required (*) fields. These are part of your credentials.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name *</Label>
              <Input 
                id="middleName" 
                value={data.middleName || ""} 
                onChange={(e) => update({ middleName: e.target.value })}
                className={!middleNameOk && showErrors ? "border-destructive" : undefined}
              />
              {!middleNameOk && showErrors && (
                <p className="text-xs text-destructive">⚠ Please fill in all required (*) fields. These are part of your credentials.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input 
                id="lastName" 
                value={data.lastName || ""} 
                onChange={(e) => update({ lastName: e.target.value })}
                className={!lastNameOk && showErrors ? "border-destructive" : undefined}
              />
              {!lastNameOk && showErrors && (
                <p className="text-xs text-destructive">⚠ Please fill in all required (*) fields. These are part of your credentials.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="suffix">Suffix</Label>
              <Input 
                id="suffix" 
                placeholder="Jr., Sr., II" 
                value={data.suffix || ""} 
                onChange={(e) => update({ suffix: e.target.value })}
              />
            </div>
          </div>

          {/* Personal Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <div className="relative">
                <Input 
                  id="age" 
                  type="number"
                  min="16"
                  max="100"
                  placeholder="Age"
                  value={data.age || ""} 
                  onChange={(e) => update({ age: e.target.value })}
                  className={`pr-10 ${data.age && (parseInt(data.age) < 16 || parseInt(data.age) > 100) && showErrors ? "border-destructive" : ""}`}
                />
                <Popover open={ageOpen} onOpenChange={setAgeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      aria-label="Select age"
                    >
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-32 p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search age..." />
                      <CommandEmpty>No age found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {Array.from({length: 85}, (_, i) => i + 16).map(age => (
                          <CommandItem
                            key={age}
                            value={age.toString()}
                            onSelect={(value) => {
                              update({ age: value });
                              setAgeOpen(false);
                            }}
                          >
                            <Check className={`mr-2 h-4 w-4 ${data.age === age.toString() ? "opacity-100" : "opacity-0"}`} />
                            {age}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              {data.age && (parseInt(data.age) < 16 || parseInt(data.age) > 100) && showErrors && (
                <p className="text-xs text-destructive">⚠ Age must be between 16-100 years.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthdate">Birthdate *</Label>
              <Input 
                id="birthdate" 
                type="date" 
                value={data.birthdate || ""} 
                onChange={(e) => update({ birthdate: e.target.value })}
                className={!birthdateOk && showErrors ? "border-destructive" : undefined}
              />
              <p className="text-[11px] text-muted-foreground">MM/DD/YYYY</p>
              {!birthdateOk && showErrors && (
                <p className="text-xs text-destructive">⚠ Please fill in all required (*) fields. These are part of your credentials.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Gender *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={data.gender === "Male" ? "default" : "outline"}
                  className={`flex-1 ${
                    data.gender === "Male" 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-primary/10"
                  }`}
                  onClick={() => update({ gender: "Male" })}
                >
                  Male
                </Button>
                <Button
                  type="button"
                  variant={data.gender === "Female" ? "default" : "outline"}
                  className={`flex-1 ${
                    data.gender === "Female" 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-primary/10"
                  }`}
                  onClick={() => update({ gender: "Female" })}
                >
                  Female
                </Button>
              </div>
              {!genderOk && showErrors && (
                <p className="text-xs text-destructive">⚠️ Please select your gender.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email" 
                value={data.email || ""} 
                onChange={(e) => update({ email: e.target.value })}
                className={!emailOk && showErrors ? "border-destructive" : undefined}
              />
              {!emailOk && showErrors && (
                <p className="text-xs text-destructive">⚠ Invalid email format. Please enter a valid email address.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input 
                id="phone" 
                placeholder="09123456789" 
                value={data.phone || ""} 
                onChange={(e) => update({ phone: e.target.value })}
                className={!phoneOk && showErrors ? "border-destructive" : undefined}
              />
              {!phoneOk && showErrors && (
                <p className="text-xs text-destructive">⚠️ Please enter a valid Philippine phone number.</p>
              )}
            </div>
          </div>

          {/* Permanent Address Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">Permanent Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">Region *</Label>
              <Popover open={regionOpen} onOpenChange={setRegionOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={regionOpen}
                    className={`w-full justify-between ${!regionOk && showErrors ? "border-destructive" : ""}`}
                  >
                    <span className="truncate">{selectedRegion || "Select Region..."}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search region..." />
                    <CommandEmpty>No region found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {getRegionNames().map((region) => (
                        <CommandItem
                          key={region}
                          value={region}
                          onSelect={() => {
                            setSelectedRegion(region);
                            setSelectedProvince("");
                            setSelectedMunicipality("");
                            update({ 
                              addressRegion: region,
                              addressProvince: "", 
                              addressMunicipality: "",
                              addressBarangay: ""
                            });
                            setRegionOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedRegion === region ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          {region}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {!regionOk && showErrors && (
                <p className="text-xs text-destructive">⚠ Please fill in all required (*) fields.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Province *</Label>
              <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={provinceOpen}
                    disabled={!selectedRegion}
                    className={`w-full justify-between ${!provinceOk && showErrors ? "border-destructive" : ""}`}
                  >
                    <span className="truncate">
                      {selectedProvince
                        ? selectedProvince
                        : selectedRegion ? "Select Province..." : "Select Region First"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search province..." />
                    <CommandEmpty>No province found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {currentProvinces.map((province) => (
                        <CommandItem
                          key={province}
                          value={province}
                          onSelect={() => {
                            setSelectedProvince(province);
                            setSelectedMunicipality("");
                            update({ 
                              addressProvince: province, 
                              addressMunicipality: "",
                              addressBarangay: ""
                            });
                            setProvinceOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedProvince === province ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          {province}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {!provinceOk && showErrors && (
                <p className="text-xs text-destructive">⚠ Please fill in all required (*) fields.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipality">Municipality/City *</Label>
              <Popover open={municipalityOpen} onOpenChange={setMunicipalityOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={municipalityOpen}
                    disabled={!selectedProvince}
                    className={`w-full justify-between ${!municipalityOk && showErrors ? "border-destructive" : ""}`}
                  >
                    <span className="truncate">
                      {selectedMunicipality
                        ? selectedMunicipality
                        : selectedProvince ? "Select Municipality/City..." : "Select Province First"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0">
                  <Command>
                    <CommandInput placeholder="Search municipality/city..." />
                    <CommandEmpty>No municipality/city found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {currentMunicipalities.map((municipality) => (
                        <CommandItem
                          key={municipality}
                          value={municipality}
                          onSelect={() => {
                            setSelectedMunicipality(municipality);
                            update({ 
                              addressMunicipality: municipality, 
                              addressBarangay: "" 
                            });
                            setMunicipalityOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedMunicipality === municipality ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          {municipality}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {!municipalityOk && showErrors && (
                <p className="text-xs text-destructive">⚠ Please fill in all required (*) fields.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select value="Philippines" disabled>
                <SelectTrigger>
                  <SelectValue>Philippines</SelectValue>
                </SelectTrigger>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barangay">Barangay *</Label>
              <Input 
                id="barangay" 
                placeholder="Enter your barangay" 
                value={data.addressBarangay || ""} 
                onChange={(e) => update({ addressBarangay: e.target.value })}
                className={!barangayOk && showErrors ? "border-destructive" : undefined}
              />
              {!barangayOk && showErrors && (
                <p className="text-xs text-destructive">⚠ Please enter your barangay.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="street">Street</Label>
              <Input 
                id="street" 
                placeholder="Optional" 
                value={data.addressStreet || ""} 
                onChange={(e) => update({ addressStreet: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code *</Label>
              <Input 
                id="zipCode" 
                placeholder="Auto-fills after selections" 
                value={data.addressZip || ""} 
                onChange={(e) => update({ addressZip: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                className={!zipOk && showErrors ? "border-destructive" : undefined}
                disabled={Boolean(selectedRegion && selectedProvince && selectedMunicipality)}
              />
              {!zipOk && showErrors && (
                <p className="text-xs text-destructive">⚠ Please fill in all required (*) fields.</p>
              )}
            </div>
            </div>
          </div>

          {/* Current Address Section (For Admin only, optional for students) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary">Current Address</h3>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="sameAsCurrent" 
                  checked={sameAsCurrent}
                  onCheckedChange={(checked) => {
                    setSameAsCurrent(checked as boolean);
                    if (checked) {
                      // Copy permanent to current address
                      update({ 
                        currentStreet: data.addressStreet,
                        currentBarangay: data.addressBarangay,
                        currentMunicipality: data.addressMunicipality,
                        currentProvince: data.addressProvince,
                        currentRegion: data.addressRegion,
                        currentZipCode: data.addressZip,
                        sameAsCurrent: true
                      });
                    } else {
                      update({ sameAsCurrent: false });
                    }
                  }}
                />
                <Label htmlFor="sameAsCurrent" className="text-sm font-medium cursor-pointer">
                  Same as Permanent Address
                </Label>
              </div>
            </div>

            {/* Current Address Fields */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${sameAsCurrent ? "opacity-50" : ""}`}>
              <div className="space-y-2">
                <Label htmlFor="currentStreet">Street (Optional)</Label>
                <Input 
                  id="currentStreet"
                  placeholder="Street address"
                  value={data.currentStreet || ""}
                  onChange={(e) => update({ currentStreet: e.target.value })}
                  disabled={sameAsCurrent}
                  className={sameAsCurrent ? "bg-muted/50 cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentBarangay">Barangay *</Label>
                <Input 
                  id="currentBarangay"
                  placeholder="Barangay"
                  value={data.currentBarangay || ""}
                  onChange={(e) => update({ currentBarangay: e.target.value })}
                  disabled={sameAsCurrent}
                  className={sameAsCurrent ? "bg-muted/50 cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentMunicipality">Municipality/City *</Label>
                <Input 
                  id="currentMunicipality"
                  placeholder="Municipality/City"
                  value={data.currentMunicipality || ""}
                  onChange={(e) => update({ currentMunicipality: e.target.value })}
                  disabled={sameAsCurrent}
                  className={sameAsCurrent ? "bg-muted/50 cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentProvince">Province *</Label>
                <Input 
                  id="currentProvince"
                  placeholder="Province"
                  value={data.currentProvince || ""}
                  onChange={(e) => update({ currentProvince: e.target.value })}
                  disabled={sameAsCurrent}
                  className={sameAsCurrent ? "bg-muted/50 cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentRegion">Region *</Label>
                <Input 
                  id="currentRegion"
                  placeholder="Region"
                  value={data.currentRegion || ""}
                  onChange={(e) => update({ currentRegion: e.target.value })}
                  disabled={sameAsCurrent}
                  className={sameAsCurrent ? "bg-muted/50 cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentZip">Zip Code *</Label>
                <Input 
                  id="currentZip"
                  placeholder="Zip Code"
                  value={data.currentZipCode || ""}
                  onChange={(e) => update({ currentZipCode: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  disabled={sameAsCurrent}
                  className={sameAsCurrent ? "bg-muted/50 cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-2 lg:col-span-3">
                <Label htmlFor="currentLandmark">Landmark / Notes (Optional)</Label>
                <Input 
                  id="currentLandmark"
                  placeholder="e.g., near the church, in front of a sari-sari store"
                  value={data.currentLandmark || ""}
                  onChange={(e) => update({ currentLandmark: e.target.value })}
                  disabled={sameAsCurrent}
                  className={sameAsCurrent ? "bg-muted/50 cursor-not-allowed" : ""}
                />
              </div>
            </div>
          </div>

          {/* Old Permanent Address Section - REMOVE THIS */}
          <div className="hidden">
            {/* Permanent Address Input */}
            <div className="space-y-2">
              <Label htmlFor="permanentAddress">Permanent Address *</Label>
              <div className={sameAsCurrent ? "opacity-50" : ""}>
                {sameAsCurrent ? (
                  <Input 
                    id="permanentAddress" 
                    value={data.addressPermanent || ""} 
                    disabled
                    className="bg-muted/50 text-muted-foreground"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 space-y-0">
                    <div className="space-y-1">
                      <Label className="text-xs">Region *</Label>
                      <Popover open={permRegionOpen} onOpenChange={setPermRegionOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={permRegionOpen}
                            className="w-full justify-between text-sm"
                          >
                            <span className="truncate">{permSelectedRegion || data.permanentAddressRegion || "Select Region..."}</span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search region..." />
                            <CommandEmpty>No region found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-y-auto">
                              {getRegionNames().map((region) => (
                                <CommandItem
                                  key={region}
                                  value={region}
                                  onSelect={() => {
                                    setPermSelectedRegion(region);
                                    setPermSelectedProvince("");
                                    setPermSelectedMunicipality("");
                                    update({
                                      permanentAddressRegion: region,
                                      permanentAddressProvince: "",
                                      permanentAddressMunicipality: "",
                                      permanentAddressBarangay: ""
                                    });
                                    setPermRegionOpen(false);
                                  }}
                                >
                                  <Check className={`mr-2 h-4 w-4 ${permSelectedRegion === region ? "opacity-100" : "opacity-0"}`} />
                                  {region}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Province *</Label>
                      <Popover open={permProvinceOpen} onOpenChange={setPermProvinceOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={permProvinceOpen}
                            disabled={!permSelectedRegion}
                            className="w-full justify-between text-sm"
                          >
                            <span className="truncate">
                              {permSelectedProvince
                                ? permSelectedProvince
                                : permSelectedRegion ? "Select Province..." : "Select Region First"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search province..." />
                            <CommandEmpty>No province found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-y-auto">
                              {permanentProvinces.map((province) => (
                                <CommandItem
                                  key={province}
                                  value={province}
                                  onSelect={() => {
                                    setPermSelectedProvince(province);
                                    setPermSelectedMunicipality("");
                                    update({
                                      permanentAddressProvince: province,
                                      permanentAddressMunicipality: "",
                                      permanentAddressBarangay: ""
                                    });
                                    setPermProvinceOpen(false);
                                  }}
                                >
                                  <Check className={`mr-2 h-4 w-4 ${permSelectedProvince === province ? "opacity-100" : "opacity-0"}`} />
                                  {province}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Municipality/City *</Label>
                      <Popover open={permMunicipalityOpen} onOpenChange={setPermMunicipalityOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={permMunicipalityOpen}
                            disabled={!permSelectedProvince}
                            className="w-full justify-between text-sm"
                          >
                            <span className="truncate">
                              {permSelectedMunicipality
                                ? permSelectedMunicipality
                                : permSelectedProvince ? "Select Municipality/City..." : "Select Province First"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[350px] p-0">
                          <Command>
                            <CommandInput placeholder="Search municipality/city..." />
                            <CommandEmpty>No municipality/city found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-y-auto">
                              {permanentMunicipalities.map((municipality) => (
                                <CommandItem
                                  key={municipality}
                                  value={municipality}
                                  onSelect={() => {
                                    setPermSelectedMunicipality(municipality);
                                    update({
                                      permanentAddressMunicipality: municipality,
                                      permanentAddressBarangay: ""
                                    });
                                    setPermMunicipalityOpen(false);
                                  }}
                                >
                                  <Check className={`mr-2 h-4 w-4 ${permSelectedMunicipality === municipality ? "opacity-100" : "opacity-0"}`} />
                                  {municipality}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Country</Label>
                      <Input
                        value="Philippines"
                        disabled
                        className="bg-muted/50 text-muted-foreground text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Barangay *</Label>
                      <Input
                        placeholder="Barangay"
                        value={data.permanentAddressBarangay || ""}
                        onChange={(e) => update({ permanentAddressBarangay: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Street (Optional)</Label>
                      <Input
                        placeholder="Street"
                        value={data.permanentAddressStreet || ""}
                        onChange={(e) => update({ permanentAddressStreet: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Zip Code *</Label>
                      <Input
                        placeholder="Zip Code"
                        value={data.permanentAddressZip || ""}
                        onChange={(e) => update({ permanentAddressZip: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        className="text-sm"
                        disabled={Boolean(permSelectedRegion && permSelectedProvince && permSelectedMunicipality)}
                      />
                    </div>
                  </div>
                )}
              </div>
              {!sameAsCurrent && (
                <div className="space-y-2 mt-3">
                  <Label htmlFor="permanentAddressText">Complete Permanent Address *</Label>
                  <Input 
                    id="permanentAddressText" 
                    placeholder="Complete permanent address (will auto-populate from fields above)"
                    value={data.addressPermanent || ""} 
                    onChange={(e) => update({ addressPermanent: e.target.value })}
                    className={!permanentAddressOk && showErrors ? "border-destructive" : undefined}
                  />
                </div>
              )}
              {!permanentAddressOk && showErrors && (
                <p className="text-xs text-destructive">⚠️ Please enter your permanent address.</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="landmark">Landmark / Notes</Label>
              <Input 
                id="landmark" 
                placeholder="near the church, in front of a sari-sari store" 
                value={data.addressPermanentNotes || ""} 
                onChange={(e) => update({ addressPermanentNotes: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Optional</p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={handleBackNavigation}>
              {fromSource ? 'Cancel & Return' : 'Back'}
            </Button>
            <Button 
              disabled={!allValid}
              className={!allValid ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary hover:bg-primary/90"}
              onClick={() => {
                if (!allValid) {
                  setShowErrors(true);
                  return;
                }
                navigate("/register/institution");
              }}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationPersonal;


