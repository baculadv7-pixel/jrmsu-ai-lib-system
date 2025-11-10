#!/usr/bin/env python3
"""
Create standardized regions TypeScript file
Only includes the 17 official regions with exact naming as specified
"""

import csv
from pathlib import Path
from typing import Dict, List, Set

# The 17 official regions with exact naming
STANDARD_REGIONS = [
    "Region I – Ilocos Region",
    "Region II – Cagayan Valley", 
    "Region III – Central Luzon",
    "Region IV-A – CALABARZON (Cavite, Laguna, Batangas, Rizal, Quezon)",
    "Region IV-B – MIMAROPA (Mindoro, Marinduque, Romblon, Palawan)",
    "Region V – Bicol Region",
    "Region VI – Western Visayas",
    "Region VII – Central Visayas",
    "Region VIII – Eastern Visayas", 
    "Region IX – Zamboanga Peninsula",
    "Region X – Northern Mindanao",
    "Region XI – Davao Region",
    "Region XII – SOCCSKSARGEN (South Cotabato, Cotabato, Sultan Kudarat, Sarangani, General Santos)",
    "Region XIII – Caraga",
    "NCR – National Capital Region",
    "CAR – Cordillera Administrative Region",
    "BARMM – Bangsamoro Autonomous Region in Muslim Mindanao"
]

