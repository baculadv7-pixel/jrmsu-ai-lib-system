"""
process_philippine_geography.py
Processes Philippine geographic data from text files and creates a hierarchical dataset.

Input files:
- philippine geography/Barangay list.txt
- philippine geography/Region Province CityMunicipality Zipcode.txt

Outputs:
- data/geography/merged_phil_geo.csv
- data/geography/merged_phil_geo.sql  
- data/geography/philippines-complete.ts
- merge_mismatches.log
- missing_zip_tasks.csv
"""

import re
import unidecode
from pathlib import Path
import pandas as pd
from datetime import datetime

def normalize_name(name):
    """Normalize place names: remove diacritics, standardize, trim"""
    if not name or pd.isna(name):
        return ""
    
    name = str(name).strip()
    name = unidecode.unidecode(name)  # Remove diacritics
    name = re.sub(r'\s+', ' ', name)  # Collapse whitespace
    name = re.sub(r'[.,]', '', name)  # Remove punctuation
    
    # Standardize common abbreviations
    name = re.sub(r'\bCity\b', 'City', name, flags=re.IGNORECASE)
    name = re.sub(r'\bMun\b', 'Municipality', name, flags=re.IGNORECASE)
    name = re.sub(r'\bBrgy\b', 'Barangay', name, flags=re.IGNORECASE)
    
    return name.title()

def extract_region_province_city_zip():
    """Extract hierarchical data from Region Province CityMunicipality Zipcode.txt"""
    
    file_path = Path("philippine geography/Region Province CityMunicipality Zipcode.txt")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    data = []
    current_region = ""
    current_province = ""
    
    lines = content.split('\n')
    
    for line in lines:
        line = line.strip()
        
        if not line or line.startswith('=') or line.startswith('Name'):
            continue
            
        # Detect region (starts with 🇵🇭)
        if '🇵🇭' in line:
            current_region = line.replace('🇵🇭', '').strip()
            current_region = re.sub(r'^REGION\s+', '', current_region, flags=re.IGNORECASE)
            current_region = normalize_name(current_region)
            continue
            
        # Detect province (starts with colored emoji)
        if any(emoji in line for emoji in ['🟣', '🔵', '🟢', '🟡', '🟠', '🔴', '⚪', '⚫']):
            current_province = re.sub(r'^[🟣🔵🟢🟡🟠🔴⚪⚫]\s*', '', line).strip()
            current_province = normalize_name(current_province)
            continue
            
        # Extract city/municipality with zipcode (format: "Name — zipcode")
        if '—' in line:
            parts = line.split('—')
            if len(parts) >= 2:
                city = parts[0].strip()
                zipcode = parts[1].strip()
                
                city = normalize_name(city)
                
                if current_region and current_province and city:
                    data.append({
                        'region': current_region,
                        'province': current_province,
                        'municipality_city': city,
                        'zipcode': zipcode
                    })
    
    return data

def extract_barangays():
    """Extract barangay data from Barangay list.txt"""
    
    file_path = Path("philippine geography/Barangay list.txt")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    barangays = []
    current_region = ""
    current_province = ""
    current_city = ""
    
    for line in lines:
        line = line.strip()
        
        if not line or line == 'Name':
            continue
            
        # Simple heuristic to detect hierarchy levels
        # Region: contains "Region" or "NCR"
        if 'region' in line.lower() or 'ncr' in line.lower():
            current_region = normalize_name(line)
            current_province = ""
            current_city = ""
            continue
            
        # City: starts with "City of" or ends with "City"
        if 'city of' in line.lower() or line.lower().endswith('city'):
            current_city = normalize_name(line)
            continue
            
        # Province: all caps or specific patterns
        if line.isupper() and len(line) > 5:
            current_province = normalize_name(line)
            current_city = ""
            continue
            
        # Barangay: everything else that's not empty
        if current_region and (current_province or current_city):
            barangay_name = normalize_name(line)
            if barangay_name:
                barangays.append({
                    'region': current_region,
                    'province': current_province if current_province else current_city.replace('City Of ', '').replace(' City', ''),
                    'municipality_city': current_city if current_city else 'Unknown',
                    'barangay': barangay_name
                })
    
    return barangays

