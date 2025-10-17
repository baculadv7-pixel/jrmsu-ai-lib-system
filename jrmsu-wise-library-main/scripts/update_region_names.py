"""
update_region_names.py
Updates region names in the geographic data to official standardized names.
"""

import pandas as pd
from pathlib import Path
import json
from datetime import datetime

# Official region name mappings
REGION_MAPPING = {
    # Current name variations -> Official standardized name
    "National Capital Region (Ncr)": "National Capital Region (NCR)",
    "National Capital Region": "National Capital Region (NCR)",
    "Cordillera Administrative Region (Car)": "Cordillera Administrative Region (CAR)",
    "Cordillera Administrative Region": "Cordillera Administrative Region (CAR)",
    "Region I (Ilocos Region)": "Ilocos Region (I)",
    "Ilocos Region": "Ilocos Region (I)",
    "Region Ii (Cagayan Valley)": "Cagayan Valley (II)",
    "Cagayan Valley": "Cagayan Valley (II)",
    "Region Iii (Central Luzon)": "Central Luzon (III)",
    "Central Luzon": "Central Luzon (III)",
    "Region Iv-A (Calabarzon)": "CALABARZON (IV-A)",
    "Calabarzon": "CALABARZON (IV-A)",
    "Mimaropa Region": "MIMAROPA (IV-B)",
    "Region V (Bicol Region)": "Bicol Region (V)",
    "Bicol Region": "Bicol Region (V)",
    "Region Vi (Western Visayas)": "Western Visayas (VI)",
    "Western Visayas": "Western Visayas (VI)",
    "Region Vii (Central Visayas)": "Central Visayas (VII)",
    "Central Visayas": "Central Visayas (VII)",
    "Region Viii (Eastern Visayas)": "Eastern Visayas (VIII)",
    "Eastern Visayas": "Eastern Visayas (VIII)",
    "Region Ix (Zamboanga Peninsula)": "Zamboanga Peninsula (IX)",
    "Zamboanga Peninsula": "Zamboanga Peninsula (IX)",
    "Region X (Northern Mindanao)": "Northern Mindanao (X)",
    "Northern Mindanao": "Northern Mindanao (X)",
    "Region Xi (Davao Region)": "Davao Region (XI)",
    "Davao Region": "Davao Region (XI)",
    "Region Xii (Soccsksargen)": "SOCCSKSARGEN (XII)",
    "Soccsksargen": "SOCCSKSARGEN (XII)",
    "Region Xiii (Caraga)": "Caraga (XIII)",
    "Caraga": "Caraga (XIII)",
    "Bangsamoro Autonomous Region In Muslim Mindanao (Barmm)": "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)"
}

def update_csv_regions():
    """Update region names in CSV file"""
    csv_path = Path('data/geography/merged_phil_geo.csv')
    
    if not csv_path.exists():
        print(f"❌ CSV file not found: {csv_path}")
        return
    
    print("📊 Updating CSV region names...")
    df = pd.read_csv(csv_path)
    
    # Show current regions
    print(f"Current regions: {df['region'].unique()[:10]}")
    
    # Update region names
    df['region'] = df['region'].map(REGION_MAPPING).fillna(df['region'])
    
    # Show updated regions
    print(f"Updated regions: {df['region'].unique()[:10]}")
    
    # Save updated CSV
    df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"✅ Updated CSV: {csv_path}")

def update_sql_regions():
    """Update region names in SQL file"""
    sql_path = Path('data/geography/merged_phil_geo.sql')
    
    if not sql_path.exists():
        print(f"❌ SQL file not found: {sql_path}")
        return
    
    print("📊 Updating SQL region names...")
    
    with open(sql_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace region names in SQL content
    for old_name, new_name in REGION_MAPPING.items():
        content = content.replace(f"'{old_name}'", f"'{new_name}'")
    
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Updated SQL: {sql_path}")

def update_typescript_regions():
    """Update region names in TypeScript file"""
    ts_path = Path('src/data/philippines-complete.ts')
    
    if not ts_path.exists():
        print(f"❌ TypeScript file not found: {ts_path}")
        return
    
    print("📊 Updating TypeScript region names...")
    
    with open(ts_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace region names in TypeScript content
    for old_name, new_name in REGION_MAPPING.items():
        content = content.replace(f'"{old_name}"', f'"{new_name}"')
        content = content.replace(f"'{old_name}'", f"'{new_name}'")
    
    with open(ts_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Updated TypeScript: {ts_path}")

def main():
    """Update all geographic data files with official region names"""
    
    print("🇵🇭 Updating to Official Philippine Region Names")
    print("=" * 50)
    
    print("📋 Official Region Name Mapping:")
    for old, new in list(REGION_MAPPING.items())[:5]:
        print(f"   '{old}' → '{new}'")
    print(f"   ... and {len(REGION_MAPPING) - 5} more")
    
    # Update all files
    update_csv_regions()
    update_sql_regions()
    update_typescript_regions()
    
    print(f"\n✅ Region name updates complete!")
    print(f"📋 All files now use official standardized region names")
    
    # Regenerate missing ZIP tasks with new names
    csv_path = Path('data/geography/merged_phil_geo.csv')
    if csv_path.exists():
        df = pd.read_csv(csv_path)
        missing_zips = df[df['zipcode'] == '']
        
        if len(missing_zips) > 0:
            missing_zip_path = Path('missing_zip_tasks.csv')
            missing_zips[['region', 'province', 'municipality_city', 'barangay']].to_csv(
                missing_zip_path, index=False, encoding='utf-8-sig'
            )
            print(f"✅ Updated missing ZIP tasks file: {missing_zip_path}")

if __name__ == "__main__":
    main()