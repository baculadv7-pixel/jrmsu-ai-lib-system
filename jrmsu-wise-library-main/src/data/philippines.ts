// Philippine Geographic Data (2025)
export interface Barangay {
  name: string;
  code: string;
}

export interface Municipality {
  name: string;
  code: string;
  barangays: Barangay[];
}

export interface Province {
  name: string;
  code: string;
  municipalities: Municipality[];
}

// Provinces of the Philippines (82 provinces as of 2025)
export const provinces: Province[] = [
  {
    name: "Abra",
    code: "ABR",
    municipalities: [
      {
        name: "Bangued",
        code: "140101",
        barangays: [
          { name: "Agtangao", code: "140101001" },
          { name: "Angad", code: "140101002" },
          { name: "Bangued", code: "140101003" },
          { name: "Calaba", code: "140101004" },
          { name: "Cosili East", code: "140101005" },
          { name: "Cosili West", code: "140101006" },
        ]
      },
      {
        name: "Boliney",
        code: "140102",
        barangays: [
          { name: "Amti", code: "140102001" },
          { name: "Baac", code: "140102002" },
          { name: "Dao-angan", code: "140102003" },
        ]
      },
      {
        name: "Bucay",
        code: "140103",
        barangays: [
          { name: "Bangbangcar", code: "140103001" },
          { name: "Bangkileng", code: "140103002" },
          { name: "Bucay", code: "140103003" },
        ]
      }
    ]
  },
  {
    name: "Agusan del Norte",
    code: "AGN",
    municipalities: [
      {
        name: "Butuan City",
        code: "160201",
        barangays: [
          { name: "Ambago", code: "160201001" },
          { name: "Amparo", code: "160201002" },
          { name: "Anticala", code: "160201003" },
          { name: "Baan KM 3", code: "160201004" },
          { name: "Bancasi", code: "160201005" },
        ]
      },
      {
        name: "Buenavista",
        code: "160202",
        barangays: [
          { name: "Awa", code: "160202001" },
          { name: "Bading", code: "160202002" },
          { name: "Bugac", code: "160202003" },
        ]
      },
      {
        name: "Carmen",
        code: "160203",
        barangays: [
          { name: "Baan", code: "160203001" },
          { name: "Gosoon", code: "160203002" },
          { name: "Imbatug", code: "160203003" },
        ]
      }
    ]
  },
  {
    name: "Aklan",
    code: "AKL",
    municipalities: [
      {
        name: "Kalibo",
        code: "060401",
        barangays: [
          { name: "Andagao", code: "060401001" },
          { name: "Bachaw Norte", code: "060401002" },
          { name: "Bachaw Sur", code: "060401003" },
          { name: "Buswang", code: "060401004" },
          { name: "Calizo", code: "060401005" },
        ]
      },
      {
        name: "Malay",
        code: "060402",
        barangays: [
          { name: "Argao", code: "060402001" },
          { name: "Bagongbayan", code: "060402002" },
          { name: "Balabag", code: "060402003" },
          { name: "Balete", code: "060402004" },
          { name: "Buruanga", code: "060402005" },
        ]
      }
    ]
  },
  {
    name: "Albay",
    code: "ALB",
    municipalities: [
      {
        name: "Legazpi City",
        code: "050501",
        barangays: [
          { name: "Bagumbayan", code: "050501001" },
          { name: "Banquerohan", code: "050501002" },
          { name: "Bitano", code: "050501003" },
          { name: "Bonot", code: "050501004" },
          { name: "Buyuan", code: "050501005" },
        ]
      },
      {
        name: "Daraga",
        code: "050502",
        barangays: [
          { name: "Bagumbayan", code: "050502001" },
          { name: "Bascaran", code: "050502002" },
          { name: "Budiao", code: "050502003" },
        ]
      }
    ]
  },
  {
    name: "Antique",
    code: "ANT",
    municipalities: [
      {
        name: "San Jose de Buenavista",
        code: "060601",
        barangays: [
          { name: "Asluman", code: "060601001" },
          { name: "Botbot", code: "060601002" },
          { name: "Buenavista", code: "060601003" },
        ]
      }
    ]
  },
  // Adding key provinces for demonstration - in production, all 82 provinces would be included
  {
    name: "Bataan",
    code: "BTN",
    municipalities: [
      {
        name: "Balanga City",
        code: "030701",
        barangays: [
          { name: "Bagong Silang", code: "030701001" },
          { name: "Bagumbayan", code: "030701002" },
          { name: "Cabog-Cabog", code: "030701003" },
        ]
      }
    ]
  },
  {
    name: "Batangas",
    code: "BTG",
    municipalities: [
      {
        name: "Batangas City",
        code: "041001",
        barangays: [
          { name: "Alangilan", code: "041001001" },
          { name: "Balagtas", code: "041001002" },
          { name: "Balete", code: "041001003" },
        ]
      }
    ]
  },
  {
    name: "Benguet",
    code: "BEN",
    municipalities: [
      {
        name: "Baguio City",
        code: "141101",
        barangays: [
          { name: "A. Bonifacio-Caguioa-Rimando", code: "141101001" },
          { name: "Abbott", code: "141101002" },
          { name: "Alfonso Tabora", code: "141101003" },
        ]
      }
    ]
  },
  {
    name: "Bohol",
    code: "BOH",
    municipalities: [
      {
        name: "Tagbilaran City",
        code: "071201",
        barangays: [
          { name: "Balamban", code: "071201001" },
          { name: "Bool", code: "071201002" },
          { name: "Booy", code: "071201003" },
        ]
      }
    ]
  },
  {
    name: "Bukidnon",
    code: "BUK",
    municipalities: [
      {
        name: "Malaybalay City",
        code: "101301",
        barangays: [
          { name: "Aglayan", code: "101301001" },
          { name: "Bangcud", code: "101301002" },
          { name: "Busdi", code: "101301003" },
        ]
      }
    ]
  },
  {
    name: "Bulacan",
    code: "BUL",
    municipalities: [
      {
        name: "Malolos City",
        code: "031401",
        barangays: [
          { name: "Anilao", code: "031401001" },
          { name: "Atlag", code: "031401002" },
          { name: "Babatnin", code: "031401003" },
        ]
      }
    ]
  },
  {
    name: "Cagayan",
    code: "CAG",
    municipalities: [
      {
        name: "Tuguegarao City",
        code: "021501",
        barangays: [
          { name: "Atulayan Norte", code: "021501001" },
          { name: "Atulayan Sur", code: "021501002" },
          { name: "Bagay", code: "021501003" },
        ]
      }
    ]
  },
  // Continue with more provinces... For demo purposes, including key ones
  {
    name: "Camarines Norte",
    code: "CNO",
    municipalities: [
      {
        name: "Daet",
        code: "051601",
        barangays: [
          { name: "Alawihao", code: "051601001" },
          { name: "Bagasbas", code: "051601002" },
          { name: "Barangay I", code: "051601003" },
        ]
      }
    ]
  },
  {
    name: "Camarines Sur",
    code: "CSU",
    municipalities: [
      {
        name: "Naga City",
        code: "051701",
        barangays: [
          { name: "Abella", code: "051701001" },
          { name: "Bagumbayan Norte", code: "051701002" },
          { name: "Bagumbayan Sur", code: "051701003" },
        ]
      }
    ]
  },
  {
    name: "Camiguin",
    code: "CAM",
    municipalities: [
      {
        name: "Mambajao",
        code: "101801",
        barangays: [
          { name: "Agoho", code: "101801001" },
          { name: "Anito", code: "101801002" },
          { name: "Baylao", code: "101801003" },
        ]
      }
    ]
  },
  {
    name: "Capiz",
    code: "CAP",
    municipalities: [
      {
        name: "Roxas City",
        code: "061901",
        barangays: [
          { name: "Adlawan", code: "061901001" },
          { name: "Balijuagan", code: "061901002" },
          { name: "Baybay", code: "061901003" },
        ]
      }
    ]
  },
  {
    name: "Catanduanes",
    code: "CAT",
    municipalities: [
      {
        name: "Virac",
        code: "052001",
        barangays: [
          { name: "Bagamanoc", code: "052001001" },
          { name: "Balite", code: "052001002" },
          { name: "Bato", code: "052001003" },
        ]
      }
    ]
  },
  {
    name: "Cavite",
    code: "CAV",
    municipalities: [
      {
        name: "Bacoor City",
        code: "042101",
        barangays: [
          { name: "Alima", code: "042101001" },
          { name: "Aniban I", code: "042101002" },
          { name: "Aniban II", code: "042101003" },
        ]
      }
    ]
  },
  {
    name: "Cebu",
    code: "CEB",
    municipalities: [
      {
        name: "Cebu City",
        code: "072201",
        barangays: [
          { name: "Adlaon", code: "072201001" },
          { name: "Agsungot", code: "072201002" },
          { name: "Apas", code: "072201003" },
        ]
      }
    ]
  },
  // Metro Manila Provinces
  {
    name: "Manila",
    code: "MNL",
    municipalities: [
      {
        name: "Manila",
        code: "133901",
        barangays: [
          { name: "Barangay 1", code: "133901001" },
          { name: "Barangay 2", code: "133901002" },
          { name: "Barangay 3", code: "133901003" },
        ]
      }
    ]
  },
  {
    name: "Quezon City",
    code: "QZN",
    municipalities: [
      {
        name: "Quezon City",
        code: "137404",
        barangays: [
          { name: "Alicia", code: "137404001" },
          { name: "Amihan", code: "137404002" },
          { name: "Apolonio Samson", code: "137404003" },
        ]
      }
    ]
  },
  // Additional provinces for completeness
  {
    name: "Rizal",
    code: "RIZ",
    municipalities: [
      {
        name: "Antipolo City",
        code: "045801",
        barangays: [
          { name: "Bagong Nayon", code: "045801001" },
          { name: "Beverly Hills", code: "045801002" },
          { name: "Calawis", code: "045801003" },
        ]
      }
    ]
  },
  {
    name: "Laguna",
    code: "LAG",
    municipalities: [
      {
        name: "Santa Rosa City",
        code: "043404",
        barangays: [
          { name: "Aplaya", code: "043404001" },
          { name: "Balibago", code: "043404002" },
          { name: "Caingin", code: "043404003" },
        ]
      }
    ]
  }
];

// Helper functions
export const getProvinceByCode = (code: string): Province | undefined => {
  return provinces.find(p => p.code === code);
};

export const getMunicipalitiesByProvince = (provinceCode: string): Municipality[] => {
  const province = getProvinceByCode(provinceCode);
  return province?.municipalities || [];
};

export const getBarangaysByMunicipality = (provinceCode: string, municipalityCode: string): Barangay[] => {
  const municipalities = getMunicipalitiesByProvince(provinceCode);
  const municipality = municipalities.find(m => m.code === municipalityCode);
  return municipality?.barangays || [];
};