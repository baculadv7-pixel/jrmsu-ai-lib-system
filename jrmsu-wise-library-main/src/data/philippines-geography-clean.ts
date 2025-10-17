// Clean Philippine Geographic Data - Standardized Regions
// Generated for library system registration
// Contains only the 17 official Philippine regions with standardized naming
// Structure: Region -> Province -> Municipality with ZIP codes
// Note: Barangay is now a manual input field

export interface Municipality {
  name: string;
  zipcode: string;
}

export interface Province {
  name: string;
  municipalities: Municipality[];
}

export interface Region {
  name: string;
  provinces: Province[];
}

export const philippineGeography: Region[] = [
{
  name: "Region I – Ilocos Region",
  provinces: [
  {
    name: "ILOCOS NORTE",
    municipalities: [
    {
      name: "Adams",
      zipcode: "2922"
    },
    {
      name: "Bacarra",
      zipcode: "2916"
    },
    {
      name: "Badoc",
      zipcode: "2904"
    },
    {
      name: "Bangui",
      zipcode: "2920"
    },
    {
      name: "Batac City",
      zipcode: "2906"
    },
    {
      name: "Burgos",
      zipcode: "2918"
    },
    {
      name: "Carasi",
      zipcode: "2911"
    },
    {
      name: "Currimao",
      zipcode: "2903"
    },
    {
      name: "Dingras",
      zipcode: "2913"
    },
    {
      name: "Dumalneg",
      zipcode: "2921"
    },
    {
      name: "Laoag City",
      zipcode: "2900"
    },
    {
      name: "Marcos",
      zipcode: "2907"
    },
    {
      name: "Nueva Era",
      zipcode: "2909"
    },
    {
      name: "Pagudpud",
      zipcode: "2919"
    },
    {
      name: "Paoay",
      zipcode: "2902"
    },
    {
      name: "Pasuquin",
      zipcode: "2917"
    },
    {
      name: "Piddig",
      zipcode: "2912"
    },
    {
      name: "Pinili",
      zipcode: "2905"
    },
    {
      name: "San Nicolas",
      zipcode: "2901"
    },
    {
      name: "Sarrat",
      zipcode: "2914"
    },
    {
      name: "Solsona",
      zipcode: "2910"
    },
    {
      name: "Vintar",
      zipcode: "2915"
    }
    ]
  },
  {
    name: "ILOCOS SUR",
    municipalities: [
    {
      name: "Alilem",
      zipcode: "2716"
    },
    {
      name: "Banayoyo",
      zipcode: "2708"
    },
    {
      name: "Bantay",
      zipcode: "2727"
    },
    {
      name: "Burgos",
      zipcode: "2724"
    },
    {
      name: "Cabugao",
      zipcode: "2732"
    },
    {
      name: "Candon City",
      zipcode: "2710"
    },
    {
      name: "Caoayan",
      zipcode: "2702"
    },
    {
      name: "Cervantes",
      zipcode: "2718"
    },
    {
      name: "Galimuyod",
      zipcode: "2709"
    },
    {
      name: "Gregorio del Pilar",
      zipcode: "2717"
    },
    {
      name: "Lidlidda",
      zipcode: "2723"
    },
    {
      name: "Magsingal",
      zipcode: "2730"
    },
    {
      name: "Nagbukel",
      zipcode: "2719"
    },
    {
      name: "Narvacan",
      zipcode: "2704"
    },
    {
      name: "Quirino",
      zipcode: "2721"
    },
    {
      name: "Salcedo",
      zipcode: "2711"
    },
    {
      name: "San Emilio",
      zipcode: "2720"
    },
    {
      name: "San Esteban",
      zipcode: "2706"
    },
    {
      name: "San Ildefonso",
      zipcode: "2728"
    },
    {
      name: "San Juan",
      zipcode: "2731"
    },
    {
      name: "San Vicente",
      zipcode: "2729"
    },
    {
      name: "Santa",
      zipcode: "2705"
    },
    {
      name: "Santa Catalina",
      zipcode: "2722"
    },
    {
      name: "Santa Cruz",
      zipcode: "2707"
    },
    {
      name: "Santa Lucia",
      zipcode: "2725"
    },
    {
      name: "Santa Maria",
      zipcode: "2726"
    },
    {
      name: "Santiago",
      zipcode: "2703"
    },
    {
      name: "Santo Domingo",
      zipcode: "2712"
    },
    {
      name: "Sigay",
      zipcode: "2715"
    },
    {
      name: "Sinait",
      zipcode: "2733"
    },
    {
      name: "Sugpon",
      zipcode: "2714"
    },
    {
      name: "Suyo",
      zipcode: "2715"
    },
    {
      name: "Tagudin",
      zipcode: "2714"
    },
    {
      name: "Vigan City",
      zipcode: "2700"
    }
    ]
  },
  {
    name: "LA UNION",
    municipalities: [
    {
      name: "Agoo",
      zipcode: "2504"
    },
    {
      name: "Aringay",
      zipcode: "2503"
    },
    {
      name: "Bacnotan",
      zipcode: "2515"
    },
    {
      name: "Bagulin",
      zipcode: "2512"
    },
    {
      name: "Balaoan",
      zipcode: "2517"
    },
    {
      name: "Bangar",
      zipcode: "2519"
    },
    {
      name: "Bauang",
      zipcode: "2501"
    },
    {
      name: "Burgos",
      zipcode: "2510"
    },
    {
      name: "Caba",
      zipcode: "2502"
    },
    {
      name: "Luna",
      zipcode: "2518"
    },
    {
      name: "Naguilian",
      zipcode: "2511"
    },
    {
      name: "Pugo",
      zipcode: "2508"
    },
    {
      name: "Rosario",
      zipcode: "2506"
    },
    {
      name: "San Fernando City",
      zipcode: "2500"
    },
    {
      name: "San Gabriel",
      zipcode: "2513"
    },
    {
      name: "San Juan",
      zipcode: "2514"
    },
    {
      name: "Santo Tomas",
      zipcode: "2505"
    },
    {
      name: "Santol",
      zipcode: "2516"
    },
    {
      name: "Sudipen",
      zipcode: "2520"
    },
    {
      name: "Tubao",
      zipcode: "2509"
    }
    ]
  },
  {
    name: "PANGASINAN",
    municipalities: [
    {
      name: "Agno",
      zipcode: "2408"
    },
    {
      name: "Aguilar",
      zipcode: "2415"
    },
    {
      name: "Alaminos City",
      zipcode: "2404"
    },
    {
      name: "Alcala",
      zipcode: "2425"
    },
    {
      name: "Anda",
      zipcode: "2405"
    },
    {
      name: "Asingan",
      zipcode: "2439"
    },
    {
      name: "Balungao",
      zipcode: "2442"
    },
    {
      name: "Bani",
      zipcode: "2407"
    },
    {
      name: "Basista",
      zipcode: "2422"
    },
    {
      name: "Bautista",
      zipcode: "2424"
    },
    {
      name: "Bayambang",
      zipcode: "2423"
    },
    {
      name: "Binmaley",
      zipcode: "2417"
    },
    {
      name: "Bolinao",
      zipcode: "2406"
    },
    {
      name: "Bugallon",
      zipcode: "2416"
    },
    {
      name: "Burgos",
      zipcode: "2410"
    },
    {
      name: "Calasiao",
      zipcode: "2418"
    },
    {
      name: "Dagupan City",
      zipcode: "2400"
    },
    {
      name: "Dasol",
      zipcode: "2411"
    },
    {
      name: "Infanta",
      zipcode: "2412"
    },
    {
      name: "Labrador",
      zipcode: "2402"
    },
    {
      name: "Lingayen",
      zipcode: "2401"
    },
    {
      name: "Mabini",
      zipcode: "2409"
    },
    {
      name: "Malasiqui",
      zipcode: "2421"
    },
    {
      name: "Manaoag",
      zipcode: "2430"
    },
    {
      name: "Mangaldan",
      zipcode: "2432"
    },
    {
      name: "Mangatarem",
      zipcode: "2413"
    },
    {
      name: "Mapandan",
      zipcode: "2429"
    },
    {
      name: "Natividad",
      zipcode: "2446"
    },
    {
      name: "Pozorrubio",
      zipcode: "2435"
    },
    {
      name: "Rosales",
      zipcode: "2441"
    },
    {
      name: "San Carlos City",
      zipcode: "2420"
    },
    {
      name: "San Fabian",
      zipcode: "2433"
    },
    {
      name: "San Jacinto",
      zipcode: "2431"
    },
    {
      name: "San Manuel",
      zipcode: "2438"
    },
    {
      name: "San Nicolas",
      zipcode: "2447"
    },
    {
      name: "San Quintin",
      zipcode: "2444"
    },
    {
      name: "Santa Barbara",
      zipcode: "2419"
    },
    {
      name: "Santa Maria",
      zipcode: "2440"
    },
    {
      name: "Santo Tomas",
      zipcode: "2437"
    },
    {
      name: "Sison",
      zipcode: "2434"
    },
    {
      name: "Sual",
      zipcode: "2403"
    },
    {
      name: "Tayug",
      zipcode: "2445"
    },
    {
      name: "Umingan",
      zipcode: "2443"
    },
    {
      name: "Urbiztondo",
      zipcode: "2414"
    },
    {
      name: "Urdaneta City",
      zipcode: "2428"
    },
    {
      name: "Villasis",
      zipcode: "2427"
    }
    ]
  }
  ]
},
{
  name: "Region II – Cagayan Valley",
  provinces: [
  {
    name: "BATANES",
    municipalities: [
    {
      name: "Basco",
      zipcode: "3900"
    },
    {
      name: "Itbayat",
      zipcode: "3901"
    },
    {
      name: "Ivana",
      zipcode: "3902"
    },
    {
      name: "Mahatao",
      zipcode: "3903"
    },
    {
      name: "Sabtang",
      zipcode: "3904"
    },
    {
      name: "Uyugan",
      zipcode: "3905"
    }
    ]
  },
  {
    name: "CAGAYAN",
    municipalities: [
    {
      name: "Abulug",
      zipcode: "3528"
    },
    {
      name: "Alcala",
      zipcode: "3523"
    },
    {
      name: "Allacapan",
      zipcode: "3524"
    },
    {
      name: "Amulung",
      zipcode: "3514"
    },
    {
      name: "Aparri",
      zipcode: "3515"
    },
    {
      name: "Baggao",
      zipcode: "3505"
    },
    {
      name: "Ballesteros",
      zipcode: "3527"
    },
    {
      name: "Buguey",
      zipcode: "3518"
    },
    {
      name: "Calayan",
      zipcode: "3530"
    },
    {
      name: "Camalaniugan",
      zipcode: "3516"
    },
    {
      name: "Claveria",
      zipcode: "3519"
    },
    {
      name: "Enrile",
      zipcode: "3508"
    },
    {
      name: "Gattaran",
      zipcode: "3506"
    },
    {
      name: "Gonzaga",
      zipcode: "3517"
    },
    {
      name: "Iguig",
      zipcode: "3509"
    },
    {
      name: "Lal-lo",
      zipcode: "3512"
    },
    {
      name: "Lasam",
      zipcode: "3504"
    },
    {
      name: "Pamplona",
      zipcode: "3529"
    },
    {
      name: "Peñablanca",
      zipcode: "3511"
    },
    {
      name: "Piat",
      zipcode: "3507"
    },
    {
      name: "Rizal",
      zipcode: "3513"
    },
    {
      name: "Sanchez-Mira",
      zipcode: "3526"
    },
    {
      name: "Santa Ana",
      zipcode: "3520"
    },
    {
      name: "Santa Praxedes",
      zipcode: "3525"
    },
    {
      name: "Santa Teresita",
      zipcode: "3522"
    },
    {
      name: "Santo Niño",
      zipcode: "3521"
    },
    {
      name: "Solana",
      zipcode: "3510"
    },
    {
      name: "Tuguegarao City",
      zipcode: "3500"
    }
    ]
  },
  {
    name: "ISABELA",
    municipalities: [
    {
      name: "Alicia",
      zipcode: "3306"
    },
    {
      name: "Angadanan",
      zipcode: "3307"
    },
    {
      name: "Aurora",
      zipcode: "3308"
    },
    {
      name: "Benito Soliven",
      zipcode: "3309"
    },
    {
      name: "Burgos",
      zipcode: "3310"
    },
    {
      name: "Cabagan",
      zipcode: "3328"
    },
    {
      name: "Cabatuan",
      zipcode: "3311"
    },
    {
      name: "Cordon",
      zipcode: "3312"
    },
    {
      name: "Delfin Albano",
      zipcode: "3313"
    },
    {
      name: "Dinapigue",
      zipcode: "3314"
    },
    {
      name: "Divilacan",
      zipcode: "3315"
    },
    {
      name: "Echague",
      zipcode: "3309"
    },
    {
      name: "Gamu",
      zipcode: "3316"
    },
    {
      name: "Ilagan City",
      zipcode: "3300"
    },
    {
      name: "Jones",
      zipcode: "3317"
    },
    {
      name: "Luna",
      zipcode: "3318"
    },
    {
      name: "Maconacon",
      zipcode: "3319"
    },
    {
      name: "Mallig",
      zipcode: "3320"
    },
    {
      name: "Naguilian",
      zipcode: "3321"
    },
    {
      name: "Palanan",
      zipcode: "3322"
    },
    {
      name: "Quezon",
      zipcode: "3323"
    },
    {
      name: "Quirino",
      zipcode: "3324"
    },
    {
      name: "Ramon",
      zipcode: "3325"
    },
    {
      name: "Reina Mercedes",
      zipcode: "3326"
    },
    {
      name: "Roxas",
      zipcode: "3327"
    },
    {
      name: "San Agustin",
      zipcode: "3328"
    },
    {
      name: "San Guillermo",
      zipcode: "3329"
    },
    {
      name: "San Isidro",
      zipcode: "3330"
    },
    {
      name: "San Manuel",
      zipcode: "3331"
    },
    {
      name: "San Mariano",
      zipcode: "3332"
    },
    {
      name: "San Mateo",
      zipcode: "3333"
    },
    {
      name: "San Pablo",
      zipcode: "3334"
    },
    {
      name: "Santa Maria",
      zipcode: "3335"
    },
    {
      name: "Santiago City",
      zipcode: "3301"
    },
    {
      name: "Santo Tomas",
      zipcode: "3336"
    },
    {
      name: "Tumauini",
      zipcode: "3337"
    }
    ]
  },
  {
    name: "NUEVA VIZCAYA",
    municipalities: [
    {
      name: "Alfonso Castañeda",
      zipcode: "3706"
    },
    {
      name: "Ambaguio",
      zipcode: "3707"
    },
    {
      name: "Aritao",
      zipcode: "3708"
    },
    {
      name: "Bagabag",
      zipcode: "3711"
    },
    {
      name: "Bambang",
      zipcode: "3709"
    },
    {
      name: "Bayombong",
      zipcode: "3700"
    },
    {
      name: "Diadi",
      zipcode: "3710"
    },
    {
      name: "Dupax del Norte",
      zipcode: "3712"
    },
    {
      name: "Dupax del Sur",
      zipcode: "3713"
    },
    {
      name: "Kasibu",
      zipcode: "3714"
    },
    {
      name: "Kayapa",
      zipcode: "3715"
    },
    {
      name: "Quezon",
      zipcode: "3716"
    },
    {
      name: "Santa Fe",
      zipcode: "3717"
    },
    {
      name: "Solano",
      zipcode: "3702"
    },
    {
      name: "Villaverde",
      zipcode: "3718"
    }
    ]
  },
  {
    name: "QUIRINO",
    municipalities: [
    {
      name: "Aglipay",
      zipcode: "3410"
    },
    {
      name: "Cabarroguis",
      zipcode: "3400"
    },
    {
      name: "Diffun",
      zipcode: "3401"
    },
    {
      name: "Maddela",
      zipcode: "3402"
    },
    {
      name: "Nagtipunan",
      zipcode: "3403"
    },
    {
      name: "Saguday",
      zipcode: "3404"
    }
    ]
  }
  ]
}
];