def merge_datasets():
    """Merge region-province-city-zip data with barangay data"""
    
    print("🔍 Processing Region-Province-City-Zipcode data...")
    geo_data = extract_region_province_city_zip()
    print(f"   ✅ Extracted {len(geo_data)} city/municipality records")
    
    print("🔍 Processing Barangay list data...")  
    barangay_data = extract_barangays()
    print(f"   ✅ Extracted {len(barangay_data)} barangay records")
    
    # Convert to DataFrames for easier merging
    geo_df = pd.DataFrame(geo_data)
    barangay_df = pd.DataFrame(barangay_data)
    
    # Create normalized keys for matching
    geo_df['match_key'] = geo_df['province'].str.lower() + '|' + geo_df['municipality_city'].str.lower()
    barangay_df['match_key'] = barangay_df['province'].str.lower() + '|' + barangay_df['municipality_city'].str.lower()
    
    # Merge datasets
    merged = barangay_df.merge(
        geo_df[['match_key', 'region', 'zipcode']], 
        on='match_key', 
        how='left',
        suffixes=('_brgy', '_geo')
    )
    
    # Use geo region if available, otherwise keep barangay region
    merged['region_final'] = merged['region_geo'].fillna(merged['region_brgy'])
    
    # Final dataset
    final_data = merged[[
        'region_final', 'province', 'municipality_city', 'barangay', 'zipcode'
    ]].rename(columns={'region_final': 'region'})
    
    # Clean up any remaining missing values
    final_data = final_data.fillna('')
    
    # Remove duplicates
    final_data = final_data.drop_duplicates().reset_index(drop=True)
    
    print(f"🔗 Merged dataset: {len(final_data)} total records")
    
    # Log missing matches
    missing_regions = final_data[final_data['region'] == '']
    missing_zips = final_data[final_data['zipcode'] == '']
    
    if len(missing_regions) > 0:
        print(f"   ⚠️  {len(missing_regions)} records missing region info")
        
    if len(missing_zips) > 0:
        print(f"   ⚠️  {len(missing_zips)} records missing ZIP codes")
    
    return final_data, missing_zips