def normalize_region_to_standard(region_name: str) -> str:
    """Map all region variations to the 17 standard region names"""
    region_name = region_name.strip()
    
    # Handle different dash characters
    region_name = region_name.replace('–', '-').replace('—', '-')
    
    # Comprehensive mapping to standard names
    region_mapping = {
        # Region I variations
        'REGION I - ILOCOS REGION': 'Region I – Ilocos Region',
        'REGION I – ILOCOS REGION': 'Region I – Ilocos Region',
        'Region I (Ilocos Region)': 'Region I – Ilocos Region',
        'Ilocos Region (I)': 'Region I – Ilocos Region',
        
        # Region II variations
        'REGION II - CAGAYAN VALLEY': 'Region II – Cagayan Valley',
        'REGION II – CAGAYAN VALLEY': 'Region II – Cagayan Valley',
        'Region II (Cagayan Valley)': 'Region II – Cagayan Valley',
        'Cagayan Valley (II)': 'Region II – Cagayan Valley',
        
        # Region III variations
        'REGION III - CENTRAL LUZON': 'Region III – Central Luzon',
        'REGION III – CENTRAL LUZON': 'Region III – Central Luzon',
        'Region III (Central Luzon)': 'Region III – Central Luzon',
        'Central Luzon (III)': 'Region III – Central Luzon',
        
        # Region IV-A variations
        'REGION IV-A - CALABARZON': 'Region IV-A – CALABARZON (Cavite, Laguna, Batangas, Rizal, Quezon)',
        'REGION IV-A – CALABARZON': 'Region IV-A – CALABARZON (Cavite, Laguna, Batangas, Rizal, Quezon)',
        'Region IV-A (CALABARZON)': 'Region IV-A – CALABARZON (Cavite, Laguna, Batangas, Rizal, Quezon)',
        'CALABARZON (IV-A)': 'Region IV-A – CALABARZON (Cavite, Laguna, Batangas, Rizal, Quezon)',
        
        # Region IV-B variations
        'REGION IV-B - MIMAROPA REGION': 'Region IV-B – MIMAROPA (Mindoro, Marinduque, Romblon, Palawan)',
        'REGION IV-B – MIMAROPA REGION': 'Region IV-B – MIMAROPA (Mindoro, Marinduque, Romblon, Palawan)',
        'Region IV-B (MIMAROPA)': 'Region IV-B – MIMAROPA (Mindoro, Marinduque, Romblon, Palawan)',
        'MIMAROPA (IV-B)': 'Region IV-B – MIMAROPA (Mindoro, Marinduque, Romblon, Palawan)',
        
        # Region V variations
        'REGION V - BICOL REGION': 'Region V – Bicol Region',
        'REGION V – BICOL REGION': 'Region V – Bicol Region',
        'Region V (Bicol Region)': 'Region V – Bicol Region',
        'Bicol Region (V)': 'Region V – Bicol Region',
        
        # Region VI variations
        'REGION VI - WESTERN VISAYAS': 'Region VI – Western Visayas',
        'REGION VI – WESTERN VISAYAS': 'Region VI – Western Visayas',
        'Region VI (Western Visayas)': 'Region VI – Western Visayas',
        'Western Visayas (VI)': 'Region VI – Western Visayas',
        
        # Region VII variations
        'REGION VII - CENTRAL VISAYAS': 'Region VII – Central Visayas',
        'REGION VII – CENTRAL VISAYAS': 'Region VII – Central Visayas',
        'Region VII (Central Visayas)': 'Region VII – Central Visayas',
        'Central Visayas (VII)': 'Region VII – Central Visayas',
        
        # Region VIII variations
        'REGION VIII - EASTERN VISAYAS': 'Region VIII – Eastern Visayas',
        'REGION VIII – EASTERN VISAYAS': 'Region VIII – Eastern Visayas',
        'Region VIII (Eastern Visayas)': 'Region VIII – Eastern Visayas',
        'Eastern Visayas (VIII)': 'Region VIII – Eastern Visayas',
        
        # Region IX variations
        'REGION IX - ZAMBOANGA PENINSULA': 'Region IX – Zamboanga Peninsula',
        'REGION IX – ZAMBOANGA PENINSULA': 'Region IX – Zamboanga Peninsula',
        'Region IX (Zamboanga Peninsula)': 'Region IX – Zamboanga Peninsula',
        'Zamboanga Peninsula (IX)': 'Region IX – Zamboanga Peninsula',
        
        # Region X variations
        'REGION X - NORTHERN MINDANAO': 'Region X – Northern Mindanao',
        'REGION X – NORTHERN MINDANAO': 'Region X – Northern Mindanao',
        'Region X (Northern Mindanao)': 'Region X – Northern Mindanao',
        'Northern Mindanao (X)': 'Region X – Northern Mindanao',
        
        # Region XI variations
        'REGION XI - DAVAO REGION': 'Region XI – Davao Region',
        'REGION XI – DAVAO REGION': 'Region XI – Davao Region',
        'Region XI (Davao Region)': 'Region XI – Davao Region',
        'Davao Region (XI)': 'Region XI – Davao Region',
        
        # Region XII variations
        'REGION XII - SOCCSKSARGEN': 'Region XII – SOCCSKSARGEN (South Cotabato, Cotabato, Sultan Kudarat, Sarangani, General Santos)',
        'REGION XII – SOCCSKSARGEN': 'Region XII – SOCCSKSARGEN (South Cotabato, Cotabato, Sultan Kudarat, Sarangani, General Santos)',
        'Region XII (SOCCSKSARGEN)': 'Region XII – SOCCSKSARGEN (South Cotabato, Cotabato, Sultan Kudarat, Sarangani, General Santos)',
        'SOCCSKSARGEN (XII)': 'Region XII – SOCCSKSARGEN (South Cotabato, Cotabato, Sultan Kudarat, Sarangani, General Santos)',
        
        # Region XIII variations
        'REGION XIII - CARAGA': 'Region XIII – Caraga',
        'REGION XIII – CARAGA': 'Region XIII – Caraga',
        'Region XIII (Caraga)': 'Region XIII – Caraga',
        'Caraga (XIII)': 'Region XIII – Caraga',
        
        # NCR variations
        'National Capital Region (NCR)': 'NCR – National Capital Region',
        'Metro Manila': 'NCR – National Capital Region',
        'NCR': 'NCR – National Capital Region',
        
        # CAR variations
        'Cordillera Administrative Region (CAR)': 'CAR – Cordillera Administrative Region',
        'CAR': 'CAR – Cordillera Administrative Region',
        
        # BARMM variations
        'BARMM - Bangsamoro Autonomous Region in Muslim Mindanao': 'BARMM – Bangsamoro Autonomous Region in Muslim Mindanao',
        'BARMM – Bangsamoro Autonomous Region in Muslim Mindanao': 'BARMM – Bangsamoro Autonomous Region in Muslim Mindanao',
        'Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)': 'BARMM – Bangsamoro Autonomous Region in Muslim Mindanao',
        'BARMM (Bangsamoro Autonomous Region)': 'BARMM – Bangsamoro Autonomous Region in Muslim Mindanao',
    }
    
    return region_mapping.get(region_name, None)  # Return None if not found

