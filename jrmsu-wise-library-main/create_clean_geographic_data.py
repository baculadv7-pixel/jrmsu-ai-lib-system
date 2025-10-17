#!/usr/bin/env python3
"""
Clean Geographic Data Generator
Creates clean TypeScript data files with proper Region -> Province -> Municipality mapping
Removes barangay dropdown functionality for manual input
"""

import json
import csv
from pathlib import Path
from typing import Dict, List, Set

def load_csv_data(csv_path: str) -> List[Dict[str, str]]:
    """Load the merged geographic CSV data"""
    data = []
    with open(csv_path, 'r', encoding='utf-8-sig') as f:  # Handle BOM
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    return data

def normalize_region_name(region_name: str) -> str:
    """Normalize region names to handle duplicates and inconsistencies"""
    region_name = region_name.strip()
    
    # Handle different dash characters and normalize
    region_name = region_name.replace('–', '-').replace('—', '-')
    
    # Map all region variations to standardized canonical names
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
    
    return region_mapping.get(region_name, region_name)

def create_clean_structure(csv_data: List[Dict[str, str]]) -> Dict:
    """Create clean hierarchical structure: Region -> Province -> Municipality with ZIP codes"""
    structure = {}
    
    for row in csv_data:
        region = normalize_region_name(row['region'])
        province = row['province'].strip()
        municipality = row['municipality_city'].strip()
        zipcode = row['zipcode'].strip()
        
        # Skip if any required field is empty
        if not region or not province or not municipality:
            continue
            
        # Initialize region if not exists
        if region not in structure:
            structure[region] = {}
            
        # Initialize province if not exists
        if province not in structure[region]:
            structure[region][province] = {}
            
        # Add municipality with zipcode (prefer non-empty zipcodes)
        if municipality not in structure[region][province]:
            structure[region][province][municipality] = zipcode
        elif zipcode and not structure[region][province][municipality]:
            # Update with zipcode if we didn't have one before
            structure[region][province][municipality] = zipcode
    
    return structure

def generate_typescript_data(structure: Dict) -> str:
    """Generate TypeScript data file content"""
    
    ts_content = '''// Clean Philippine Geographic Data
// Generated for library system registration
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
'''
    
    # Generate the regions array
    regions = []
    for region_name, provinces in structure.items():
        province_list = []
        for province_name, municipalities in provinces.items():
            municipality_list = []
            for muni_name, zipcode in municipalities.items():
                municipality_list.append(f'''    {{
      name: "{muni_name}",
      zipcode: "{zipcode}"
    }}''')
            
            province_entry = f'''  {{
    name: "{province_name}",
    municipalities: [
{',\n'.join(municipality_list)}
    ]
  }}'''
            province_list.append(province_entry)
        
        region_entry = f'''{{
  name: "{region_name}",
  provinces: [
{',\n'.join(province_list)}
  ]
}}'''
        regions.append(region_entry)
    
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
    """Main function to generate clean geographic data"""
    base_path = Path(".")
    csv_path = base_path / "data" / "geography" / "merged_phil_geo.csv"
    
    print("Loading CSV data...")
    csv_data = load_csv_data(str(csv_path))
    print(f"Loaded {len(csv_data)} records from CSV")
    
    print("Creating clean structure...")
    structure = create_clean_structure(csv_data)
    
    # Print statistics
    total_regions = len(structure)
    total_provinces = sum(len(provinces) for provinces in structure.values())
    total_municipalities = sum(
        len(municipalities) 
        for provinces in structure.values() 
        for municipalities in provinces.values()
    )
    
    print(f"Clean structure created:")
    print(f"- Regions: {total_regions}")
    print(f"- Provinces: {total_provinces}")  
    print(f"- Municipalities: {total_municipalities}")
    
    print("Generating TypeScript file...")
    ts_content = generate_typescript_data(structure)
    
    # Write the clean TypeScript file
    output_path = base_path / "src" / "data" / "philippines-geography.ts"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    
    print(f"Clean TypeScript data file created: {output_path}")
    
    # Create summary statistics
    print("\\n=== Geographic Data Summary ===")
    for region_name, provinces in sorted(structure.items()):
        province_count = len(provinces)
        municipality_count = sum(len(munis) for munis in provinces.values())
        print(f"{region_name}: {province_count} provinces, {municipality_count} municipalities")

if __name__ == "__main__":
    main()