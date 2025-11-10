#!/usr/bin/env python3
"""
Script to validate that Region I municipalities with ZIP codes were successfully added
"""

import csv
import re

def validate_ilocos_additions():
    # Expected municipalities with their ZIP codes
    expected_municipalities = {
        "Adams": "2913", "Bacarra": "2911", "Badoc": "2904", "Bangui": "2917",
        "Banna": "2920", "Carasi": "2922", "Currimao": "2903", "Dingras": "2913",
        "Dumalneg": "2923", "Marcos": "2921", "Nueva Era": "2924", "Pagudpud": "2919",
        "Paoay": "2902", "Pasuquin": "2916", "Piddig": "2912", "Pinili": "2909",
        "San Nicolas": "2901", "Sarrat": "2914", "Solsona": "2915", "Vintar": "2910",
        "Agoo": "2504", "Aringay": "2506", "Bacnotan": "2515", "Bagulin": "2518",
        "Balaoan": "2516", "Bangar": "2517", "Bauang": "2501", "Luna": "2511",
        "Naguilian": "2505", "Pugo": "2513", "Rosario": "2500", "San Gabriel": "2503",
        "Sudipen": "2521", "Tubao": "2507", "Alilem": "2709", "Banayoyo": "2708",
        "Bantay": "2727", "Cabugao": "2732", "Caoayan": "2701", "Cervantes": "2718",
        "Galimuyod": "2717", "Gregorio Del Pilar": "2719", "Lidlidda": "2714", 
        "Magsingal": "2730", "Nagbukel": "2715", "Narvacan": "2704", "Quirino": "2720",
        "Salcedo": "2716", "San Emilio": "2721", "San Esteban": "2706", "San Ildefonso": "2729",
        "San Vicente": "2705", "Santa Catalina": "2731", "Santa Cruz": "2713", 
        "Santa Lucia": "2710", "Santa Maria": "2723", "Santo Domingo": "2711", 
        "Sigay": "2724", "Sinait": "2726", "Sugpon": "2725", "Tagudin": "2703",
        "Bay": "2440", "Bani": "2407", "Bolinao": "2406", "Bugallon": "2408",
        "Calasiao": "2400", "Dasol": "2411", "Infanta": "2412", "Labrador": "2402",
        "Lingayen": "2401", "Mabini": "2403", "Malasiqui": "2421", "Manaoag": "2430",
        "Mangaldan": "2432", "Mangatarem": "2433", "Mapandan": "2444", "Natividad": "2448",
        "Pozorrubio": "2435", "Rosales": "2441", "San Fabian": "2433", "San Jacinto": "2442",
        "San Manuel": "2443", "San Quintin": "2434", "Santa Barbara": "2449", "Sual": "2405",
        "Tayug": "2445", "Umingan": "2447", "Urbiztondo": "2447", "Villasis": "2427"
    }
    
    # Some municipalities that were skipped (already exist as cities)
    skipped_cities = ["Alaminos", "Caba", "San Juan", "Santa", "Santiago", "Bay", "Laoag", "Santo Tomas", "Burgos"]
    
    csv_file = r"data\geography\merged_phil_geo.csv"
    sql_file = r"data\geography\merged_phil_geo.sql"
    ts_file = r"src\data\philippines-complete.ts"
    
    print("Validating Region I municipality additions...")
    
    # Validate CSV file
    csv_found = set()
    csv_with_zip = {}
    
    try:
        with open(csv_file, 'r', encoding='utf-8', errors='ignore') as file:
            reader = csv.reader(file)
            for row in reader:
                if len(row) >= 5 and row[0].strip() == "Ilocos Region (I)":
                    municipality = row[2].strip()
                    zipcode = row[4].strip()
                    if municipality in expected_municipalities:
                        csv_found.add(municipality)
                        csv_with_zip[municipality] = zipcode
        
        print(f"\nCSV File Validation:")
        print(f"  Found {len(csv_found)} out of {len(expected_municipalities)} expected municipalities")
        
        # Check for ZIP code correctness
        correct_zip = 0
        for muni in csv_found:
            if csv_with_zip.get(muni) == expected_municipalities[muni]:
                correct_zip += 1
        
        print(f"  {correct_zip} municipalities have correct ZIP codes")
        
        # Show missing municipalities
        missing_csv = set(expected_municipalities.keys()) - csv_found
        if missing_csv:
            print(f"  Missing municipalities: {', '.join(sorted(missing_csv))}")
        
    except Exception as e:
        print(f"Error validating CSV file: {e}")
    
    # Validate SQL file
    sql_found = set()
    
    try:
        with open(sql_file, 'r', encoding='utf-8', errors='ignore') as file:
            sql_content = file.read()
            
        for municipality in expected_municipalities:
            if f"'{municipality}'" in sql_content and "Ilocos Region (I)" in sql_content:
                # More precise check
                pattern = f"INSERT INTO philippine_geography VALUES \\('Ilocos Region \\(I\\)', '[^']+', '{municipality}', '[^']+', '{expected_municipalities[municipality]}'\\);"
                if re.search(pattern, sql_content):
                    sql_found.add(municipality)
        
        print(f"\\nSQL File Validation:")
        print(f"  Found {len(sql_found)} out of {len(expected_municipalities)} expected INSERT statements")
        
        # Show missing SQL entries
        missing_sql = set(expected_municipalities.keys()) - sql_found
        if missing_sql:
            print(f"  Missing SQL entries: {', '.join(sorted(missing_sql))}")
        
    except Exception as e:
        print(f"Error validating SQL file: {e}")
    
    # Validate TypeScript file
    ts_found = set()
    
    try:
        with open(ts_file, 'r', encoding='utf-8', errors='ignore') as file:
            ts_content = file.read()
            
        for municipality in expected_municipalities:
            if f'municipality: "{municipality}"' in ts_content and '"Ilocos Region (I)"' in ts_content:
                # Check for correct ZIP code too
                pattern = f'region: "Ilocos Region \\(I\\)"[^}}]*municipality: "{municipality}"[^}}]*zipcode: "{expected_municipalities[municipality]}"'
                if re.search(pattern, ts_content):
                    ts_found.add(municipality)
        
        print(f"\\nTypeScript File Validation:")
        print(f"  Found {len(ts_found)} out of {len(expected_municipalities)} expected entries")
        
        # Show missing TypeScript entries
        missing_ts = set(expected_municipalities.keys()) - ts_found
        if missing_ts:
            print(f"  Missing TypeScript entries: {', '.join(sorted(missing_ts))}")
        
    except Exception as e:
        print(f"Error validating TypeScript file: {e}")
    
    # Summary
    print(f"\\n=== VALIDATION SUMMARY ===")
    print(f"Expected municipalities to add: {len(expected_municipalities)}")
    print(f"Skipped (already exist as cities): {len(skipped_cities)} - {', '.join(skipped_cities)}")
    print(f"CSV entries found: {len(csv_found)}")
    print(f"SQL entries found: {len(sql_found)}")
    print(f"TypeScript entries found: {len(ts_found)}")
    
    all_found = csv_found & sql_found & ts_found
    print(f"\\nMunicipalities successfully added to all files: {len(all_found)}")
    
    if len(all_found) == len(expected_municipalities):
        print("\\n✅ SUCCESS: All Region I municipalities with ZIP codes have been successfully added!")
    else:
        print(f"\\n⚠️  WARNING: {len(expected_municipalities) - len(all_found)} municipalities are missing from one or more files")
        missing_from_all = set(expected_municipalities.keys()) - all_found
        if missing_from_all:
            print(f"Missing from all files: {', '.join(sorted(missing_from_all))}")

if __name__ == "__main__":
    validate_ilocos_additions()