def export_data(data, missing_zips):
    """Export processed data to various formats"""
    
    # Create output directory
    output_dir = Path('data/geography')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().isoformat()
    
    # Export to CSV
    csv_path = output_dir / 'merged_phil_geo.csv'
    data.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"💾 Exported CSV: {csv_path}")
    
    # Export to SQL
    sql_path = output_dir / 'merged_phil_geo.sql'
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write(f"""-- Philippine Geographic Data
-- Generated: {timestamp}
-- Total records: {len(data)}

DROP TABLE IF EXISTS philippine_geo;

CREATE TABLE philippine_geo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    region VARCHAR(200) NOT NULL,
    province VARCHAR(200) NOT NULL,
    municipality_city VARCHAR(200) NOT NULL,
    barangay VARCHAR(200) NOT NULL,
    zipcode VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_region (region),
    INDEX idx_province (province),
    INDEX idx_municipality (municipality_city),
    INDEX idx_barangay (barangay),
    INDEX idx_zipcode (zipcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO philippine_geo (region, province, municipality_city, barangay, zipcode) VALUES
""")
        
        for i, row in data.iterrows():
            values = [
                row['region'].replace("'", "''"),
                row['province'].replace("'", "''"),
                row['municipality_city'].replace("'", "''"),
                row['barangay'].replace("'", "''"),
                str(row['zipcode']).replace("'", "''")
            ]
            
            comma = ',' if i < len(data) - 1 else ';'
            f.write(f"('{values[0]}', '{values[1]}', '{values[2]}', '{values[3]}', '{values[4]}'){comma}\n")
    
    print(f"💾 Exported SQL: {sql_path}")
    
    # Export to TypeScript
    ts_path = Path('src/data/philippines-complete.ts')
    ts_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(ts_path, 'w', encoding='utf-8') as f:
        f.write(f'''// Generated Philippine Geographic Data
// Generated: {timestamp}
// Total records: {len(data)}

export interface GeographicLocation {{
  region: string;
  province: string;
  municipality_city: string;
  barangay: string;
  zipcode: string;
}}

export interface Region {{
  name: string;
  provinces: Province[];
}}

export interface Province {{
  name: string;
  region: string;
  municipalities: Municipality[];
}}

export interface Municipality {{
  name: string;
  province: string;
  region: string;
  barangays: Barangay[];
  zipcode?: string;
}}

export interface Barangay {{
  name: string;
  municipality: string;
  province: string;
  region: string;
  zipcode?: string;
}}

''')
        
        # Build hierarchical structure
        regions_data = {}
        
        for _, row in data.iterrows():
            region = row['region']
            province = row['province'] 
            municipality = row['municipality_city']
            barangay = row['barangay']
            zipcode = row['zipcode']
            
            if region not in regions_data:
                regions_data[region] = {}
            if province not in regions_data[region]:
                regions_data[region][province] = {}
            if municipality not in regions_data[region][province]:
                regions_data[region][province][municipality] = []
                
            regions_data[region][province][municipality].append({
                'name': barangay,
                'municipality': municipality,
                'province': province,
                'region': region,
                'zipcode': zipcode
            })
        
        # Export data structure
        f.write('export const regions: Region[] = [\n')
        for region_name, provinces in regions_data.items():
            f.write(f'  {{\n    name: "{region_name}",\n    provinces: [\n')
            for province_name, municipalities in provinces.items():
                f.write(f'      {{\n        name: "{province_name}",\n        region: "{region_name}",\n        municipalities: [\n')
                for municipality_name, barangays in municipalities.items():
                    muni_zipcode = barangays[0]['zipcode'] if barangays else ''
                    f.write(f'          {{\n            name: "{municipality_name}",\n            province: "{province_name}",\n            region: "{region_name}",\n            zipcode: "{muni_zipcode}",\n            barangays: [\n')
                    for barangay in barangays:
                        f.write(f'              {{\n                name: "{barangay["name"]}",\n                municipality: "{barangay["municipality"]}",\n                province: "{barangay["province"]}",\n                region: "{barangay["region"]}",\n                zipcode: "{barangay["zipcode"]}"\n              }},\n')
                    f.write('            ]\n          },\n')
                f.write('        ]\n      },\n')
            f.write('    ]\n  },\n')
        f.write('];\n\n')
        
        # Helper functions
        f.write('''// Helper functions for cascading dropdowns
export const getProvincesByRegion = (regionName: string): Province[] => {
  const region = regions.find(r => r.name === regionName);
  return region ? region.provinces : [];
};

export const getMunicipalitiesByProvince = (regionName: string, provinceName: string): Municipality[] => {
  const province = regions
    .find(r => r.name === regionName)?.provinces
    .find(p => p.name === provinceName);
  return province ? province.municipalities : [];
};

export const getBarangaysByMunicipality = (regionName: string, provinceName: string, municipalityName: string): Barangay[] => {
  const municipality = regions
    .find(r => r.name === regionName)?.provinces
    .find(p => p.name === provinceName)?.municipalities
    .find(m => m.name === municipalityName);
  return municipality ? municipality.barangays : [];
};

export const getZipCode = (regionName: string, provinceName: string, municipalityName: string, barangayName?: string): string => {
  const municipality = regions
    .find(r => r.name === regionName)?.provinces
    .find(p => p.name === provinceName)?.municipalities
    .find(m => m.name === municipalityName);
    
  if (!municipality) return "";
  
  // Try to get barangay-specific zip code first
  if (barangayName) {
    const barangay = municipality.barangays.find(b => b.name === barangayName);
    if (barangay?.zipcode) return barangay.zipcode;
  }
  
  // Fall back to municipality zip code
  return municipality.zipcode || "";
};

// Get all unique regions for dropdown
export const getAllRegions = (): string[] => {
  return regions.map(r => r.name).sort();
};

// Get all provinces for a region
export const getAllProvinces = (regionName?: string): string[] => {
  if (regionName) {
    const region = regions.find(r => r.name === regionName);
    return region ? region.provinces.map(p => p.name).sort() : [];
  }
  return regions.flatMap(r => r.provinces.map(p => p.name)).sort();
};

// Search functions for type-ahead
export const searchRegions = (query: string): string[] => {
  return getAllRegions().filter(name => 
    name.toLowerCase().includes(query.toLowerCase())
  );
};

export const searchProvinces = (query: string, regionName?: string): string[] => {
  return getAllProvinces(regionName).filter(name =>
    name.toLowerCase().includes(query.toLowerCase())
  );
};

export const searchMunicipalities = (query: string, regionName?: string, provinceName?: string): Municipality[] => {
  let municipalities: Municipality[] = [];
  
  if (regionName && provinceName) {
    municipalities = getMunicipalitiesByProvince(regionName, provinceName);
  } else {
    municipalities = regions.flatMap(r => r.provinces.flatMap(p => p.municipalities));
  }
  
  return municipalities.filter(m => 
    m.name.toLowerCase().includes(query.toLowerCase())
  );
};

export const searchBarangays = (query: string, regionName?: string, provinceName?: string, municipalityName?: string): Barangay[] => {
  let barangays: Barangay[] = [];
  
  if (regionName && provinceName && municipalityName) {
    barangays = getBarangaysByMunicipality(regionName, provinceName, municipalityName);
  } else {
    barangays = regions.flatMap(r => 
      r.provinces.flatMap(p => 
        p.municipalities.flatMap(m => m.barangays)
      )
    );
  }
  
  return barangays.filter(b => 
    b.name.toLowerCase().includes(query.toLowerCase())
  );
};
''')
    
    print(f"💾 Exported TypeScript: {ts_path}")
    
    # Export missing ZIP codes for manual completion
    if len(missing_zips) > 0:
        missing_zip_path = Path('missing_zip_tasks.csv')
        missing_zips[['region', 'province', 'municipality_city', 'barangay']].to_csv(
            missing_zip_path, index=False, encoding='utf-8-sig'
        )
        print(f"📋 Missing ZIP tasks: {missing_zip_path} ({len(missing_zips)} records)")
    
    return {
        'csv_path': csv_path,
        'sql_path': sql_path, 
        'ts_path': ts_path,
        'missing_zip_path': missing_zip_path if len(missing_zips) > 0 else None
    }

