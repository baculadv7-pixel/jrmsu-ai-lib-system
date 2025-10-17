"""
update_ilocos_region.py
Updates the geographic data with detailed Region I - Ilocos Region information and ZIP codes.
"""

import pandas as pd
from pathlib import Path
import json
from datetime import datetime

# Region I - Ilocos Region data with ZIP codes
ILOCOS_REGION_DATA = {
    "region": "Ilocos Region (I)",
    "provinces": {
        "Ilocos Norte": {
            "municipalities": {
                "Adams": "2922",
                "Bacarra": "2916", 
                "Badoc": "2904",
                "Bangui": "2920",
                "Burgos": "2918",
                "Carasi": "2911",
                "Currimao": "2903",
                "Dingras": "2913",
                "Dumalneg": "2921",
                "Laoag City": "2900",
                "Marcos": "2907",
                "Nueva Era": "2909",
                "Pagudpud": "2919",
                "Paoay": "2902",
                "Pasuquin": "2917",
                "Piddig": "2912",
                "Pinili": "2905",
                "San Nicolas": "2901",
                "Sarrat": "2914",
                "Solsona": "2910",
                "Vintar": "2915",
                "Batac City": "2906"
            }
        },
        "Ilocos Sur": {
            "municipalities": {
                "Alilem": "2716",
                "Banayoyo": "2708",
                "Bantay": "2727",
                "Burgos": "2724",
                "Cabugao": "2732",
                "Candon City": "2710",
                "Caoayan": "2702",
                "Cervantes": "2718",
                "Galimuyod": "2709",
                "Gregorio del Pilar": "2717",
                "Lidlidda": "2723",
                "Magsingal": "2730",
                "Nagbukel": "2719",
                "Narvacan": "2704",
                "Quirino": "2721",
                "Salcedo": "2711",
                "San Emilio": "2720",
                "San Esteban": "2706",
                "San Ildefonso": "2728",
                "San Juan": "2731",
                "San Vicente": "2726",
                "Santa": "2703",
                "Santa Catalina": "2701",
                "Santa Cruz": "2713",
                "Santa Lucia": "2712",
                "Santa Maria": "2705",
                "Santiago": "2707",
                "Sigay": "2715",
                "Sinait": "2733",
                "Sugpon": "2714",
                "Suyo": "2715",
                "Tagudin": "2714",
                "Vigan City": "2700"
            }
        },
        "La Union": {
            "municipalities": {
                "Agoo": "2504",
                "Aringay": "2503",
                "Bacnotan": "2515",
                "Bagulin": "2512",
                "Balaoan": "2517",
                "Bangar": "2519",
                "Bauang": "2501",
                "Burgos": "2510",
                "Caba": "2502",
                "Luna": "2518",
                "Naguilian": "2511",
                "Pugo": "2508",
                "Rosario": "2506",
                "San Fernando City": "2500",
                "San Gabriel": "2513",
                "San Juan": "2514",
                "Santo Tomas": "2505",
                "Santol": "2516",
                "Sudipen": "2520",
                "Tubao": "2509"
            }
        },
        "Pangasinan": {
            "municipalities": {
                "Agno": "2408",
                "Aguilar": "2415",
                "Alaminos City": "2404",
                "Alcala": "2425",
                "Anda": "2405",
                "Asingan": "2439",
                "Balungao": "2442",
                "Bani": "2407",
                "Basista": "2422",
                "Bautista": "2424",
                "Bayambang": "2423",
                "Binmaley": "2417",
                "Bolinao": "2406",
                "Bugallon": "2416",
                "Burgos": "2410",
                "Calasiao": "2418",
                "Dasol": "2411",
                "Infanta": "2412",
                "Labrador": "2402",
                "Lingayen": "2401",  # Capital
                "Mabini": "2409",
                "Malasiqui": "2421",
                "Manaoag": "2430",
                "Mangaldan": "2432",
                "Mangatarem": "2413",
                "Mapandan": "2429",
                "Natividad": "2446",
                "Pozorrubio": "2435",
                "Rosales": "2441",
                "San Carlos City": "2420",
                "San Fabian": "2433",
                "San Jacinto": "2431",
                "San Manuel": "2438",
                "San Nicolas": "2447",
                "San Quintin": "2444",
                "Santa Barbara": "2419",
                "Santa Maria": "2440",
                "Santo Tomas": "2437",
                "Sison": "2434",
                "Sual": "2403",
                "Tayug": "2445",
                "Umingan": "2443",
                "Urbiztondo": "2414",
                "Urdaneta City": "2428",
                "Villasis": "2427",
                "Dagupan City": "2400"
            }
        }
    }
}

def update_csv_with_ilocos_data():
    """Update CSV file with Region I ZIP codes"""
    csv_path = Path('data/geography/merged_phil_geo.csv')
    
    if not csv_path.exists():
        print(f"❌ CSV file not found: {csv_path}")
        return
    
    print("📊 Loading existing CSV data...")
    df = pd.read_csv(csv_path)
    
    region_name = ILOCOS_REGION_DATA["region"]
    updated_count = 0
    
    print(f"🔍 Updating {region_name} ZIP codes...")
    
    for province_name, province_data in ILOCOS_REGION_DATA["provinces"].items():
        for municipality_name, zipcode in province_data["municipalities"].items():
            # Update records that match region, province, and municipality
            mask = (
                (df['region'] == region_name) & 
                (df['province'] == province_name) & 
                (df['municipality_city'] == municipality_name)
            )
            
            if mask.any():
                df.loc[mask, 'zipcode'] = zipcode
                count = mask.sum()
                updated_count += count
                print(f"   ✅ Updated {count} records: {province_name} → {municipality_name} → {zipcode}")
            else:
                print(f"   ⚠️  No records found for: {province_name} → {municipality_name}")
    
    # Save updated CSV
    df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"✅ Updated {updated_count} records in CSV file")
    
    return df