// Helper functions for the registration form
export const getAllRegions = (): Region[] => {
  return philippineGeography;
};

export const getRegionNames = (): string[] => {
  return philippineGeography.map(r => r.name).sort();
};

export const getProvincesByRegion = (regionName: string): Province[] => {
  const region = philippineGeography.find(r => r.name === regionName);
  return region ? region.provinces : [];
};

export const getProvinceNames = (regionName: string): string[] => {
  const provinces = getProvincesByRegion(regionName);
  return provinces.map(p => p.name).sort();
};

export const getMunicipalitiesByProvince = (regionName: string, provinceName: string): Municipality[] => {
  const region = philippineGeography.find(r => r.name === regionName);
  if (!region) return [];
  
  const province = region.provinces.find(p => p.name === provinceName);
  return province ? province.municipalities : [];
};

export const getMunicipalityNames = (regionName: string, provinceName: string): string[] => {
  const municipalities = getMunicipalitiesByProvince(regionName, provinceName);
  return municipalities.map(m => m.name).sort();
};

export const getZipCode = (regionName: string, provinceName: string, municipalityName: string): string => {
  const municipalities = getMunicipalitiesByProvince(regionName, provinceName);
  const municipality = municipalities.find(m => m.name === municipalityName);
  return municipality ? municipality.zipcode : "";
};