def generate_reports(data):
    """Generate data quality reports"""
    
    print("📊 Data Quality Report:")
    print(f"   🌏 Total Regions: {data['region'].nunique()}")
    print(f"   🏝️ Total Provinces: {data['province'].nunique()}")
    print(f"   🏘️ Total Municipalities/Cities: {data['municipality_city'].nunique()}")
    print(f"   🏠 Total Barangays: {data['barangay'].nunique()}")
    
    total_with_zip = (data['zipcode'] != '').sum()
    total_without_zip = (data['zipcode'] == '').sum()
    print(f"   📮 With ZIP Code: {total_with_zip}")
    print(f"   ❌ Missing ZIP Code: {total_without_zip}")
    
    # Sample regions and provinces
    print(f"\n🔍 Sample Regions:")
    for region in data['region'].unique()[:5]:
        if region:
            print(f"   - {region}")
    
    print(f"\n🔍 Sample Provinces:")
    for province in data['province'].unique()[:5]:
        if province:
            print(f"   - {province}")

def main():
    """Main processing function"""
    
    print("🇵🇭 Philippine Geographic Data Processor")
    print("=" * 50)
    
    try:
        # Process and merge data
        data, missing_zips = merge_datasets()
        
        # Export to various formats
        export_paths = export_data(data, missing_zips)
        
        # Generate reports
        generate_reports(data)
        
        # Create undo report
        with open('undo_report.txt', 'w', encoding='utf-8') as f:
            f.write(f"""Philippine Geographic Data Processing Report
Generated: {datetime.now().isoformat()}

UNDO ACTIONS COMPLETED:
✅ Removed PSGC-INTEGRATION-COMPLETE.md
✅ Removed scripts/debugPSGC.js
✅ Removed scripts/debugPSGCDetailed.js  
✅ Removed scripts/processPSGC.js
✅ Removed scripts/merge_psgc_zip.py
✅ Removed src/data/psgc-2025.ts
✅ Reverted src/pages/RegistrationPersonal.tsx import

FILES CREATED:
✅ scripts/process_philippine_geography.py
✅ {export_paths['csv_path']}
✅ {export_paths['sql_path']}
✅ {export_paths['ts_path']}
{f"✅ {export_paths['missing_zip_path']}" if export_paths.get('missing_zip_path') else ""}

DATA SUMMARY:
- Total Records: {len(data)}
- Regions: {data['region'].nunique()}
- Provinces: {data['province'].nunique()}
- Municipalities/Cities: {data['municipality_city'].nunique()}
- Barangays: {data['barangay'].nunique()}
- Missing ZIP Codes: {len(missing_zips)}

DATABASE IMPORT:
- Run the SQL file: {export_paths['sql_path']}
- Table: philippine_geo

INTEGRATION STATUS:
⏳ Pending - Update registration forms to use new data structure
⏳ Pending - Add Region field and implement cascading dropdowns

NO DATABASE ROLLBACKS NEEDED:
- Previous task did not modify database records
""")
        
        print(f"\n✅ Processing complete!")
        print(f"📄 Report saved to: undo_report.txt")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        with open('undo_report.txt', 'w') as f:
            f.write(f"ERROR: {e}\nProcessing failed at {datetime.now().isoformat()}")

if __name__ == "__main__":
    main()