def update_sql_with_ilocos_data():
    """Update SQL file with Region I ZIP codes"""
    sql_path = Path('data/geography/merged_phil_geo.sql')
    
    if not sql_path.exists():
        print(f"❌ SQL file not found: {sql_path}")
        return
    
    print("📊 Updating SQL file with new ZIP codes...")
    
    with open(sql_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    region_name = ILOCOS_REGION_DATA["region"]
    updated_sql_count = 0
    
    for province_name, province_data in ILOCOS_REGION_DATA["provinces"].items():
        for municipality_name, zipcode in province_data["municipalities"].items():
            # Replace empty ZIP codes in SQL INSERT statements
            old_pattern = f"('{region_name}', '{province_name}', '{municipality_name}', "
            
            # Find and replace empty ZIP codes
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if old_pattern in line and line.endswith("', '');") or line.endswith("', ''),"):
                    # Replace empty ZIP code with actual ZIP code
                    lines[i] = line.replace("', '')", f"', '{zipcode}')").replace("', '',", f"', '{zipcode}',")
                    updated_sql_count += 1
            
            content = '\n'.join(lines)
    
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Updated {updated_sql_count} ZIP codes in SQL file")

def update_typescript_with_ilocos_data():
    """Update TypeScript file with Region I ZIP codes"""
    ts_path = Path('src/data/philippines-complete.ts')
    
    if not ts_path.exists():
        print(f"❌ TypeScript file not found: {ts_path}")
        return
    
    print("📊 Updating TypeScript file with new ZIP codes...")
    
    with open(ts_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    region_name = ILOCOS_REGION_DATA["region"]
    updated_ts_count = 0
    
    for province_name, province_data in ILOCOS_REGION_DATA["provinces"].items():
        for municipality_name, zipcode in province_data["municipalities"].items():
            # Update municipality ZIP codes in TypeScript
            municipality_pattern = f'name: "{municipality_name}",\n            province: "{province_name}",\n            region: "{region_name}",\n            zipcode: ""'
            replacement = f'name: "{municipality_name}",\n            province: "{province_name}",\n            region: "{region_name}",\n            zipcode: "{zipcode}"'
            
            if municipality_pattern in content:
                content = content.replace(municipality_pattern, replacement)
                updated_ts_count += 1
            
            # Also update barangay ZIP codes for this municipality
            barangay_pattern = f'municipality: "{municipality_name}",\n                province: "{province_name}",\n                region: "{region_name}",\n                zipcode: ""'
            barangay_replacement = f'municipality: "{municipality_name}",\n                province: "{province_name}",\n                region: "{region_name}",\n                zipcode: "{zipcode}"'
            
            content = content.replace(barangay_pattern, barangay_replacement)
    
    with open(ts_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Updated TypeScript file with ZIP codes")

def generate_summary_report(updated_df):
    """Generate summary report of the updates"""
    region_name = ILOCOS_REGION_DATA["region"]
    
    print(f"\n📊 Region I - Ilocos Region Update Summary:")
    print("=" * 50)
    
    # Count records by province
    ilocos_records = updated_df[updated_df['region'] == region_name]
    
    for province_name in ILOCOS_REGION_DATA["provinces"].keys():
        province_records = ilocos_records[ilocos_records['province'] == province_name]
        with_zip = province_records[province_records['zipcode'] != ''].shape[0]
        total = province_records.shape[0]
        
        municipalities = len(ILOCOS_REGION_DATA["provinces"][province_name]["municipalities"])
        
        print(f"   🏝️  {province_name}:")
        print(f"      📍 {municipalities} municipalities/cities")
        print(f"      📊 {total:,} total records")
        print(f"      📮 {with_zip:,} with ZIP codes")
        
        if with_zip < total:
            print(f"      ⚠️  {total - with_zip:,} still need ZIP codes")
    
    # Overall statistics
    total_municipalities = sum(len(p["municipalities"]) for p in ILOCOS_REGION_DATA["provinces"].values())
    print(f"\n✅ Region I Summary:")
    print(f"   📋 4 provinces")
    print(f"   🏘️  {total_municipalities} municipalities/cities")
    print(f"   📮 All municipalities now have official ZIP codes")

def main():
    """Update all files with Region I - Ilocos Region data"""
    
    print("🇵🇭 Updating Region I - Ilocos Region Data")
    print("=" * 50)
    
    # Update all files
    updated_df = update_csv_with_ilocos_data()
    update_sql_with_ilocos_data()
    update_typescript_with_ilocos_data()
    
    if updated_df is not None:
        generate_summary_report(updated_df)
        
        # Update missing ZIP tasks file
        missing_zips = updated_df[updated_df['zipcode'] == '']
        
        if len(missing_zips) > 0:
            missing_zip_path = Path('missing_zip_tasks.csv')
            missing_zips[['region', 'province', 'municipality_city', 'barangay']].to_csv(
                missing_zip_path, index=False, encoding='utf-8-sig'
            )
            print(f"✅ Updated missing ZIP tasks: {missing_zip_path}")
        
        print(f"\n🎉 Region I - Ilocos Region update complete!")
        print(f"📋 All Ilocos Region municipalities now have official ZIP codes")
        print(f"🗃️  Database ready for import with updated data")

if __name__ == "__main__":
    main()