// Search functions for type-ahead functionality
export const searchRegions = (query: string): string[] => {
  const regions = getRegionNames();
  return regions.filter(name => 
    name.toLowerCase().includes(query.toLowerCase())
  );
};

export const searchProvinces = (query: string, regionName?: string): string[] => {
  let provinces: string[] = [];
  
  if (regionName) {
    provinces = getProvinceNames(regionName);
  } else {
    provinces = philippineGeography.flatMap(r => r.provinces.map(p => p.name));
  }
  
  return provinces.filter(name =>
    name.toLowerCase().includes(query.toLowerCase())
  ).sort();
};

export const searchMunicipalities = (query: string, regionName?: string, provinceName?: string): string[] => {
  let municipalities: string[] = [];
  
  if (regionName && provinceName) {
    municipalities = getMunicipalityNames(regionName, provinceName);
  } else if (regionName) {
    const region = philippineGeography.find(r => r.name === regionName);
    if (region) {
      municipalities = region.provinces.flatMap(p => p.municipalities.map(m => m.name));
    }
  } else {
    municipalities = philippineGeography.flatMap(r => 
      r.provinces.flatMap(p => p.municipalities.map(m => m.name))
    );
  }
  
  return municipalities.filter(name => 
    name.toLowerCase().includes(query.toLowerCase())
  ).sort();
};