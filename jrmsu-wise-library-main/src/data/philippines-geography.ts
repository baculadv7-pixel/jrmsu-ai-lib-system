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
},
{
  name: "Region III – Central Luzon",
  provinces: [
  {
    name: "AURORA",
    municipalities: [
    {
      name: "Baler",
      zipcode: "3200"
    },
    {
      name: "Casiguran",
      zipcode: "3204"
    },
    {
      name: "Dilasag",
      zipcode: "3205"
    },
    {
      name: "Dinalungan",
      zipcode: "3206"
    },
    {
      name: "Dingalan",
      zipcode: "3207"
    },
    {
      name: "Dipaculao",
      zipcode: "3203"
    },
    {
      name: "Maria Aurora",
      zipcode: "3202"
    },
    {
      name: "San Luis",
      zipcode: "3201"
    }
    ]
  },
  {
    name: "BATAAN",
    municipalities: [
    {
      name: "Abucay",
      zipcode: "2114"
    },
    {
      name: "Bagac",
      zipcode: "2107"
    },
    {
      name: "Balanga City",
      zipcode: "2100"
    },
    {
      name: "Dinalupihan",
      zipcode: "2110"
    },
    {
      name: "Hermosa",
      zipcode: "2111"
    },
    {
      name: "Limay",
      zipcode: "2103"
    },
    {
      name: "Mariveles",
      zipcode: "2105"
    },
    {
      name: "Morong",
      zipcode: "2108"
    },
    {
      name: "Orani",
      zipcode: "2112"
    },
    {
      name: "Orion",
      zipcode: "2102"
    },
    {
      name: "Pilar",
      zipcode: "2101"
    },
    {
      name: "Samal",
      zipcode: "2113"
    }
    ]
  },
  {
    name: "BULACAN",
    municipalities: [
    {
      name: "Angat",
      zipcode: "3012"
    },
    {
      name: "Balagtas",
      zipcode: "3016"
    },
    {
      name: "Baliuag",
      zipcode: "3006"
    },
    {
      name: "Bocaue",
      zipcode: "3018"
    },
    {
      name: "Bulakan",
      zipcode: "3017"
    },
    {
      name: "Bustos",
      zipcode: "3007"
    },
    {
      name: "Calumpit",
      zipcode: "3003"
    },
    {
      name: "Doña Remedios Trinidad",
      zipcode: "3009"
    },
    {
      name: "Guiguinto",
      zipcode: "3015"
    },
    {
      name: "Hagonoy",
      zipcode: "3002"
    },
    {
      name: "Malolos City",
      zipcode: "3000"
    },
    {
      name: "Marilao",
      zipcode: "3019"
    },
    {
      name: "Meycauayan City",
      zipcode: "3020"
    },
    {
      name: "Norzagaray",
      zipcode: "3013"
    },
    {
      name: "Obando",
      zipcode: "3021"
    },
    {
      name: "Pandi",
      zipcode: "3014"
    },
    {
      name: "Paombong",
      zipcode: "3001"
    },
    {
      name: "Plaridel",
      zipcode: "3004"
    },
    {
      name: "Pulilan",
      zipcode: "3005"
    },
    {
      name: "San Ildefonso",
      zipcode: "3010"
    },
    {
      name: "San Jose del Monte City",
      zipcode: "3023"
    },
    {
      name: "San Miguel",
      zipcode: "3011"
    },
    {
      name: "San Rafael",
      zipcode: "3008"
    },
    {
      name: "Santa Maria",
      zipcode: "3022"
    }
    ]
  },
  {
    name: "NUEVA ECIJA",
    municipalities: [
    {
      name: "Aliaga",
      zipcode: "3111"
    },
    {
      name: "Bongabon",
      zipcode: "3128"
    },
    {
      name: "Cabanatuan City",
      zipcode: "3100"
    },
    {
      name: "Cabiao",
      zipcode: "3107"
    },
    {
      name: "Carranglan",
      zipcode: "3123"
    },
    {
      name: "Cuyapo",
      zipcode: "3117"
    },
    {
      name: "Gabaldon",
      zipcode: "3131"
    },
    {
      name: "Gapan City",
      zipcode: "3105"
    },
    {
      name: "General Mamerto Natividad",
      zipcode: "3125"
    },
    {
      name: "General Tinio",
      zipcode: "3104"
    },
    {
      name: "Guimba",
      zipcode: "3115"
    },
    {
      name: "Jaen",
      zipcode: "3109"
    },
    {
      name: "Laur",
      zipcode: "3129"
    },
    {
      name: "Licab",
      zipcode: "3112"
    },
    {
      name: "Llanera",
      zipcode: "3126"
    },
    {
      name: "Lupao",
      zipcode: "3122"
    },
    {
      name: "Nampicuan",
      zipcode: "3116"
    },
    {
      name: "Palayan City",
      zipcode: "3132"
    },
    {
      name: "Pantabangan",
      zipcode: "3124"
    },
    {
      name: "Peñaranda",
      zipcode: "3103"
    },
    {
      name: "Quezon",
      zipcode: "3113"
    },
    {
      name: "Rizal",
      zipcode: "3127"
    },
    {
      name: "San Antonio",
      zipcode: "3108"
    },
    {
      name: "San Isidro",
      zipcode: "3106"
    },
    {
      name: "San Jose City",
      zipcode: "3121"
    },
    {
      name: "San Leonardo",
      zipcode: "3102"
    },
    {
      name: "Santa Rosa",
      zipcode: "3101"
    },
    {
      name: "Santo Domingo",
      zipcode: "3118"
    },
    {
      name: "Talavera",
      zipcode: "3114"
    },
    {
      name: "Talugtug",
      zipcode: "3113"
    },
    {
      name: "Zaragoza",
      zipcode: "3110"
    }
    ]
  },
  {
    name: "PAMPANGA",
    municipalities: [
    {
      name: "Angeles City",
      zipcode: "2009"
    },
    {
      name: "Apalit",
      zipcode: "2016"
    },
    {
      name: "Arayat",
      zipcode: "2012"
    },
    {
      name: "Bacolor",
      zipcode: "2001"
    },
    {
      name: "Candaba",
      zipcode: "2013"
    },
    {
      name: "Floridablanca",
      zipcode: "2006"
    },
    {
      name: "Guagua",
      zipcode: "2003"
    },
    {
      name: "Lubao",
      zipcode: "2005"
    },
    {
      name: "Mabalacat City",
      zipcode: "2010"
    },
    {
      name: "Macabebe",
      zipcode: "2018"
    },
    {
      name: "Magalang",
      zipcode: "2011"
    },
    {
      name: "Masantol",
      zipcode: "2017"
    },
    {
      name: "Mexico",
      zipcode: "2021"
    },
    {
      name: "Minalin",
      zipcode: "2019"
    },
    {
      name: "Porac",
      zipcode: "2008"
    },
    {
      name: "San Fernando City",
      zipcode: "2000"
    },
    {
      name: "San Luis",
      zipcode: "2014"
    },
    {
      name: "San Simon",
      zipcode: "2015"
    },
    {
      name: "Santa Ana",
      zipcode: "2022"
    },
    {
      name: "Santa Rita",
      zipcode: "2002"
    },
    {
      name: "Santo Tomas",
      zipcode: "2020"
    },
    {
      name: "Sasmuan",
      zipcode: "2007"
    }
    ]
  },
  {
    name: "TARLAC",
    municipalities: [
    {
      name: "Anao",
      zipcode: "2310"
    },
    {
      name: "Bamban",
      zipcode: "2317"
    },
    {
      name: "Camiling",
      zipcode: "2306"
    },
    {
      name: "Capas",
      zipcode: "2315"
    },
    {
      name: "Concepcion",
      zipcode: "2316"
    },
    {
      name: "Gerona",
      zipcode: "2302"
    },
    {
      name: "La Paz",
      zipcode: "2314"
    },
    {
      name: "Mayantoc",
      zipcode: "2304"
    },
    {
      name: "Moncada",
      zipcode: "2334"
    },
    {
      name: "Paniqui",
      zipcode: "2307"
    },
    {
      name: "Pura",
      zipcode: "2312"
    },
    {
      name: "Ramos",
      zipcode: "2311"
    },
    {
      name: "San Clemente",
      zipcode: "2305"
    },
    {
      name: "San Jose",
      zipcode: "2301"
    },
    {
      name: "San Manuel",
      zipcode: "2309"
    },
    {
      name: "Santa Ignacia",
      zipcode: "2303"
    },
    {
      name: "Tarlac City",
      zipcode: "2300"
    },
    {
      name: "Victoria",
      zipcode: "2313"
    }
    ]
  },
  {
    name: "ZAMBALES",
    municipalities: [
    {
      name: "Botolan",
      zipcode: "2202"
    },
    {
      name: "Cabangan",
      zipcode: "2203"
    },
    {
      name: "Candelaria",
      zipcode: "2212"
    },
    {
      name: "Castillejos",
      zipcode: "2208"
    },
    {
      name: "Iba",
      zipcode: "2201"
    },
    {
      name: "Masinloc",
      zipcode: "2211"
    },
    {
      name: "Olongapo City",
      zipcode: "2200"
    },
    {
      name: "Palauig",
      zipcode: "2210"
    },
    {
      name: "San Antonio",
      zipcode: "2206"
    },
    {
      name: "San Felipe",
      zipcode: "2204"
    },
    {
      name: "San Marcelino",
      zipcode: "2207"
    },
    {
      name: "San Narciso",
      zipcode: "2205"
    },
    {
      name: "Santa Cruz",
      zipcode: "2213"
    },
    {
      name: "Subic",
      zipcode: "2209"
    }
    ]
  }
  ]
},
{
  name: "Region IV-B – MIMAROPA",
  provinces: [
  {
    name: "MARINDUQUE",
    municipalities: [
    {
      name: "Boac",
      zipcode: "4900"
    },
    {
      name: "Buenavista",
      zipcode: "4904"
    },
    {
      name: "Gasan",
      zipcode: "4905"
    },
    {
      name: "Mogpog",
      zipcode: "4901"
    },
    {
      name: "Santa Cruz",
      zipcode: "4902"
    },
    {
      name: "Torrijos",
      zipcode: "4903"
    }
    ]
  },
  {
    name: "OCCIDENTAL MINDORO",
    municipalities: [
    {
      name: "Abra de Ilog",
      zipcode: "5108"
    },
    {
      name: "Calintaan",
      zipcode: "5102"
    },
    {
      name: "Looc",
      zipcode: "5111"
    },
    {
      name: "Lubang",
      zipcode: "5109"
    },
    {
      name: "Magsaysay",
      zipcode: "5101"
    },
    {
      name: "Mamburao",
      zipcode: "5106"
    },
    {
      name: "Paluan",
      zipcode: "5107"
    },
    {
      name: "Rizal",
      zipcode: "5103"
    },
    {
      name: "Sablayan",
      zipcode: "5104"
    },
    {
      name: "San Jose",
      zipcode: "5100"
    },
    {
      name: "Santa Cruz",
      zipcode: "5105"
    }
    ]
  },
  {
    name: "ORIENTAL MINDORO",
    municipalities: [
    {
      name: "Baco",
      zipcode: "5201"
    },
    {
      name: "Bansud",
      zipcode: "5210"
    },
    {
      name: "Bongabong",
      zipcode: "5211"
    },
    {
      name: "Bulalacao",
      zipcode: "5214"
    },
    {
      name: "Calapan City",
      zipcode: "5200"
    },
    {
      name: "Gloria",
      zipcode: "5209"
    },
    {
      name: "Mansalay",
      zipcode: "5213"
    },
    {
      name: "Naujan",
      zipcode: "5204"
    },
    {
      name: "Pinamalayan",
      zipcode: "5208"
    },
    {
      name: "Pola",
      zipcode: "5206"
    },
    {
      name: "Puerto Galera",
      zipcode: "5203"
    },
    {
      name: "Roxas",
      zipcode: "5212"
    },
    {
      name: "San Teodoro",
      zipcode: "5202"
    },
    {
      name: "Socorro",
      zipcode: "5207"
    },
    {
      name: "Victoria",
      zipcode: "5205"
    }
    ]
  },
  {
    name: "PALAWAN",
    municipalities: [
    {
      name: "Aborlan",
      zipcode: "5302"
    },
    {
      name: "Agutaya",
      zipcode: "5320"
    },
    {
      name: "Araceli",
      zipcode: "5311"
    },
    {
      name: "Balabac",
      zipcode: "5307"
    },
    {
      name: "Bataraza",
      zipcode: "5306"
    },
    {
      name: "Brooke's Point",
      zipcode: "5305"
    },
    {
      name: "Busuanga",
      zipcode: "5317"
    },
    {
      name: "Cagayancillo",
      zipcode: "5321"
    },
    {
      name: "Coron",
      zipcode: "5316"
    },
    {
      name: "Culion",
      zipcode: "5315"
    },
    {
      name: "Cuyo",
      zipcode: "5318"
    },
    {
      name: "Dumaran",
      zipcode: "5310"
    },
    {
      name: "El Nido",
      zipcode: "5313"
    },
    {
      name: "Kalayaan",
      zipcode: "5322"
    },
    {
      name: "Linapacan",
      zipcode: "5314"
    },
    {
      name: "Magsaysay",
      zipcode: "5319"
    },
    {
      name: "Narra",
      zipcode: "5303"
    },
    {
      name: "Puerto Princesa City",
      zipcode: "5300"
    },
    {
      name: "Quezon",
      zipcode: "5304"
    },
    {
      name: "Rizal",
      zipcode: "5301"
    },
    {
      name: "Roxas",
      zipcode: "5308"
    },
    {
      name: "San Vicente",
      zipcode: "5309"
    },
    {
      name: "Sofronio Española",
      zipcode: "5301"
    },
    {
      name: "Taytay",
      zipcode: "5312"
    }
    ]
  },
  {
    name: "ROMBLON",
    municipalities: [
    {
      name: "Alcantara",
      zipcode: "5509"
    },
    {
      name: "Banton",
      zipcode: "5515"
    },
    {
      name: "Cajidiocan",
      zipcode: "5512"
    },
    {
      name: "Calatrava",
      zipcode: "5503"
    },
    {
      name: "Concepcion",
      zipcode: "5516"
    },
    {
      name: "Corcuera",
      zipcode: "5514"
    },
    {
      name: "Ferrol",
      zipcode: "5506"
    },
    {
      name: "Looc",
      zipcode: "5507"
    },
    {
      name: "Magdiwang",
      zipcode: "5511"
    },
    {
      name: "Odiongan",
      zipcode: "5505"
    },
    {
      name: "Romblon",
      zipcode: "5500"
    },
    {
      name: "San Agustin",
      zipcode: "5501"
    },
    {
      name: "San Andres",
      zipcode: "5504"
    },
    {
      name: "San Fernando",
      zipcode: "5513"
    },
    {
      name: "San Jose",
      zipcode: "5510"
    },
    {
      name: "Santa Fe",
      zipcode: "5508"
    },
    {
      name: "Santa Maria",
      zipcode: "5517"
    }
    ]
  }
  ]
},
{
  name: "Region V – Bicol Region",
  provinces: [
  {
    name: "ALBAY",
    municipalities: [
    {
      name: "Bacacay",
      zipcode: "4509"
    },
    {
      name: "Camalig",
      zipcode: "4502"
    },
    {
      name: "Daraga",
      zipcode: "4501"
    },
    {
      name: "Guinobatan",
      zipcode: "4503"
    },
    {
      name: "Jovellar",
      zipcode: "4515"
    },
    {
      name: "Legazpi City",
      zipcode: "4500"
    },
    {
      name: "Libon",
      zipcode: "4507"
    },
    {
      name: "Ligao City",
      zipcode: "4504"
    },
    {
      name: "Malilipot",
      zipcode: "4510"
    },
    {
      name: "Malinao",
      zipcode: "4512"
    },
    {
      name: "Manito",
      zipcode: "4514"
    },
    {
      name: "Oas",
      zipcode: "4505"
    },
    {
      name: "Pio Duran",
      zipcode: "4516"
    },
    {
      name: "Polangui",
      zipcode: "4506"
    },
    {
      name: "Rapu-Rapu",
      zipcode: "4517"
    },
    {
      name: "Santo Domingo",
      zipcode: "4508"
    },
    {
      name: "Tabaco City",
      zipcode: "4511"
    },
    {
      name: "Tiwi",
      zipcode: "4513"
    }
    ]
  },
  {
    name: "CAMARINES NORTE",
    municipalities: [
    {
      name: "Basud",
      zipcode: "4608"
    },
    {
      name: "Capalonga",
      zipcode: "4607"
    },
    {
      name: "Daet",
      zipcode: "4600"
    },
    {
      name: "Jose Panganiban",
      zipcode: "4606"
    },
    {
      name: "Labo",
      zipcode: "4604"
    },
    {
      name: "Mercedes",
      zipcode: "4601"
    },
    {
      name: "Paracale",
      zipcode: "4605"
    },
    {
      name: "San Lorenzo Ruiz",
      zipcode: "4610"
    },
    {
      name: "San Vicente",
      zipcode: "4609"
    },
    {
      name: "Santa Elena",
      zipcode: "4611"
    },
    {
      name: "Talisay",
      zipcode: "4602"
    },
    {
      name: "Vinzons",
      zipcode: "4603"
    }
    ]
  },
  {
    name: "CAMARINES SUR",
    municipalities: [
    {
      name: "Baao",
      zipcode: "4432"
    },
    {
      name: "Balatan",
      zipcode: "4436"
    },
    {
      name: "Bato",
      zipcode: "4435"
    },
    {
      name: "Bombon",
      zipcode: "4404"
    },
    {
      name: "Buhi",
      zipcode: "4433"
    },
    {
      name: "Bula",
      zipcode: "4430"
    },
    {
      name: "Cabusao",
      zipcode: "4406"
    },
    {
      name: "Calabanga",
      zipcode: "4405"
    },
    {
      name: "Camaligan",
      zipcode: "4401"
    },
    {
      name: "Canaman",
      zipcode: "4402"
    },
    {
      name: "Caramoan",
      zipcode: "4423"
    },
    {
      name: "Del Gallego",
      zipcode: "4411"
    },
    {
      name: "Gainza",
      zipcode: "4412"
    },
    {
      name: "Garchitorena",
      zipcode: "4428"
    },
    {
      name: "Goa",
      zipcode: "4422"
    },
    {
      name: "Iriga City",
      zipcode: "4431"
    },
    {
      name: "Lagonoy",
      zipcode: "4425"
    },
    {
      name: "Libmanan",
      zipcode: "4407"
    },
    {
      name: "Lupi",
      zipcode: "4409"
    },
    {
      name: "Magarao",
      zipcode: "4403"
    },
    {
      name: "Milaor",
      zipcode: "4413"
    },
    {
      name: "Minalabac",
      zipcode: "4414"
    },
    {
      name: "Nabua",
      zipcode: "4434"
    },
    {
      name: "Naga City",
      zipcode: "4400"
    },
    {
      name: "Ocampo",
      zipcode: "4419"
    },
    {
      name: "Pamplona",
      zipcode: "4416"
    },
    {
      name: "Pasacao",
      zipcode: "4417"
    },
    {
      name: "Pili",
      zipcode: "4418"
    },
    {
      name: "Presentacion",
      zipcode: "4424"
    },
    {
      name: "Ragay",
      zipcode: "4410"
    },
    {
      name: "Sagñay",
      zipcode: "4420"
    },
    {
      name: "San Fernando",
      zipcode: "4415"
    },
    {
      name: "San Jose",
      zipcode: "4423"
    },
    {
      name: "Sipocot",
      zipcode: "4408"
    },
    {
      name: "Siruma",
      zipcode: "4429"
    },
    {
      name: "Tigaon",
      zipcode: "4421"
    },
    {
      name: "Tinambac",
      zipcode: "4427"
    }
    ]
  },
  {
    name: "CATANDUANES",
    municipalities: [
    {
      name: "Bagamanoc",
      zipcode: "4807"
    },
    {
      name: "Baras",
      zipcode: "4803"
    },
    {
      name: "Bato",
      zipcode: "4801"
    },
    {
      name: "Caramoran",
      zipcode: "4808"
    },
    {
      name: "Gigmoto",
      zipcode: "4804"
    },
    {
      name: "Pandan",
      zipcode: "4809"
    },
    {
      name: "Panganiban",
      zipcode: "4806"
    },
    {
      name: "San Andres",
      zipcode: "4810"
    },
    {
      name: "San Miguel",
      zipcode: "4802"
    },
    {
      name: "Viga",
      zipcode: "4805"
    },
    {
      name: "Virac",
      zipcode: "4800"
    }
    ]
  },
  {
    name: "MASBATE",
    municipalities: [
    {
      name: "Aroroy",
      zipcode: "5414"
    },
    {
      name: "Baleno",
      zipcode: "5413"
    },
    {
      name: "Balud",
      zipcode: "5412"
    },
    {
      name: "Batuan",
      zipcode: "5415"
    },
    {
      name: "Cataingan",
      zipcode: "5405"
    },
    {
      name: "Cawayan",
      zipcode: "5409"
    },
    {
      name: "Claveria",
      zipcode: "5419"
    },
    {
      name: "Dimasalang",
      zipcode: "5403"
    },
    {
      name: "Esperanza",
      zipcode: "5407"
    },
    {
      name: "Mandaon",
      zipcode: "5411"
    },
    {
      name: "Masbate City",
      zipcode: "5400"
    },
    {
      name: "Milagros",
      zipcode: "5410"
    },
    {
      name: "Mobo",
      zipcode: "5401"
    },
    {
      name: "Monreal",
      zipcode: "5418"
    },
    {
      name: "Palanas",
      zipcode: "5406"
    },
    {
      name: "Pio V. Corpuz",
      zipcode: "5404"
    },
    {
      name: "Placer",
      zipcode: "5408"
    },
    {
      name: "San Fernando",
      zipcode: "5416"
    },
    {
      name: "San Jacinto",
      zipcode: "5417"
    },
    {
      name: "San Pascual",
      zipcode: "5420"
    },
    {
      name: "Uson",
      zipcode: "5402"
    }
    ]
  },
  {
    name: "SORSOGON",
    municipalities: [
    {
      name: "Barcelona",
      zipcode: "4712"
    },
    {
      name: "Bulan",
      zipcode: "4706"
    },
    {
      name: "Bulusan",
      zipcode: "4704"
    },
    {
      name: "Casiguran",
      zipcode: "4702"
    },
    {
      name: "Castilla",
      zipcode: "4713"
    },
    {
      name: "Donsol",
      zipcode: "4715"
    },
    {
      name: "Gubat",
      zipcode: "4710"
    },
    {
      name: "Irosin",
      zipcode: "4707"
    },
    {
      name: "Juban",
      zipcode: "4703"
    },
    {
      name: "Magallanes",
      zipcode: "4705"
    },
    {
      name: "Matnog",
      zipcode: "4708"
    },
    {
      name: "Pilar",
      zipcode: "4714"
    },
    {
      name: "Prieto Diaz",
      zipcode: "4711"
    },
    {
      name: "Santa Magdalena",
      zipcode: "4709"
    },
    {
      name: "Sorsogon City",
      zipcode: "4700"
    }
    ]
  }
  ]
},
{
  name: "Region VI – Western Visayas",
  provinces: [
  {
    name: "AKLAN",
    municipalities: [
    {
      name: "Altavas",
      zipcode: "5616"
    },
    {
      name: "Balete",
      zipcode: "5614"
    },
    {
      name: "Banga",
      zipcode: "5601"
    },
    {
      name: "Batan",
      zipcode: "5615"
    },
    {
      name: "Buruanga",
      zipcode: "5609"
    },
    {
      name: "Ibajay",
      zipcode: "5613"
    },
    {
      name: "Kalibo",
      zipcode: "5600"
    },
    {
      name: "Lezo",
      zipcode: "5605"
    },
    {
      name: "Libacao",
      zipcode: "5602"
    },
    {
      name: "Madalag",
      zipcode: "5603"
    },
    {
      name: "Makato",
      zipcode: "5611"
    },
    {
      name: "Malay",
      zipcode: "5608"
    },
    {
      name: "Malinao",
      zipcode: "5606"
    },
    {
      name: "Nabas",
      zipcode: "5607"
    },
    {
      name: "New Washington",
      zipcode: "5610"
    },
    {
      name: "Numancia",
      zipcode: "5604"
    },
    {
      name: "Tangalan",
      zipcode: "5612"
    }
    ]
  },
  {
    name: "ANTIQUE",
    municipalities: [
    {
      name: "Anini-y",
      zipcode: "5717"
    },
    {
      name: "Barbaza",
      zipcode: "5706"
    },
    {
      name: "Belison",
      zipcode: "5701"
    },
    {
      name: "Bugasong",
      zipcode: "5704"
    },
    {
      name: "Caluya",
      zipcode: "5711"
    },
    {
      name: "Culasi",
      zipcode: "5708"
    },
    {
      name: "Hamtic",
      zipcode: "5715"
    },
    {
      name: "Laua-an",
      zipcode: "5705"
    },
    {
      name: "Libertad",
      zipcode: "5710"
    },
    {
      name: "Pandan",
      zipcode: "5712"
    },
    {
      name: "Patnongon",
      zipcode: "5702"
    },
    {
      name: "San Jose de Buenavista",
      zipcode: "5700"
    },
    {
      name: "San Remigio",
      zipcode: "5714"
    },
    {
      name: "Sebaste",
      zipcode: "5709"
    },
    {
      name: "Sibalom",
      zipcode: "5713"
    },
    {
      name: "Tibiao",
      zipcode: "5707"
    },
    {
      name: "Tobias Fornier",
      zipcode: "5716"
    },
    {
      name: "Valderrama",
      zipcode: "5703"
    }
    ]
  },
  {
    name: "CAPIZ",
    municipalities: [
    {
      name: "Cuartero",
      zipcode: "5808"
    },
    {
      name: "Dao",
      zipcode: "5810"
    },
    {
      name: "Dumalag",
      zipcode: "5813"
    },
    {
      name: "Dumarao",
      zipcode: "5812"
    },
    {
      name: "Ivisan",
      zipcode: "5805"
    },
    {
      name: "Jamindan",
      zipcode: "5803"
    },
    {
      name: "Maayon",
      zipcode: "5809"
    },
    {
      name: "Mambusao",
      zipcode: "5807"
    },
    {
      name: "Panay",
      zipcode: "5801"
    },
    {
      name: "Panitan",
      zipcode: "5811"
    },
    {
      name: "Pilar",
      zipcode: "5804"
    },
    {
      name: "Pontevedra",
      zipcode: "5802"
    },
    {
      name: "President Roxas",
      zipcode: "5806"
    },
    {
      name: "Roxas City",
      zipcode: "5800"
    },
    {
      name: "Sapian",
      zipcode: "5816"
    },
    {
      name: "Sigma",
      zipcode: "5819"
    },
    {
      name: "Tapaz",
      zipcode: "5814"
    }
    ]
  },
  {
    name: "GUIMARAS",
    municipalities: [
    {
      name: "Buenavista",
      zipcode: "5044"
    },
    {
      name: "Jordan",
      zipcode: "5045"
    },
    {
      name: "Nueva Valencia",
      zipcode: "5046"
    },
    {
      name: "San Lorenzo",
      zipcode: "5047"
    },
    {
      name: "Sibunag",
      zipcode: "5048"
    }
    ]
  },
  {
    name: "ILOILO",
    municipalities: [
    {
      name: "Ajuy",
      zipcode: "5012"
    },
    {
      name: "Alimodian",
      zipcode: "5028"
    },
    {
      name: "Anilao",
      zipcode: "5009"
    },
    {
      name: "Badiangan",
      zipcode: "5033"
    },
    {
      name: "Balasan",
      zipcode: "5018"
    },
    {
      name: "Banate",
      zipcode: "5010"
    },
    {
      name: "Barotac Nuevo",
      zipcode: "5007"
    },
    {
      name: "Barotac Viejo",
      zipcode: "5011"
    },
    {
      name: "Batad",
      zipcode: "5016"
    },
    {
      name: "Bingawan",
      zipcode: "5041"
    },
    {
      name: "Cabatuan",
      zipcode: "5031"
    },
    {
      name: "Calinog",
      zipcode: "5040"
    },
    {
      name: "Carles",
      zipcode: "5019"
    },
    {
      name: "Concepcion",
      zipcode: "5013"
    },
    {
      name: "Dingle",
      zipcode: "5035"
    },
    {
      name: "Dueñas",
      zipcode: "5038"
    },
    {
      name: "Dumangas",
      zipcode: "5006"
    },
    {
      name: "Estancia",
      zipcode: "5017"
    },
    {
      name: "Guimbal",
      zipcode: "5022"
    },
    {
      name: "Igbaras",
      zipcode: "5029"
    },
    {
      name: "Iloilo City",
      zipcode: "5000"
    },
    {
      name: "Janiuay",
      zipcode: "5034"
    },
    {
      name: "Lambunao",
      zipcode: "5042"
    },
    {
      name: "Leganes",
      zipcode: "5003"
    },
    {
      name: "Lemery",
      zipcode: "5043"
    },
    {
      name: "Leon",
      zipcode: "5026"
    },
    {
      name: "Maasin",
      zipcode: "5030"
    },
    {
      name: "Miagao",
      zipcode: "5023"
    },
    {
      name: "Mina",
      zipcode: "5032"
    },
    {
      name: "New Lucena",
      zipcode: "5005"
    },
    {
      name: "Oton",
      zipcode: "5020"
    },
    {
      name: "Passi City",
      zipcode: "5044"
    },
    {
      name: "Pavia",
      zipcode: "5001"
    },
    {
      name: "Pototan",
      zipcode: "5008"
    },
    {
      name: "San Dionisio",
      zipcode: "5015"
    },
    {
      name: "San Enrique",
      zipcode: "5036"
    },
    {
      name: "San Joaquin",
      zipcode: "5024"
    },
    {
      name: "San Miguel",
      zipcode: "5025"
    },
    {
      name: "San Rafael",
      zipcode: "5039"
    },
    {
      name: "Santa Barbara",
      zipcode: "5002"
    },
    {
      name: "Sara",
      zipcode: "5014"
    },
    {
      name: "Tigbauan",
      zipcode: "5021"
    },
    {
      name: "Tubungan",
      zipcode: "5027"
    },
    {
      name: "Zarraga",
      zipcode: "5004"
    }
    ]
  },
  {
    name: "NEGROS OCCIDENTAL",
    municipalities: [
    {
      name: "Bacolod City",
      zipcode: "6100"
    },
    {
      name: "Bago City",
      zipcode: "6101"
    },
    {
      name: "Binalbagan",
      zipcode: "6107"
    },
    {
      name: "Cadiz City",
      zipcode: "6121"
    },
    {
      name: "Calatrava",
      zipcode: "6126"
    },
    {
      name: "Candoni",
      zipcode: "6110"
    },
    {
      name: "Cauayan",
      zipcode: "6112"
    },
    {
      name: "Enrique B. Magalona",
      zipcode: "6118"
    },
    {
      name: "Escalante City",
      zipcode: "6124"
    },
    {
      name: "Himamaylan City",
      zipcode: "6108"
    },
    {
      name: "Hinigaran",
      zipcode: "6106"
    },
    {
      name: "Hinoba-an",
      zipcode: "6114"
    },
    {
      name: "Ilog",
      zipcode: "6109"
    },
    {
      name: "Isabela",
      zipcode: "6111"
    },
    {
      name: "Kabankalan City",
      zipcode: "6111"
    },
    {
      name: "La Carlota City",
      zipcode: "6130"
    },
    {
      name: "La Castellana",
      zipcode: "6131"
    },
    {
      name: "Manapla",
      zipcode: "6115"
    },
    {
      name: "Moises Padilla",
      zipcode: "6132"
    },
    {
      name: "Murcia",
      zipcode: "6129"
    },
    {
      name: "Pontevedra",
      zipcode: "6105"
    },
    {
      name: "Pulupandan",
      zipcode: "6102"
    },
    {
      name: "Sagay City",
      zipcode: "6122"
    },
    {
      name: "San Carlos City",
      zipcode: "6127"
    },
    {
      name: "San Enrique",
      zipcode: "6104"
    },
    {
      name: "Silay City",
      zipcode: "6116"
    },
    {
      name: "Sipalay City",
      zipcode: "6113"
    },
    {
      name: "Talisay City",
      zipcode: "6115"
    },
    {
      name: "Toboso",
      zipcode: "6125"
    },
    {
      name: "Valladolid",
      zipcode: "6103"
    },
    {
      name: "Victorias City",
      zipcode: "6119"
    }
    ]
  }
  ]
},
{
  name: "Region VII – Central Visayas",
  provinces: [
  {
    name: "BOHOL",
    municipalities: [
    {
      name: "Alburquerque",
      zipcode: "6302"
    },
    {
      name: "Alicia",
      zipcode: "6314"
    },
    {
      name: "Anda",
      zipcode: "6311"
    },
    {
      name: "Antequera",
      zipcode: "6335"
    },
    {
      name: "Baclayon",
      zipcode: "6301"
    },
    {
      name: "Balilihan",
      zipcode: "6342"
    },
    {
      name: "Batuan",
      zipcode: "6318"
    },
    {
      name: "Bien Unido",
      zipcode: "6326"
    },
    {
      name: "Bilar",
      zipcode: "6317"
    },
    {
      name: "Buenavista",
      zipcode: "6333"
    },
    {
      name: "Calape",
      zipcode: "6328"
    },
    {
      name: "Candijay",
      zipcode: "6312"
    },
    {
      name: "Carmen",
      zipcode: "6319"
    },
    {
      name: "Catigbian",
      zipcode: "6343"
    },
    {
      name: "Clarin",
      zipcode: "6330"
    },
    {
      name: "Corella",
      zipcode: "6337"
    },
    {
      name: "Cortes",
      zipcode: "6341"
    },
    {
      name: "Dagohoy",
      zipcode: "6322"
    },
    {
      name: "Danao",
      zipcode: "6344"
    },
    {
      name: "Dauis",
      zipcode: "6339"
    },
    {
      name: "Dimiao",
      zipcode: "6305"
    },
    {
      name: "Duero",
      zipcode: "6309"
    },
    {
      name: "Garcia-Hernandez",
      zipcode: "6307"
    },
    {
      name: "Getafe",
      zipcode: "6334"
    },
    {
      name: "Guindulman",
      zipcode: "6310"
    },
    {
      name: "Inabanga",
      zipcode: "6332"
    },
    {
      name: "Jagna",
      zipcode: "6308"
    },
    {
      name: "Lila",
      zipcode: "6304"
    },
    {
      name: "Loay",
      zipcode: "6303"
    },
    {
      name: "Loboc",
      zipcode: "6316"
    },
    {
      name: "Loon",
      zipcode: "6327"
    },
    {
      name: "Mabini",
      zipcode: "6313"
    },
    {
      name: "Maribojoc",
      zipcode: "6336"
    },
    {
      name: "Panglao",
      zipcode: "6340"
    },
    {
      name: "Pilar",
      zipcode: "6321"
    },
    {
      name: "President Carlos P. Garcia",
      zipcode: "6346"
    },
    {
      name: "Sagbayan",
      zipcode: "6331"
    },
    {
      name: "San Isidro",
      zipcode: "6345"
    },
    {
      name: "San Miguel",
      zipcode: "6323"
    },
    {
      name: "Sevilla",
      zipcode: "6347"
    },
    {
      name: "Sierra Bullones",
      zipcode: "6320"
    },
    {
      name: "Sikatuna",
      zipcode: "6338"
    },
    {
      name: "Tagbilaran City",
      zipcode: "6300"
    },
    {
      name: "Talibon",
      zipcode: "6325"
    },
    {
      name: "Trinidad",
      zipcode: "6324"
    },
    {
      name: "Tubigon",
      zipcode: "6329"
    },
    {
      name: "Ubay",
      zipcode: "6315"
    },
    {
      name: "Valencia",
      zipcode: "6306"
    }
    ]
  },
  {
    name: "CEBU",
    municipalities: [
    {
      name: "Alcantara",
      zipcode: "6033"
    },
    {
      name: "Alcoy",
      zipcode: "6023"
    },
    {
      name: "Alegria",
      zipcode: "6030"
    },
    {
      name: "Aloguinsan",
      zipcode: "6040"
    },
    {
      name: "Argao",
      zipcode: "6021"
    },
    {
      name: "Asturias",
      zipcode: "6042"
    },
    {
      name: "Badian",
      zipcode: "6031"
    },
    {
      name: "Balamban",
      zipcode: "6041"
    },
    {
      name: "Bantayan",
      zipcode: "6052"
    },
    {
      name: "Barili",
      zipcode: "6036"
    },
    {
      name: "Bogo City",
      zipcode: "6010"
    },
    {
      name: "Boljoon",
      zipcode: "6024"
    },
    {
      name: "Borbon",
      zipcode: "6008"
    },
    {
      name: "Carcar City",
      zipcode: "6019"
    },
    {
      name: "Carmen",
      zipcode: "6005"
    },
    {
      name: "Catmon",
      zipcode: "6006"
    },
    {
      name: "Cebu City",
      zipcode: "6000"
    },
    {
      name: "Compostela",
      zipcode: "6003"
    },
    {
      name: "Consolacion",
      zipcode: "6001"
    },
    {
      name: "Cordova",
      zipcode: "6017"
    },
    {
      name: "Daanbantayan",
      zipcode: "6013"
    },
    {
      name: "Dalaguete",
      zipcode: "6022"
    },
    {
      name: "Dumanjug",
      zipcode: "6035"
    },
    {
      name: "Ginatilan",
      zipcode: "6028"
    },
    {
      name: "Lapu-Lapu City",
      zipcode: "6015"
    },
    {
      name: "Liloan",
      zipcode: "6002"
    },
    {
      name: "Madridejos",
      zipcode: "6053"
    },
    {
      name: "Malabuyoc",
      zipcode: "6029"
    },
    {
      name: "Mandaue City",
      zipcode: "6014"
    },
    {
      name: "Medellin",
      zipcode: "6012"
    },
    {
      name: "Minglanilla",
      zipcode: "6046"
    },
    {
      name: "Moalboal",
      zipcode: "6032"
    },
    {
      name: "Naga City",
      zipcode: "6037"
    },
    {
      name: "Oslob",
      zipcode: "6025"
    },
    {
      name: "Pilar",
      zipcode: "6048"
    },
    {
      name: "Pinamungajan",
      zipcode: "6039"
    },
    {
      name: "Poro",
      zipcode: "6049"
    },
    {
      name: "Ronda",
      zipcode: "6034"
    },
    {
      name: "Samboan",
      zipcode: "6027"
    },
    {
      name: "San Fernando",
      zipcode: "6018"
    },
    {
      name: "San Francisco",
      zipcode: "6050"
    },
    {
      name: "San Remigio",
      zipcode: "6011"
    },
    {
      name: "Santa Fe",
      zipcode: "6047"
    },
    {
      name: "Santander",
      zipcode: "6026"
    },
    {
      name: "Sibonga",
      zipcode: "6020"
    },
    {
      name: "Sogod",
      zipcode: "6007"
    },
    {
      name: "Tabogon",
      zipcode: "6009"
    },
    {
      name: "Tabuelan",
      zipcode: "6044"
    },
    {
      name: "Talisay City",
      zipcode: "6045"
    },
    {
      name: "Toledo City",
      zipcode: "6038"
    },
    {
      name: "Tuburan",
      zipcode: "6043"
    },
    {
      name: "Tudela",
      zipcode: "6051"
    }
    ]
  },
  {
    name: "NEGROS ORIENTAL",
    municipalities: [
    {
      name: "Amlan",
      zipcode: "6203"
    },
    {
      name: "Ayungon",
      zipcode: "6210"
    },
    {
      name: "Bacong",
      zipcode: "6216"
    },
    {
      name: "Bais City",
      zipcode: "6206"
    },
    {
      name: "Basay",
      zipcode: "6222"
    },
    {
      name: "Bayawan City",
      zipcode: "6221"
    },
    {
      name: "Bindoy",
      zipcode: "6209"
    },
    {
      name: "Canlaon City",
      zipcode: "6223"
    },
    {
      name: "Dauin",
      zipcode: "6217"
    },
    {
      name: "Dumaguete City",
      zipcode: "6200"
    },
    {
      name: "Guihulngan City",
      zipcode: "6214"
    },
    {
      name: "Jimalalud",
      zipcode: "6212"
    },
    {
      name: "La Libertad",
      zipcode: "6213"
    },
    {
      name: "Mabinay",
      zipcode: "6207"
    },
    {
      name: "Manjuyod",
      zipcode: "6208"
    },
    {
      name: "Pamplona",
      zipcode: "6205"
    },
    {
      name: "San Jose",
      zipcode: "6202"
    },
    {
      name: "Santa Catalina",
      zipcode: "6220"
    },
    {
      name: "Siaton",
      zipcode: "6219"
    },
    {
      name: "Sibulan",
      zipcode: "6201"
    },
    {
      name: "Tanjay City",
      zipcode: "6204"
    },
    {
      name: "Tayasan",
      zipcode: "6211"
    },
    {
      name: "Valencia",
      zipcode: "6215"
    },
    {
      name: "Vallehermoso",
      zipcode: "6224"
    },
    {
      name: "Zamboanguita",
      zipcode: "6218"
    }
    ]
  },
  {
    name: "SIQUIJOR",
    municipalities: [
    {
      name: "Enrique Villanueva",
      zipcode: "6230"
    },
    {
      name: "Larena",
      zipcode: "6226"
    },
    {
      name: "Lazi",
      zipcode: "6228"
    },
    {
      name: "Maria",
      zipcode: "6229"
    },
    {
      name: "San Juan",
      zipcode: "6227"
    },
    {
      name: "Siquijor",
      zipcode: "6225"
    }
    ]
  }
  ]
},
{
  name: "Region VIII – Eastern Visayas",
  provinces: [
  {
    name: "BILIRAN",
    municipalities: [
    {
      name: "Almeria",
      zipcode: "6544"
    },
    {
      name: "Biliran",
      zipcode: "6543"
    },
    {
      name: "Cabucgayan",
      zipcode: "6548"
    },
    {
      name: "Caibiran",
      zipcode: "6545"
    },
    {
      name: "Culaba",
      zipcode: "6542"
    },
    {
      name: "Kawayan",
      zipcode: "6541"
    },
    {
      name: "Maripipi",
      zipcode: "6546"
    },
    {
      name: "Naval",
      zipcode: "6543"
    }
    ]
  },
  {
    name: "EASTERN SAMAR",
    municipalities: [
    {
      name: "Arteche",
      zipcode: "6822"
    },
    {
      name: "Balangiga",
      zipcode: "6811"
    },
    {
      name: "Balangkayan",
      zipcode: "6801"
    },
    {
      name: "Borongan City",
      zipcode: "6800"
    },
    {
      name: "Can-avid",
      zipcode: "6806"
    },
    {
      name: "Dolores",
      zipcode: "6817"
    },
    {
      name: "General MacArthur",
      zipcode: "6805"
    },
    {
      name: "Giporlos",
      zipcode: "6812"
    },
    {
      name: "Guiuan",
      zipcode: "6809"
    },
    {
      name: "Hernani",
      zipcode: "6804"
    },
    {
      name: "Jipapad",
      zipcode: "6819"
    },
    {
      name: "Lawaan",
      zipcode: "6813"
    },
    {
      name: "Llorente",
      zipcode: "6803"
    },
    {
      name: "Maslog",
      zipcode: "6820"
    },
    {
      name: "Maydolong",
      zipcode: "6802"
    },
    {
      name: "Mercedes",
      zipcode: "6808"
    },
    {
      name: "Oras",
      zipcode: "6818"
    },
    {
      name: "Quinapondan",
      zipcode: "6810"
    },
    {
      name: "Salcedo",
      zipcode: "6807"
    },
    {
      name: "San Julian",
      zipcode: "6801"
    },
    {
      name: "San Policarpo",
      zipcode: "6821"
    },
    {
      name: "Sulat",
      zipcode: "6815"
    },
    {
      name: "Taft",
      zipcode: "6814"
    }
    ]
  },
  {
    name: "LEYTE",
    municipalities: [
    {
      name: "Abuyog",
      zipcode: "6510"
    },
    {
      name: "Alangalang",
      zipcode: "6517"
    },
    {
      name: "Albuera",
      zipcode: "6542"
    },
    {
      name: "Babatngon",
      zipcode: "6520"
    },
    {
      name: "Barugo",
      zipcode: "6519"
    },
    {
      name: "Bato",
      zipcode: "6525"
    },
    {
      name: "Baybay City",
      zipcode: "6521"
    },
    {
      name: "Burauen",
      zipcode: "6516"
    },
    {
      name: "Calubian",
      zipcode: "6534"
    },
    {
      name: "Capoocan",
      zipcode: "6530"
    },
    {
      name: "Carigara",
      zipcode: "6529"
    },
    {
      name: "Dagami",
      zipcode: "6515"
    },
    {
      name: "Dulag",
      zipcode: "6505"
    },
    {
      name: "Hilongos",
      zipcode: "6524"
    },
    {
      name: "Hindang",
      zipcode: "6523"
    },
    {
      name: "Inopacan",
      zipcode: "6522"
    },
    {
      name: "Isabel",
      zipcode: "6539"
    },
    {
      name: "Javier",
      zipcode: "6511"
    },
    {
      name: "Jaro",
      zipcode: "6527"
    },
    {
      name: "Julita",
      zipcode: "6506"
    },
    {
      name: "Kananga",
      zipcode: "6531"
    },
    {
      name: "La Paz",
      zipcode: "6508"
    },
    {
      name: "Leyte",
      zipcode: "6533"
    },
    {
      name: "MacArthur",
      zipcode: "6509"
    },
    {
      name: "Mahaplag",
      zipcode: "6512"
    },
    {
      name: "Matag-ob",
      zipcode: "6532"
    },
    {
      name: "Matalom",
      zipcode: "6526"
    },
    {
      name: "Mayorga",
      zipcode: "6507"
    },
    {
      name: "Merida",
      zipcode: "6540"
    },
    {
      name: "Ormoc City",
      zipcode: "6541"
    },
    {
      name: "Palo",
      zipcode: "6501"
    },
    {
      name: "Palompon",
      zipcode: "6538"
    },
    {
      name: "Pastrana",
      zipcode: "6514"
    },
    {
      name: "San Isidro",
      zipcode: "6535"
    },
    {
      name: "San Miguel",
      zipcode: "6518"
    },
    {
      name: "Santa Fe",
      zipcode: "6524"
    },
    {
      name: "Tabango",
      zipcode: "6536"
    },
    {
      name: "Tabontabon",
      zipcode: "6504"
    },
    {
      name: "Tacloban City",
      zipcode: "6500"
    },
    {
      name: "Tanauan",
      zipcode: "6502"
    },
    {
      name: "Tolosa",
      zipcode: "6503"
    },
    {
      name: "Tunga",
      zipcode: "6528"
    },
    {
      name: "Villaba",
      zipcode: "6537"
    }
    ]
  },
  {
    name: "NORTHERN SAMAR",
    municipalities: [
    {
      name: "Allen",
      zipcode: "6405"
    },
    {
      name: "Biri",
      zipcode: "6410"
    },
    {
      name: "Bobon",
      zipcode: "6401"
    },
    {
      name: "Capul",
      zipcode: "6414"
    },
    {
      name: "Catarman",
      zipcode: "6400"
    },
    {
      name: "Catubig",
      zipcode: "6418"
    },
    {
      name: "Gamay",
      zipcode: "6422"
    },
    {
      name: "Laoang",
      zipcode: "6411"
    },
    {
      name: "Lapinig",
      zipcode: "6423"
    },
    {
      name: "Las Navas",
      zipcode: "6420"
    },
    {
      name: "Lavezares",
      zipcode: "6404"
    },
    {
      name: "Lope de Vega",
      zipcode: "6403"
    },
    {
      name: "Mapanas",
      zipcode: "6421"
    },
    {
      name: "Mondragon",
      zipcode: "6417"
    },
    {
      name: "Palapag",
      zipcode: "6424"
    },
    {
      name: "Pambujan",
      zipcode: "6412"
    },
    {
      name: "Rosario",
      zipcode: "6416"
    },
    {
      name: "San Antonio",
      zipcode: "6415"
    },
    {
      name: "San Isidro",
      zipcode: "6409"
    },
    {
      name: "San Jose",
      zipcode: "6402"
    },
    {
      name: "San Roque",
      zipcode: "6413"
    },
    {
      name: "San Vicente",
      zipcode: "6419"
    },
    {
      name: "Silvino Lobos",
      zipcode: "6425"
    },
    {
      name: "Victoria",
      zipcode: "6408"
    }
    ]
  },
  {
    name: "SAMAR (WESTERN SAMAR)",
    municipalities: [
    {
      name: "Almagro",
      zipcode: "6715"
    },
    {
      name: "Basey",
      zipcode: "6720"
    },
    {
      name: "Calbayog City",
      zipcode: "6710"
    },
    {
      name: "Calbiga",
      zipcode: "6715"
    },
    {
      name: "Catbalogan City",
      zipcode: "6700"
    },
    {
      name: "Daram",
      zipcode: "6722"
    },
    {
      name: "Gandara",
      zipcode: "6706"
    },
    {
      name: "Hinabangan",
      zipcode: "6713"
    },
    {
      name: "Jiabong",
      zipcode: "6701"
    },
    {
      name: "Marabut",
      zipcode: "6721"
    },
    {
      name: "Matuguinao",
      zipcode: "6708"
    },
    {
      name: "Motiong",
      zipcode: "6702"
    },
    {
      name: "Pagsanghan",
      zipcode: "6705"
    },
    {
      name: "Paranas",
      zipcode: "6703"
    },
    {
      name: "Pinabacdao",
      zipcode: "6711"
    },
    {
      name: "San Jorge",
      zipcode: "6707"
    },
    {
      name: "San Jose de Buan",
      zipcode: "6709"
    },
    {
      name: "San Sebastian",
      zipcode: "6714"
    },
    {
      name: "Santa Margarita",
      zipcode: "6704"
    },
    {
      name: "Santa Rita",
      zipcode: "6718"
    },
    {
      name: "Santo Niño",
      zipcode: "6712"
    },
    {
      name: "Talalora",
      zipcode: "6719"
    },
    {
      name: "Tarangnan",
      zipcode: "6710"
    },
    {
      name: "Villareal",
      zipcode: "6717"
    },
    {
      name: "Zumarraga",
      zipcode: "6723"
    }
    ]
  },
  {
    name: "SOUTHERN LEYTE",
    municipalities: [
    {
      name: "Anahawan",
      zipcode: "6610"
    },
    {
      name: "Bontoc",
      zipcode: "6604"
    },
    {
      name: "Hinunangan",
      zipcode: "6608"
    },
    {
      name: "Hinundayan",
      zipcode: "6609"
    },
    {
      name: "Libagon",
      zipcode: "6615"
    },
    {
      name: "Liloan",
      zipcode: "6612"
    },
    {
      name: "Limasawa",
      zipcode: "6618"
    },
    {
      name: "Maasin City",
      zipcode: "6600"
    },
    {
      name: "Macrohon",
      zipcode: "6601"
    },
    {
      name: "Malitbog",
      zipcode: "6603"
    },
    {
      name: "Padre Burgos",
      zipcode: "6602"
    },
    {
      name: "Pintuyan",
      zipcode: "6614"
    },
    {
      name: "Saint Bernard",
      zipcode: "6616"
    },
    {
      name: "San Francisco",
      zipcode: "6613"
    },
    {
      name: "San Juan",
      zipcode: "6611"
    },
    {
      name: "San Ricardo",
      zipcode: "6617"
    },
    {
      name: "Silago",
      zipcode: "6607"
    },
    {
      name: "Sogod",
      zipcode: "6605"
    },
    {
      name: "Tomas Oppus",
      zipcode: "6606"
    }
    ]
  }
  ]
},
{
  name: "Region IX – Zamboanga Peninsula",
  provinces: [
  {
    name: "ZAMBOANGA DEL NORTE",
    municipalities: [
    {
      name: "Baliguian",
      zipcode: "7123"
    },
    {
      name: "Dapitan City",
      zipcode: "7101"
    },
    {
      name: "Dipolog City",
      zipcode: "7100"
    },
    {
      name: "Godod",
      zipcode: "7121"
    },
    {
      name: "Gutalac",
      zipcode: "7118"
    },
    {
      name: "Jose Dalman",
      zipcode: "7111"
    },
    {
      name: "Kalawit",
      zipcode: "7124"
    },
    {
      name: "Katipunan",
      zipcode: "7109"
    },
    {
      name: "La Libertad",
      zipcode: "7119"
    },
    {
      name: "Labason",
      zipcode: "7117"
    },
    {
      name: "Leon B. Postigo",
      zipcode: "7122"
    },
    {
      name: "Liloy",
      zipcode: "7115"
    },
    {
      name: "Manukan",
      zipcode: "7110"
    },
    {
      name: "Mutia",
      zipcode: "7107"
    },
    {
      name: "Piñan",
      zipcode: "7105"
    },
    {
      name: "Polanco",
      zipcode: "7106"
    },
    {
      name: "President Manuel A. Roxas",
      zipcode: "7102"
    },
    {
      name: "Rizal",
      zipcode: "7104"
    },
    {
      name: "Salug",
      zipcode: "7114"
    },
    {
      name: "Sergio Osmeña Sr.",
      zipcode: "7108"
    },
    {
      name: "Siayan",
      zipcode: "7113"
    },
    {
      name: "Sibuco",
      zipcode: "7120"
    },
    {
      name: "Sibutad",
      zipcode: "7103"
    },
    {
      name: "Sindangan",
      zipcode: "7112"
    },
    {
      name: "Siocon",
      zipcode: "7121"
    },
    {
      name: "Sirawai",
      zipcode: "7121"
    },
    {
      name: "Tampilisan",
      zipcode: "7116"
    }
    ]
  },
  {
    name: "ZAMBOANGA DEL SUR",
    municipalities: [
    {
      name: "Aurora",
      zipcode: "7020"
    },
    {
      name: "Bayog",
      zipcode: "7011"
    },
    {
      name: "Dimataling",
      zipcode: "7032"
    },
    {
      name: "Dinas",
      zipcode: "7030"
    },
    {
      name: "Dumalinao",
      zipcode: "7015"
    },
    {
      name: "Dumingag",
      zipcode: "7028"
    },
    {
      name: "Guipos",
      zipcode: "7042"
    },
    {
      name: "Josefina",
      zipcode: "7027"
    },
    {
      name: "Kumalarang",
      zipcode: "7013"
    },
    {
      name: "Labangan",
      zipcode: "7017"
    },
    {
      name: "Lakewood",
      zipcode: "7014"
    },
    {
      name: "Lapuyan",
      zipcode: "7037"
    },
    {
      name: "Mahayag",
      zipcode: "7026"
    },
    {
      name: "Margosatubig",
      zipcode: "7035"
    },
    {
      name: "Midsalip",
      zipcode: "7021"
    },
    {
      name: "Molave",
      zipcode: "7023"
    },
    {
      name: "Pagadian City",
      zipcode: "7016"
    },
    {
      name: "Pitogo",
      zipcode: "7033"
    },
    {
      name: "Ramon Magsaysay",
      zipcode: "7024"
    },
    {
      name: "San Miguel",
      zipcode: "7029"
    },
    {
      name: "San Pablo",
      zipcode: "7031"
    },
    {
      name: "Sominot",
      zipcode: "7022"
    },
    {
      name: "Tabina",
      zipcode: "7034"
    },
    {
      name: "Tambulig",
      zipcode: "7025"
    },
    {
      name: "Tigbao",
      zipcode: "7043"
    },
    {
      name: "Tukuran",
      zipcode: "7019"
    },
    {
      name: "Vincenzo A. Sagun",
      zipcode: "7036"
    },
    {
      name: "Zamboanga City",
      zipcode: "7000"
    }
    ]
  },
  {
    name: "ZAMBOANGA SIBUGAY",
    municipalities: [
    {
      name: "Alicia",
      zipcode: "7040"
    },
    {
      name: "Buug",
      zipcode: "7009"
    },
    {
      name: "Diplahan",
      zipcode: "7039"
    },
    {
      name: "Imelda",
      zipcode: "7007"
    },
    {
      name: "Ipil",
      zipcode: "7001"
    },
    {
      name: "Kabasalan",
      zipcode: "7005"
    },
    {
      name: "Mabuhay",
      zipcode: "7010"
    },
    {
      name: "Malangas",
      zipcode: "7038"
    },
    {
      name: "Naga",
      zipcode: "7030"
    },
    {
      name: "Olutanga",
      zipcode: "7041"
    },
    {
      name: "Payao",
      zipcode: "7008"
    },
    {
      name: "Roseller Lim",
      zipcode: "7004"
    },
    {
      name: "Siay",
      zipcode: "7006"
    },
    {
      name: "Talusan",
      zipcode: "7011"
    },
    {
      name: "Titay",
      zipcode: "7003"
    },
    {
      name: "Tungawan",
      zipcode: "7002"
    }
    ]
  }
  ]
},
{
  name: "Region X – Northern Mindanao",
  provinces: [
  {
    name: "BUKIDNON",
    municipalities: [
    {
      name: "Baungon",
      zipcode: "8707"
    },
    {
      name: "Cabanglasan",
      zipcode: "8723"
    },
    {
      name: "Damulog",
      zipcode: "8721"
    },
    {
      name: "Dangcagan",
      zipcode: "8719"
    },
    {
      name: "Don Carlos",
      zipcode: "8712"
    },
    {
      name: "Impasug-ong",
      zipcode: "8702"
    },
    {
      name: "Kadingilan",
      zipcode: "8713"
    },
    {
      name: "Kalilangan",
      zipcode: "8718"
    },
    {
      name: "Kitaotao",
      zipcode: "8716"
    },
    {
      name: "Lantapan",
      zipcode: "8722"
    },
    {
      name: "Libona",
      zipcode: "8706"
    },
    {
      name: "Malaybalay City",
      zipcode: "8700"
    },
    {
      name: "Malitbog",
      zipcode: "8704"
    },
    {
      name: "Manolo Fortich",
      zipcode: "8703"
    },
    {
      name: "Maramag",
      zipcode: "8714"
    },
    {
      name: "Pangantucan",
      zipcode: "8717"
    },
    {
      name: "Quezon",
      zipcode: "8715"
    },
    {
      name: "San Fernando",
      zipcode: "8711"
    },
    {
      name: "Sumilao",
      zipcode: "8701"
    },
    {
      name: "Talakag",
      zipcode: "8708"
    },
    {
      name: "Valencia City",
      zipcode: "8709"
    }
    ]
  },
  {
    name: "CAMIGUIN",
    municipalities: [
    {
      name: "Catarman",
      zipcode: "9104"
    },
    {
      name: "Guinsiliban",
      zipcode: "9102"
    },
    {
      name: "Mahinog",
      zipcode: "9101"
    },
    {
      name: "Mambajao",
      zipcode: "9100"
    },
    {
      name: "Sagay",
      zipcode: "9103"
    }
    ]
  },
  {
    name: "LANAO DEL NORTE",
    municipalities: [
    {
      name: "Bacolod",
      zipcode: "8705"
    },
    {
      name: "Baloi",
      zipcode: "9217"
    },
    {
      name: "Baroy",
      zipcode: "9210"
    },
    {
      name: "Iligan City",
      zipcode: "9200"
    },
    {
      name: "Kapatagan",
      zipcode: "9214"
    },
    {
      name: "Kauswagan",
      zipcode: "9202"
    },
    {
      name: "Kolambugan",
      zipcode: "9207"
    },
    {
      name: "Lala",
      zipcode: "9211"
    },
    {
      name: "Linamon",
      zipcode: "9201"
    },
    {
      name: "Magsaysay",
      zipcode: "9221"
    },
    {
      name: "Maigo",
      zipcode: "9206"
    },
    {
      name: "Matungao",
      zipcode: "9203"
    },
    {
      name: "Munai",
      zipcode: "9219"
    },
    {
      name: "Nunungan",
      zipcode: "9216"
    },
    {
      name: "Pantao Ragat",
      zipcode: "9205"
    },
    {
      name: "Pantar",
      zipcode: "9218"
    },
    {
      name: "Poona Piagapo",
      zipcode: "9204"
    },
    {
      name: "Salvador",
      zipcode: "9212"
    },
    {
      name: "Sapad",
      zipcode: "9215"
    },
    {
      name: "Sultan Naga Dimaporo",
      zipcode: "9213"
    },
    {
      name: "Tagoloan",
      zipcode: "9222"
    },
    {
      name: "Tangcal",
      zipcode: "9220"
    },
    {
      name: "Tubod",
      zipcode: "9209"
    }
    ]
  },
  {
    name: "MISAMIS OCCIDENTAL",
    municipalities: [
    {
      name: "Aloran",
      zipcode: "7206"
    },
    {
      name: "Baliangao",
      zipcode: "7211"
    },
    {
      name: "Bonifacio",
      zipcode: "7215"
    },
    {
      name: "Calamba",
      zipcode: "7210"
    },
    {
      name: "Clarin",
      zipcode: "7201"
    },
    {
      name: "Concepcion",
      zipcode: "7213"
    },
    {
      name: "Don Victoriano Chiongbian",
      zipcode: "7209"
    },
    {
      name: "Jimenez",
      zipcode: "7204"
    },
    {
      name: "Lopez Jaena",
      zipcode: "7208"
    },
    {
      name: "Oroquieta City",
      zipcode: "7207"
    },
    {
      name: "Ozamiz City",
      zipcode: "7200"
    },
    {
      name: "Panaon",
      zipcode: "7214"
    },
    {
      name: "Plaridel",
      zipcode: "7209"
    },
    {
      name: "Sapang Dalaga",
      zipcode: "7212"
    },
    {
      name: "Sinacaban",
      zipcode: "7203"
    },
    {
      name: "Tangub City",
      zipcode: "7214"
    },
    {
      name: "Tudela",
      zipcode: "7202"
    }
    ]
  },
  {
    name: "MISAMIS ORIENTAL",
    municipalities: [
    {
      name: "Alubijid",
      zipcode: "9018"
    },
    {
      name: "Balingasag",
      zipcode: "9005"
    },
    {
      name: "Balingoan",
      zipcode: "9011"
    },
    {
      name: "Binuangan",
      zipcode: "9008"
    },
    {
      name: "Cagayan de Oro City",
      zipcode: "9000"
    },
    {
      name: "Claveria",
      zipcode: "9004"
    },
    {
      name: "El Salvador City",
      zipcode: "9017"
    },
    {
      name: "Gingoog City",
      zipcode: "9014"
    },
    {
      name: "Gitagum",
      zipcode: "9020"
    },
    {
      name: "Initao",
      zipcode: "9022"
    },
    {
      name: "Jasaan",
      zipcode: "9003"
    },
    {
      name: "Kinoguitan",
      zipcode: "9010"
    },
    {
      name: "Lagonglong",
      zipcode: "9006"
    },
    {
      name: "Laguindingan",
      zipcode: "9019"
    },
    {
      name: "Libertad",
      zipcode: "9021"
    },
    {
      name: "Lugait",
      zipcode: "9025"
    },
    {
      name: "Magsaysay",
      zipcode: "9015"
    },
    {
      name: "Medina",
      zipcode: "9013"
    },
    {
      name: "Naawan",
      zipcode: "9023"
    },
    {
      name: "Opol",
      zipcode: "9016"
    },
    {
      name: "Salay",
      zipcode: "9007"
    },
    {
      name: "Sugbongcogon",
      zipcode: "9009"
    },
    {
      name: "Tagoloan",
      zipcode: "9001"
    },
    {
      name: "Talisayan",
      zipcode: "9012"
    },
    {
      name: "Villanueva",
      zipcode: "9002"
    }
    ]
  }
  ]
},
{
  name: "Region XI – Davao Region",
  provinces: [
  {
    name: "DAVAO DE ORO",
    municipalities: [
    {
      name: "Compostela",
      zipcode: "8803"
    },
    {
      name: "Laak",
      zipcode: "8810"
    },
    {
      name: "Mabini",
      zipcode: "8807"
    },
    {
      name: "Maco",
      zipcode: "8806"
    },
    {
      name: "Maragusan",
      zipcode: "8808"
    },
    {
      name: "Mawab",
      zipcode: "8802"
    },
    {
      name: "Monkayo",
      zipcode: "8805"
    },
    {
      name: "Montevista",
      zipcode: "8801"
    },
    {
      name: "Nabunturan",
      zipcode: "8800"
    },
    {
      name: "New Bataan",
      zipcode: "8809"
    },
    {
      name: "Pantukan",
      zipcode: "8804"
    }
    ]
  },
  {
    name: "DAVAO DEL NORTE",
    municipalities: [
    {
      name: "Asuncion",
      zipcode: "8102"
    },
    {
      name: "Braulio E. Dujali",
      zipcode: "8107"
    },
    {
      name: "Carmen",
      zipcode: "8101"
    },
    {
      name: "Kapalong",
      zipcode: "8113"
    },
    {
      name: "New Corella",
      zipcode: "8104"
    },
    {
      name: "Panabo City",
      zipcode: "8105"
    },
    {
      name: "Samal",
      zipcode: "8119"
    },
    {
      name: "San Isidro",
      zipcode: "8121"
    },
    {
      name: "Santo Tomas",
      zipcode: "8112"
    },
    {
      name: "Tagum City",
      zipcode: "8100"
    },
    {
      name: "Talaingod",
      zipcode: "8118"
    }
    ]
  },
  {
    name: "DAVAO DEL SUR",
    municipalities: [
    {
      name: "Bansalan",
      zipcode: "8005"
    },
    {
      name: "Davao City",
      zipcode: "8000"
    },
    {
      name: "Digos City",
      zipcode: "8002"
    },
    {
      name: "Hagonoy",
      zipcode: "8006"
    },
    {
      name: "Kiblawan",
      zipcode: "8008"
    },
    {
      name: "Magsaysay",
      zipcode: "8009"
    },
    {
      name: "Malalag",
      zipcode: "8010"
    },
    {
      name: "Matanao",
      zipcode: "8003"
    },
    {
      name: "Padada",
      zipcode: "8007"
    },
    {
      name: "Santa Cruz",
      zipcode: "8001"
    },
    {
      name: "Sulop",
      zipcode: "8004"
    }
    ]
  },
  {
    name: "DAVAO OCCIDENTAL",
    municipalities: [
    {
      name: "Don Marcelino",
      zipcode: "8013"
    },
    {
      name: "Jose Abad Santos",
      zipcode: "8014"
    },
    {
      name: "Malita",
      zipcode: "8012"
    },
    {
      name: "Santa Maria",
      zipcode: "8011"
    },
    {
      name: "Sarangani",
      zipcode: "8015"
    }
    ]
  },
  {
    name: "DAVAO ORIENTAL",
    municipalities: [
    {
      name: "Baganga",
      zipcode: "8204"
    },
    {
      name: "Banaybanay",
      zipcode: "8208"
    },
    {
      name: "Boston",
      zipcode: "8206"
    },
    {
      name: "Caraga",
      zipcode: "8203"
    },
    {
      name: "Cateel",
      zipcode: "8205"
    },
    {
      name: "Governor Generoso",
      zipcode: "8210"
    },
    {
      name: "Lupon",
      zipcode: "8207"
    },
    {
      name: "Manay",
      zipcode: "8202"
    },
    {
      name: "Mati City",
      zipcode: "8200"
    },
    {
      name: "San Isidro",
      zipcode: "8209"
    },
    {
      name: "Tarragona",
      zipcode: "8201"
    }
    ]
  }
  ]
},
{
  name: "Region IV-A – CALABARZON",
  provinces: [
  {
    name: "BATANGAS",
    municipalities: [
    {
      name: "Agoncillo",
      zipcode: "4211"
    },
    {
      name: "Alitagtag",
      zipcode: "4205"
    },
    {
      name: "Balayan",
      zipcode: "4213"
    },
    {
      name: "Balete",
      zipcode: "4219"
    },
    {
      name: "Batangas City",
      zipcode: "4200"
    },
    {
      name: "Bauan",
      zipcode: "4201"
    },
    {
      name: "Calaca",
      zipcode: "4212"
    },
    {
      name: "Calatagan",
      zipcode: "4215"
    },
    {
      name: "Cuenca",
      zipcode: "4222"
    },
    {
      name: "Ibaan",
      zipcode: "4230"
    },
    {
      name: "Laurel",
      zipcode: "4221"
    },
    {
      name: "Lemery",
      zipcode: "4209"
    },
    {
      name: "Lian",
      zipcode: "4216"
    },
    {
      name: "Lipa City",
      zipcode: "4217"
    },
    {
      name: "Lobo",
      zipcode: "4229"
    },
    {
      name: "Mabini",
      zipcode: "4202"
    },
    {
      name: "Malvar",
      zipcode: "4233"
    },
    {
      name: "Mataas na Kahoy",
      zipcode: "4223"
    },
    {
      name: "Nasugbu",
      zipcode: "4231"
    },
    {
      name: "Padre Garcia",
      zipcode: "4224"
    },
    {
      name: "Rosario",
      zipcode: "4225"
    },
    {
      name: "San Jose",
      zipcode: "4227"
    },
    {
      name: "San Juan",
      zipcode: "4226"
    },
    {
      name: "San Luis",
      zipcode: "4210"
    },
    {
      name: "San Nicolas",
      zipcode: "4207"
    },
    {
      name: "San Pascual",
      zipcode: "4204"
    },
    {
      name: "Santa Teresita",
      zipcode: "4206"
    },
    {
      name: "Santo Tomas City",
      zipcode: "4234"
    },
    {
      name: "Taal",
      zipcode: "4208"
    },
    {
      name: "Talisay",
      zipcode: "4220"
    },
    {
      name: "Tanauan City",
      zipcode: "4232"
    },
    {
      name: "Taysan",
      zipcode: "4228"
    },
    {
      name: "Tingloy",
      zipcode: "4203"
    },
    {
      name: "Tuy",
      zipcode: "4214"
    }
    ]
  },
  {
    name: "CAVITE",
    municipalities: [
    {
      name: "Alfonso",
      zipcode: "4123"
    },
    {
      name: "Amadeo",
      zipcode: "4119"
    },
    {
      name: "Bacoor City",
      zipcode: "4102"
    },
    {
      name: "Carmona",
      zipcode: "4116"
    },
    {
      name: "Cavite City",
      zipcode: "4100"
    },
    {
      name: "Dasmariñas City",
      zipcode: "4114"
    },
    {
      name: "General Emilio Aguinaldo",
      zipcode: "4124"
    },
    {
      name: "General Mariano Alvarez",
      zipcode: "4117"
    },
    {
      name: "General Trias City",
      zipcode: "4107"
    },
    {
      name: "Imus City",
      zipcode: "4103"
    },
    {
      name: "Indang",
      zipcode: "4122"
    },
    {
      name: "Kawit",
      zipcode: "4104"
    },
    {
      name: "Magallanes",
      zipcode: "4113"
    },
    {
      name: "Maragondon",
      zipcode: "4112"
    },
    {
      name: "Mendez-Nuñez",
      zipcode: "4121"
    },
    {
      name: "Naic",
      zipcode: "4110"
    },
    {
      name: "Noveleta",
      zipcode: "4105"
    },
    {
      name: "Rosario",
      zipcode: "4106"
    },
    {
      name: "Silang",
      zipcode: "4118"
    },
    {
      name: "Tagaytay City",
      zipcode: "4120"
    },
    {
      name: "Tanza",
      zipcode: "4108"
    },
    {
      name: "Ternate",
      zipcode: "4111"
    },
    {
      name: "Trece Martires City",
      zipcode: "4109"
    }
    ]
  },
  {
    name: "LAGUNA",
    municipalities: [
    {
      name: "Alaminos",
      zipcode: "4001"
    },
    {
      name: "Bay",
      zipcode: "4033"
    },
    {
      name: "Biñan City",
      zipcode: "4024"
    },
    {
      name: "Cabuyao City",
      zipcode: "4025"
    },
    {
      name: "Calamba City",
      zipcode: "4027"
    },
    {
      name: "Calauan",
      zipcode: "4012"
    },
    {
      name: "Cavinti",
      zipcode: "4013"
    },
    {
      name: "Famy",
      zipcode: "4021"
    },
    {
      name: "Kalayaan",
      zipcode: "4022"
    },
    {
      name: "Liliw",
      zipcode: "4004"
    },
    {
      name: "Los Baños",
      zipcode: "4030"
    },
    {
      name: "Luisiana",
      zipcode: "4032"
    },
    {
      name: "Lumban",
      zipcode: "4014"
    },
    {
      name: "Mabitac",
      zipcode: "4020"
    },
    {
      name: "Magdalena",
      zipcode: "4007"
    },
    {
      name: "Majayjay",
      zipcode: "4005"
    },
    {
      name: "Nagcarlan",
      zipcode: "4002"
    },
    {
      name: "Paete",
      zipcode: "4016"
    },
    {
      name: "Pagsanjan",
      zipcode: "4008"
    },
    {
      name: "Pakil",
      zipcode: "4017"
    },
    {
      name: "Pangil",
      zipcode: "4018"
    },
    {
      name: "Pila",
      zipcode: "4010"
    },
    {
      name: "Rizal",
      zipcode: "4003"
    },
    {
      name: "San Pablo City",
      zipcode: "4000"
    },
    {
      name: "San Pedro City",
      zipcode: "4023"
    },
    {
      name: "Santa Cruz",
      zipcode: "4009"
    },
    {
      name: "Santa Maria",
      zipcode: "4022"
    },
    {
      name: "Santa Rosa City",
      zipcode: "4026"
    },
    {
      name: "Siniloan",
      zipcode: "4019"
    },
    {
      name: "Victoria",
      zipcode: "4011"
    }
    ]
  },
  {
    name: "QUEZON",
    municipalities: [
    {
      name: "Agdangan",
      zipcode: "4304"
    },
    {
      name: "Alabat",
      zipcode: "4333"
    },
    {
      name: "Atimonan",
      zipcode: "4331"
    },
    {
      name: "Buenavista",
      zipcode: "4320"
    },
    {
      name: "Burdeos",
      zipcode: "4340"
    },
    {
      name: "Calauag",
      zipcode: "4318"
    },
    {
      name: "Candelaria",
      zipcode: "4323"
    },
    {
      name: "Catanauan",
      zipcode: "4311"
    },
    {
      name: "Dolores",
      zipcode: "4326"
    },
    {
      name: "General Luna",
      zipcode: "4310"
    },
    {
      name: "General Nakar",
      zipcode: "4338"
    },
    {
      name: "Guinayangan",
      zipcode: "4314"
    },
    {
      name: "Gumaca",
      zipcode: "4307"
    },
    {
      name: "Infanta",
      zipcode: "4336"
    },
    {
      name: "Jomalig",
      zipcode: "4342"
    },
    {
      name: "Lopez",
      zipcode: "4316"
    },
    {
      name: "Lucban",
      zipcode: "4328"
    },
    {
      name: "Lucena City",
      zipcode: "4301"
    },
    {
      name: "Macalelon",
      zipcode: "4309"
    },
    {
      name: "Mauban",
      zipcode: "4330"
    },
    {
      name: "Mulanay",
      zipcode: "4312"
    },
    {
      name: "Padre Burgos",
      zipcode: "4303"
    },
    {
      name: "Pagbilao",
      zipcode: "4302"
    },
    {
      name: "Panukulan",
      zipcode: "4337"
    },
    {
      name: "Patnanungan",
      zipcode: "4341"
    },
    {
      name: "Perez",
      zipcode: "4334"
    },
    {
      name: "Pitogo",
      zipcode: "4308"
    },
    {
      name: "Plaridel",
      zipcode: "4306"
    },
    {
      name: "Polillo",
      zipcode: "4339"
    },
    {
      name: "Quezon",
      zipcode: "4332"
    },
    {
      name: "Real",
      zipcode: "4335"
    },
    {
      name: "Sampaloc",
      zipcode: "4329"
    },
    {
      name: "San Andres",
      zipcode: "4313"
    },
    {
      name: "San Antonio",
      zipcode: "4324"
    },
    {
      name: "San Francisco",
      zipcode: "4315"
    },
    {
      name: "San Narciso",
      zipcode: "4317"
    },
    {
      name: "Sariaya",
      zipcode: "4322"
    },
    {
      name: "Tagkawayan",
      zipcode: "4321"
    },
    {
      name: "Tayabas City",
      zipcode: "4327"
    },
    {
      name: "Tiaong",
      zipcode: "4325"
    },
    {
      name: "Unisan",
      zipcode: "4305"
    }
    ]
  },
  {
    name: "RIZAL",
    municipalities: [
    {
      name: "Angono",
      zipcode: "1930"
    },
    {
      name: "Antipolo City",
      zipcode: "1870"
    },
    {
      name: "Baras",
      zipcode: "1970"
    },
    {
      name: "Binangonan",
      zipcode: "1940"
    },
    {
      name: "Cainta",
      zipcode: "1900"
    },
    {
      name: "Cardona",
      zipcode: "1950"
    },
    {
      name: "Jalajala",
      zipcode: "1990"
    },
    {
      name: "Morong",
      zipcode: "1960"
    },
    {
      name: "Pililla",
      zipcode: "1910"
    },
    {
      name: "Rodriguez",
      zipcode: "1860"
    },
    {
      name: "San Mateo",
      zipcode: "1850"
    },
    {
      name: "Tanay",
      zipcode: "1980"
    },
    {
      name: "Taytay",
      zipcode: "1920"
    },
    {
      name: "Teresa",
      zipcode: "1880"
    }
    ]
  }
  ]
},
{
  name: "Region XII – SOCCSKSARGEN",
  provinces: [
  {
    name: "COTABATO (NORTH COTABATO)",
    municipalities: [
    {
      name: "Alamada",
      zipcode: "9413"
    },
    {
      name: "Aleosan",
      zipcode: "9415"
    },
    {
      name: "Antipas",
      zipcode: "9414"
    },
    {
      name: "Arakan",
      zipcode: "9417"
    },
    {
      name: "Banisilan",
      zipcode: "9416"
    },
    {
      name: "Carmen",
      zipcode: "9408"
    },
    {
      name: "Kabacan",
      zipcode: "9407"
    },
    {
      name: "Kidapawan City",
      zipcode: "9400"
    },
    {
      name: "Libungan",
      zipcode: "9411"
    },
    {
      name: "M'lang",
      zipcode: "9402"
    },
    {
      name: "Magpet",
      zipcode: "9404"
    },
    {
      name: "Makilala",
      zipcode: "9401"
    },
    {
      name: "Matalam",
      zipcode: "9406"
    },
    {
      name: "Midsayap",
      zipcode: "9410"
    },
    {
      name: "Pigcawayan",
      zipcode: "9409"
    },
    {
      name: "Pikit",
      zipcode: "9403"
    },
    {
      name: "President Roxas",
      zipcode: "9416"
    },
    {
      name: "Tulunan",
      zipcode: "9404"
    }
    ]
  },
  {
    name: "SOUTH COTABATO",
    municipalities: [
    {
      name: "Banga",
      zipcode: "9511"
    },
    {
      name: "General Santos City",
      zipcode: "9500"
    },
    {
      name: "Koronadal City",
      zipcode: "9506"
    },
    {
      name: "Lake Sebu",
      zipcode: "9518"
    },
    {
      name: "Norala",
      zipcode: "9512"
    },
    {
      name: "Polomolok",
      zipcode: "9504"
    },
    {
      name: "Santo Niño",
      zipcode: "9509"
    },
    {
      name: "Surallah",
      zipcode: "9512"
    },
    {
      name: "Tampakan",
      zipcode: "9507"
    },
    {
      name: "Tantangan",
      zipcode: "9510"
    },
    {
      name: "T'boli",
      zipcode: "9513"
    },
    {
      name: "Tupi",
      zipcode: "9505"
    }
    ]
  },
  {
    name: "SULTAN KUDARAT",
    municipalities: [
    {
      name: "Bagumbayan",
      zipcode: "9810"
    },
    {
      name: "Columbio",
      zipcode: "9801"
    },
    {
      name: "Esperanza",
      zipcode: "9806"
    },
    {
      name: "Isulan",
      zipcode: "9805"
    },
    {
      name: "Kalamansig",
      zipcode: "9808"
    },
    {
      name: "Lambayong",
      zipcode: "9802"
    },
    {
      name: "Lebak",
      zipcode: "9807"
    },
    {
      name: "Lutayan",
      zipcode: "9803"
    },
    {
      name: "Palimbang",
      zipcode: "9809"
    },
    {
      name: "President Quirino",
      zipcode: "9804"
    },
    {
      name: "Senator Ninoy Aquino",
      zipcode: "9811"
    },
    {
      name: "Tacurong City",
      zipcode: "9800"
    }
    ]
  },
  {
    name: "SARANGANI",
    municipalities: [
    {
      name: "Alabel",
      zipcode: "9501"
    },
    {
      name: "Glan",
      zipcode: "9517"
    },
    {
      name: "Kiamba",
      zipcode: "9514"
    },
    {
      name: "Maasim",
      zipcode: "9502"
    },
    {
      name: "Maitum",
      zipcode: "9515"
    },
    {
      name: "Malapatan",
      zipcode: "9516"
    },
    {
      name: "Malungon",
      zipcode: "9503"
    }
    ]
  }
  ]
},
{
  name: "Region XIII – CARAGA",
  provinces: [
  {
    name: "AGUSAN DEL NORTE",
    municipalities: [
    {
      name: "Buenavista",
      zipcode: "8601"
    },
    {
      name: "Butuan City",
      zipcode: "8600"
    },
    {
      name: "Cabadbaran City",
      zipcode: "8605"
    },
    {
      name: "Carmen",
      zipcode: "8603"
    },
    {
      name: "Jabonga",
      zipcode: "8607"
    },
    {
      name: "Kitcharao",
      zipcode: "8609"
    },
    {
      name: "Las Nieves",
      zipcode: "8610"
    },
    {
      name: "Magallanes",
      zipcode: "8604"
    },
    {
      name: "Nasipit",
      zipcode: "8602"
    },
    {
      name: "Remedios T. Romualdez",
      zipcode: "8611"
    },
    {
      name: "Santiago",
      zipcode: "8608"
    },
    {
      name: "Tubay",
      zipcode: "8606"
    }
    ]
  },
  {
    name: "AGUSAN DEL SUR",
    municipalities: [
    {
      name: "Bayugan City",
      zipcode: "8502"
    },
    {
      name: "Bunawan",
      zipcode: "8506"
    },
    {
      name: "Esperanza",
      zipcode: "8513"
    },
    {
      name: "La Paz",
      zipcode: "8508"
    },
    {
      name: "Loreto",
      zipcode: "8507"
    },
    {
      name: "Prosperidad",
      zipcode: "8500"
    },
    {
      name: "Rosario",
      zipcode: "8504"
    },
    {
      name: "San Francisco",
      zipcode: "8501"
    },
    {
      name: "San Luis",
      zipcode: "8511"
    },
    {
      name: "Santa Josefa",
      zipcode: "8512"
    },
    {
      name: "Sibagat",
      zipcode: "8503"
    },
    {
      name: "Talacogon",
      zipcode: "8510"
    },
    {
      name: "Trento",
      zipcode: "8505"
    },
    {
      name: "Veruela",
      zipcode: "8514"
    }
    ]
  },
  {
    name: "SURIGAO DEL NORTE",
    municipalities: [
    {
      name: "Alegria",
      zipcode: "8425"
    },
    {
      name: "Bacuag",
      zipcode: "8408"
    },
    {
      name: "Burgos",
      zipcode: "8424"
    },
    {
      name: "Claver",
      zipcode: "8410"
    },
    {
      name: "Dapa",
      zipcode: "8417"
    },
    {
      name: "Del Carmen",
      zipcode: "8418"
    },
    {
      name: "General Luna",
      zipcode: "8419"
    },
    {
      name: "Gigaquit",
      zipcode: "8409"
    },
    {
      name: "Mainit",
      zipcode: "8407"
    },
    {
      name: "Malimono",
      zipcode: "8402"
    },
    {
      name: "Pilar",
      zipcode: "8420"
    },
    {
      name: "Placer",
      zipcode: "8405"
    },
    {
      name: "San Benito",
      zipcode: "8423"
    },
    {
      name: "San Francisco",
      zipcode: "8401"
    },
    {
      name: "San Isidro",
      zipcode: "8421"
    },
    {
      name: "Santa Monica",
      zipcode: "8422"
    },
    {
      name: "Sison",
      zipcode: "8404"
    },
    {
      name: "Socorro",
      zipcode: "8416"
    },
    {
      name: "Surigao City",
      zipcode: "8400"
    },
    {
      name: "Tagana-an",
      zipcode: "8403"
    },
    {
      name: "Tubod",
      zipcode: "8406"
    }
    ]
  },
  {
    name: "SURIGAO DEL SUR",
    municipalities: [
    {
      name: "Barobo",
      zipcode: "8309"
    },
    {
      name: "Bayabas",
      zipcode: "8303"
    },
    {
      name: "Bislig City",
      zipcode: "8311"
    },
    {
      name: "Cagwait",
      zipcode: "8304"
    },
    {
      name: "Cantilan",
      zipcode: "8317"
    },
    {
      name: "Carmen",
      zipcode: "8315"
    },
    {
      name: "Carrascal",
      zipcode: "8318"
    },
    {
      name: "Cortes",
      zipcode: "8313"
    },
    {
      name: "Hinatuan",
      zipcode: "8310"
    },
    {
      name: "Lanuza",
      zipcode: "8314"
    },
    {
      name: "Lianga",
      zipcode: "8307"
    },
    {
      name: "Lingig",
      zipcode: "8312"
    },
    {
      name: "Madrid",
      zipcode: "8316"
    },
    {
      name: "Marihatag",
      zipcode: "8306"
    },
    {
      name: "San Agustin",
      zipcode: "8305"
    },
    {
      name: "San Miguel",
      zipcode: "8308"
    },
    {
      name: "Tagbina",
      zipcode: "8302"
    },
    {
      name: "Tago",
      zipcode: "8301"
    },
    {
      name: "Tandag City",
      zipcode: "8300"
    }
    ]
  },
  {
    name: "DINAGAT ISLANDS",
    municipalities: [
    {
      name: "Basilisa",
      zipcode: "8413"
    },
    {
      name: "Cagdianao",
      zipcode: "8411"
    },
    {
      name: "Dinagat",
      zipcode: "8412"
    },
    {
      name: "Libjo",
      zipcode: "8414"
    },
    {
      name: "Loreto",
      zipcode: "8415"
    },
    {
      name: "San Jose",
      zipcode: "8427"
    },
    {
      name: "Tubajon",
      zipcode: "8426"
    }
    ]
  }
  ]
},
{
  name: "BARMM – Bangsamoro Autonomous Region in Muslim Mindanao",
  provinces: [
  {
    name: "BASILAN",
    municipalities: [
    {
      name: "Akbar",
      zipcode: "7304"
    },
    {
      name: "Al-Barka",
      zipcode: "7306"
    },
    {
      name: "Hadji Mohammad Ajul",
      zipcode: "7307"
    },
    {
      name: "Hadji Muhtamad",
      zipcode: "7305"
    },
    {
      name: "Isabela City",
      zipcode: "7300"
    },
    {
      name: "Lamitan City",
      zipcode: "7302"
    },
    {
      name: "Lantawan",
      zipcode: "7301"
    },
    {
      name: "Maluso",
      zipcode: "7303"
    },
    {
      name: "Sumisip",
      zipcode: "7305"
    },
    {
      name: "Tabuan-Lasa",
      zipcode: "7306"
    },
    {
      name: "Tipo-Tipo",
      zipcode: "7304"
    },
    {
      name: "Tuburan",
      zipcode: "7306"
    },
    {
      name: "Ungkaya Pukan",
      zipcode: "7304"
    }
    ]
  },
  {
    name: "LANAO DEL SUR",
    municipalities: [
    {
      name: "Bacolod-Kalawi",
      zipcode: "9306"
    },
    {
      name: "Balabagan",
      zipcode: "9317"
    },
    {
      name: "Balindong",
      zipcode: "9318"
    },
    {
      name: "Bayang",
      zipcode: "9309"
    },
    {
      name: "Binidayan",
      zipcode: "9310"
    },
    {
      name: "Buadiposo-Buntong",
      zipcode: "9709"
    },
    {
      name: "Bubong",
      zipcode: "9708"
    },
    {
      name: "Butig",
      zipcode: "9305"
    },
    {
      name: "Calanogas",
      zipcode: "9320"
    },
    {
      name: "Ditsaan-Ramain",
      zipcode: "9711"
    },
    {
      name: "Ganassi",
      zipcode: "9311"
    },
    {
      name: "Kapai",
      zipcode: "9701"
    },
    {
      name: "Kapatagan",
      zipcode: "9314"
    },
    {
      name: "Lumba-Bayabao",
      zipcode: "9706"
    },
    {
      name: "Lumbaca-Unayan",
      zipcode: "9315"
    },
    {
      name: "Lumbatan",
      zipcode: "9312"
    },
    {
      name: "Lumbayanague",
      zipcode: "9313"
    },
    {
      name: "Madalum",
      zipcode: "9319"
    },
    {
      name: "Madamba",
      zipcode: "9321"
    },
    {
      name: "Malabang",
      zipcode: "9300"
    },
    {
      name: "Marantao",
      zipcode: "9705"
    },
    {
      name: "Marawi City",
      zipcode: "9700"
    },
    {
      name: "Masiu",
      zipcode: "9702"
    },
    {
      name: "Mulondo",
      zipcode: "9707"
    },
    {
      name: "Pagayawan",
      zipcode: "9316"
    },
    {
      name: "Piagapo",
      zipcode: "9703"
    },
    {
      name: "Poona Bayabao",
      zipcode: "9704"
    },
    {
      name: "Pualas",
      zipcode: "9319"
    },
    {
      name: "Saguiaran",
      zipcode: "9710"
    },
    {
      name: "Sultan Dumalondong",
      zipcode: "9322"
    },
    {
      name: "Taraka",
      zipcode: "9712"
    },
    {
      name: "Tubaran",
      zipcode: "9318"
    },
    {
      name: "Tugaya",
      zipcode: "9317"
    },
    {
      name: "Wao",
      zipcode: "9716"
    }
    ]
  },
  {
    name: "MAGUINDANAO DEL NORTE",
    municipalities: [
    {
      name: "Barira",
      zipcode: "9614"
    },
    {
      name: "Buldon",
      zipcode: "9615"
    },
    {
      name: "Datu Blah T. Sinsuat",
      zipcode: "9613"
    },
    {
      name: "Datu Odin Sinsuat",
      zipcode: "9601"
    },
    {
      name: "Kabuntalan",
      zipcode: "9606"
    },
    {
      name: "Matanog",
      zipcode: "9612"
    },
    {
      name: "Parang",
      zipcode: "9604"
    },
    {
      name: "Sultan Kudarat",
      zipcode: "9605"
    },
    {
      name: "Sultan Mastura",
      zipcode: "9603"
    },
    {
      name: "Upi",
      zipcode: "9602"
    }
    ]
  },
  {
    name: "MAGUINDANAO DEL SUR",
    municipalities: [
    {
      name: "Ampatuan",
      zipcode: "9609"
    },
    {
      name: "Buluan",
      zipcode: "9610"
    },
    {
      name: "Datu Abdullah Sangki",
      zipcode: "9611"
    },
    {
      name: "Datu Paglas",
      zipcode: "9622"
    },
    {
      name: "Datu Piang",
      zipcode: "9607"
    },
    {
      name: "Datu Saudi-Ampatuan",
      zipcode: "9618"
    },
    {
      name: "Datu Unsay",
      zipcode: "9619"
    },
    {
      name: "General Salipada K. Pendatun",
      zipcode: "9616"
    },
    {
      name: "Guindulungan",
      zipcode: "9617"
    },
    {
      name: "Mamasapano",
      zipcode: "9615"
    },
    {
      name: "Pagalungan",
      zipcode: "9612"
    },
    {
      name: "Paglat",
      zipcode: "9621"
    },
    {
      name: "Pandag",
      zipcode: "9620"
    },
    {
      name: "Rajah Buayan",
      zipcode: "9608"
    },
    {
      name: "Shariff Aguak",
      zipcode: "9608"
    },
    {
      name: "South Upi",
      zipcode: "9609"
    },
    {
      name: "Sultan sa Barongis",
      zipcode: "9610"
    },
    {
      name: "Talayan",
      zipcode: "9614"
    }
    ]
  },
  {
    name: "SULU",
    municipalities: [
    {
      name: "Banguingui",
      zipcode: "7402"
    },
    {
      name: "Hadji Panglima Tahil",
      zipcode: "7401"
    },
    {
      name: "Indanan",
      zipcode: "7407"
    },
    {
      name: "Jolo",
      zipcode: "7400"
    },
    {
      name: "Kalingalan Caluang",
      zipcode: "7416"
    },
    {
      name: "Lugus",
      zipcode: "7409"
    },
    {
      name: "Luuk",
      zipcode: "7410"
    },
    {
      name: "Maimbung",
      zipcode: "7408"
    },
    {
      name: "Old Panamao",
      zipcode: "7415"
    },
    {
      name: "Omar",
      zipcode: "7417"
    },
    {
      name: "Pandami",
      zipcode: "7411"
    },
    {
      name: "Panglima Estino",
      zipcode: "7414"
    },
    {
      name: "Pangutaran",
      zipcode: "7402"
    },
    {
      name: "Parang",
      zipcode: "7404"
    },
    {
      name: "Pata",
      zipcode: "7412"
    },
    {
      name: "Patikul",
      zipcode: "7409"
    },
    {
      name: "Siasi",
      zipcode: "7413"
    },
    {
      name: "Talipao",
      zipcode: "7405"
    },
    {
      name: "Tapul",
      zipcode: "7403"
    },
    {
      name: "Tongkil",
      zipcode: "7406"
    }
    ]
  },
  {
    name: "TAWI-TAWI",
    municipalities: [
    {
      name: "Bongao",
      zipcode: "7500"
    },
    {
      name: "Languyan",
      zipcode: "7509"
    },
    {
      name: "Mapun",
      zipcode: "7508"
    },
    {
      name: "Panglima Sugala",
      zipcode: "7501"
    },
    {
      name: "Sapa-Sapa",
      zipcode: "7502"
    },
    {
      name: "Sibutu",
      zipcode: "7510"
    },
    {
      name: "Simunul",
      zipcode: "7503"
    },
    {
      name: "Sitangkai",
      zipcode: "7504"
    },
    {
      name: "South Ubian",
      zipcode: "7505"
    },
    {
      name: "Tandubas",
      zipcode: "7506"
    },
    {
      name: "Turtle Islands",
      zipcode: "7507"
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