def load_and_process_csv():
    """Load CSV and organize data by standard regions only"""
    csv_path = Path("data/geography/merged_phil_geo.csv")
    
    if not csv_path.exists():
        print(f"CSV file not found: {csv_path}")
        return {}
    
    structure = {}
    processed_count = 0
    skipped_count = 0
    
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            original_region = row['region'].strip()
            standard_region = normalize_region_to_standard(original_region)
            
            if standard_region is None:
                skipped_count += 1
                continue
                
            province = row['province'].strip()
            municipality = row['municipality_city'].strip()
            zipcode = row['zipcode'].strip()
            
            if not province or not municipality:
                skipped_count += 1
                continue
                
            # Initialize nested structure
            if standard_region not in structure:
                structure[standard_region] = {}
            if province not in structure[standard_region]:
                structure[standard_region][province] = {}
                
            # Add municipality with zipcode
            if municipality not in structure[standard_region][province]:
                structure[standard_region][province][municipality] = zipcode
            elif zipcode and not structure[standard_region][province][municipality]:
                structure[standard_region][province][municipality] = zipcode
                
            processed_count += 1
    
    print(f"Processed {processed_count} records, skipped {skipped_count} records")
    return structure

def generate_typescript_file(structure):
    """Generate the clean TypeScript file with standardized regions"""
    
    ts_content = f'''// Clean Philippine Geographic Data - Standardized Regions
// Generated for library system registration
// Contains only the 17 official Philippine regions with standardized naming
// Structure: Region -> Province -> Municipality with ZIP codes
// Note: Barangay is now a manual input field

export interface Municipality {{
  name: string;
  zipcode: string;
}}

export interface Province {{
  name: string;
  municipalities: Municipality[];
}}

export interface Region {{
  name: string;
  provinces: Province[];
}}

export const philippineGeography: Region[] = [
'''
    
    # Only process regions that are in our standard list
    regions = []
    for standard_region in STANDARD_REGIONS:
        if standard_region in structure:
            provinces = structure[standard_region]
            province_list = []
            
            for province_name, municipalities in provinces.items():
                municipality_list = []
                for muni_name, zipcode in municipalities.items():
                    municipality_list.append(f'''    {{
      name: "{muni_name}",
      zipcode: "{zipcode}"
    }}''')
                
                if municipality_list:  # Only add province if it has municipalities
                    province_entry = f'''  {{
    name: "{province_name}",
    municipalities: [
{',\n'.join(municipality_list)}
    ]
  }}'''
                    province_list.append(province_entry)
            
            if province_list:  # Only add region if it has provinces
                region_entry = f'''{{
  name: "{standard_region}",
  provinces: [
{',\n'.join(province_list)}
  ]
}}'''
                regions.append(region_entry)
        else:
            print(f"Warning: Standard region '{standard_region}' not found in data")
    
    ts_content += ',\n'.join(regions)
    ts_content += '''
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
'''
    
    return ts_content

def main():
    print("Creating standardized Philippine regions TypeScript file...")
    print(f"Standard regions to include: {len(STANDARD_REGIONS)}")
    
    # Load and process CSV data
    structure = load_and_process_csv()
    
    # Generate TypeScript content
    ts_content = generate_typescript_file(structure)
    
    # Write to file
    output_path = Path("src/data/philippines-geography.ts")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    
    print(f"\\nStandardized TypeScript file created: {output_path}")
    
    # Print summary
    total_regions = len([r for r in STANDARD_REGIONS if r in structure])
    total_provinces = sum(len(provinces) for region in STANDARD_REGIONS if region in structure for provinces in [structure[region]])
    total_municipalities = sum(
        len(municipalities) 
        for region in STANDARD_REGIONS 
        if region in structure
        for provinces in [structure[region]]
        for municipalities in provinces.values()
    )
    
    print(f"\\n=== Final Statistics ===")
    print(f"Regions included: {total_regions}/{len(STANDARD_REGIONS)}")
    print(f"Total provinces: {total_provinces}")
    print(f"Total municipalities: {total_municipalities}")
    
    # Show which regions were found
    print(f"\\n=== Regions Successfully Processed ===")
    for region in STANDARD_REGIONS:
        if region in structure:
            province_count = len(structure[region])
            muni_count = sum(len(munis) for munis in structure[region].values())
            print(f"✅ {region}: {province_count} provinces, {muni_count} municipalities")
        else:
            print(f"❌ {region}: No data found")

if __name__ == "__main__":
    main()