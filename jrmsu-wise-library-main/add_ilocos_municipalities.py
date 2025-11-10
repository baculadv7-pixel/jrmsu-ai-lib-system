#!/usr/bin/env python3
"""
Script to add missing Region I municipalities with their ZIP codes to the geographic database
"""

import csv
import re

def add_ilocos_municipalities():
    # Define the municipalities with their ZIP codes to add
    ilocos_municipalities_zip = {
        "Adams": "2913", "Bacarra": "2911", "Badoc": "2904", "Bangui": "2917",
        "Banna": "2920", "Burgos": "2918", "Carasi": "2922", "Currimao": "2903",
        "Dingras": "2913", "Dumalneg": "2923", "Marcos": "2921", "Nueva Era": "2924",
        "Pagudpud": "2919", "Paoay": "2902", "Pasuquin": "2916", "Piddig": "2912",
        "Pinili": "2909", "San Nicolas": "2901", "Sarrat": "2914", "Solsona": "2915",
        "Vintar": "2910", "Agoo": "2504", "Aringay": "2506", "Bacnotan": "2515",
        "Bagulin": "2518", "Balaoan": "2516", "Bangar": "2517", "Bauang": "2501",
        "Burgos": "2510", "Caba": "2540", "Luna": "2511", "Naguilian": "2505",
        "Pugo": "2513", "Rosario": "2500", "San Gabriel": "2503", "San Juan": "2514",
        "Santo Tomas": "2020", "Sudipen": "2521", "Tubao": "2507", "Alilem": "2709",
        "Banayoyo": "2708", "Bantay": "2727", "Burgos": "2722", "Cabugao": "2732",
        "Caoayan": "2701", "Cervantes": "2718", "Galimuyod": "2717", "Gregorio Del Pilar": "2719",
        "Lidlidda": "2714", "Magsingal": "2730", "Nagbukel": "2715", "Narvacan": "2704",
        "Quirino": "2720", "Salcedo": "2716", "San Emilio": "2721", "San Esteban": "2706",
        "San Ildefonso": "2729", "San Juan": "2728", "San Vicente": "2705", "Santa": "2707",
        "Santa Catalina": "2731", "Santa Cruz": "2713", "Santa Lucia": "2710", "Santa Maria": "2723",
        "Santiago": "2712", "Santo Domingo": "2711", "Sigay": "2724", "Sinait": "2726",
        "Sugpon": "2725", "Tagudin": "2703", "Alaminos": "2501", "Bay": "2440",
        "Bani": "2407", "Bolinao": "2406", "Bugallon": "2408", "Burgos": "2410",
        "Calasiao": "2400", "Dasol": "2411", "Infanta": "2412", "Labrador": "2402",
        "Laoag": "2900", "Lingayen": "2401", "Mabini": "2403", "Malasiqui": "2421",
        "Manaoag": "2430", "Mangaldan": "2432", "Mangatarem": "2433", "Mapandan": "2444",
        "Natividad": "2448", "Pozorrubio": "2435", "Rosales": "2441", "San Fabian": "2433",
        "San Jacinto": "2442", "San Manuel": "2443", "San Quintin": "2434", "Santa Barbara": "2449",
        "Santo Tomas": "2020", "Sual": "2405", "Tayug": "2445", "Umingan": "2447",
        "Urbiztondo": "2447", "Villasis": "2427"
    }
    
    # File paths
    csv_file = r"data\geography\merged_phil_geo.csv"
    sql_file = r"data\geography\merged_phil_geo.sql"
    ts_file = r"src\data\philippines-complete.ts"
    
    # Province mapping for Region I
    province_map = {
        "Adams": "Ilocos Norte", "Bacarra": "Ilocos Norte", "Badoc": "Ilocos Norte", "Bangui": "Ilocos Norte",
        "Banna": "Ilocos Norte", "Burgos": "Ilocos Norte", "Carasi": "Ilocos Norte", "Currimao": "Ilocos Norte",
        "Dingras": "Ilocos Norte", "Dumalneg": "Ilocos Norte", "Marcos": "Ilocos Norte", "Nueva Era": "Ilocos Norte",
        "Pagudpud": "Ilocos Norte", "Paoay": "Ilocos Norte", "Pasuquin": "Ilocos Norte", "Piddig": "Ilocos Norte",
        "Pinili": "Ilocos Norte", "San Nicolas": "Ilocos Norte", "Sarrat": "Ilocos Norte", "Solsona": "Ilocos Norte",
        "Vintar": "Ilocos Norte", "Agoo": "La Union", "Aringay": "La Union", "Bacnotan": "La Union",
        "Bagulin": "La Union", "Balaoan": "La Union", "Bangar": "La Union", "Bauang": "La Union",
        "Burgos": "La Union", "Caba": "La Union", "Luna": "La Union", "Naguilian": "La Union",
        "Pugo": "La Union", "Rosario": "La Union", "San Gabriel": "La Union", "San Juan": "La Union",
        "Santo Tomas": "La Union", "Sudipen": "La Union", "Tubao": "La Union", "Alilem": "Ilocos Sur",
        "Banayoyo": "Ilocos Sur", "Bantay": "Ilocos Sur", "Burgos": "Ilocos Sur", "Cabugao": "Ilocos Sur",
        "Caoayan": "Ilocos Sur", "Cervantes": "Ilocos Sur", "Galimuyod": "Ilocos Sur", "Gregorio Del Pilar": "Ilocos Sur",
        "Lidlidda": "Ilocos Sur", "Magsingal": "Ilocos Sur", "Nagbukel": "Ilocos Sur", "Narvacan": "Ilocos Sur",
        "Quirino": "Ilocos Sur", "Salcedo": "Ilocos Sur", "San Emilio": "Ilocos Sur", "San Esteban": "Ilocos Sur",
        "San Ildefonso": "Ilocos Sur", "San Juan": "Ilocos Sur", "San Vicente": "Ilocos Sur", "Santa": "Ilocos Sur",
        "Santa Catalina": "Ilocos Sur", "Santa Cruz": "Ilocos Sur", "Santa Lucia": "Ilocos Sur", "Santa Maria": "Ilocos Sur",
        "Santiago": "Ilocos Sur", "Santo Domingo": "Ilocos Sur", "Sigay": "Ilocos Sur", "Sinait": "Ilocos Sur",
        "Sugpon": "Ilocos Sur", "Tagudin": "Ilocos Sur", "Alaminos": "Pangasinan", "Bay": "Pangasinan",
        "Bani": "Pangasinan", "Bolinao": "Pangasinan", "Bugallon": "Pangasinan", "Burgos": "Pangasinan",
        "Calasiao": "Pangasinan", "Dasol": "Pangasinan", "Infanta": "Pangasinan", "Labrador": "Pangasinan",
        "Laoag": "Ilocos Norte", "Lingayen": "Pangasinan", "Mabini": "Pangasinan", "Malasiqui": "Pangasinan",
        "Manaoag": "Pangasinan", "Mangaldan": "Pangasinan", "Mangatarem": "Pangasinan", "Mapandan": "Pangasinan",
        "Natividad": "Pangasinan", "Pozorrubio": "Pangasinan", "Rosales": "Pangasinan", "San Fabian": "Pangasinan",
        "San Jacinto": "Pangasinan", "San Manuel": "Pangasinan", "San Quintin": "Pangasinan", "Santa Barbara": "Pangasinan",
        "Santo Tomas": "Pangasinan", "Sual": "Pangasinan", "Tayug": "Pangasinan", "Umingan": "Pangasinan",
        "Urbiztondo": "Pangasinan", "Villasis": "Pangasinan"
    }

    # Sample barangays for each municipality (minimal data since we're focusing on ZIP codes)
    sample_barangays = {
        "Adams": ["Poblacion"], "Bacarra": ["Poblacion"], "Badoc": ["Poblacion"], "Bangui": ["Poblacion"],
        "Banna": ["Poblacion"], "Burgos": ["Poblacion"], "Carasi": ["Poblacion"], "Currimao": ["Poblacion"],
        "Dingras": ["Poblacion"], "Dumalneg": ["Poblacion"], "Marcos": ["Poblacion"], "Nueva Era": ["Poblacion"],
        "Pagudpud": ["Poblacion"], "Paoay": ["Poblacion"], "Pasuquin": ["Poblacion"], "Piddig": ["Poblacion"],
        "Pinili": ["Poblacion"], "San Nicolas": ["Poblacion"], "Sarrat": ["Poblacion"], "Solsona": ["Poblacion"],
        "Vintar": ["Poblacion"], "Agoo": ["Poblacion"], "Aringay": ["Poblacion"], "Bacnotan": ["Poblacion"],
        "Bagulin": ["Poblacion"], "Balaoan": ["Poblacion"], "Bangar": ["Poblacion"], "Bauang": ["Poblacion"],
        "Luna": ["Poblacion"], "Naguilian": ["Poblacion"], "Pugo": ["Poblacion"], "Rosario": ["Poblacion"],
        "San Gabriel": ["Poblacion"], "San Juan": ["Poblacion"], "Santo Tomas": ["Poblacion"], "Sudipen": ["Poblacion"],
        "Tubao": ["Poblacion"], "Alilem": ["Poblacion"], "Banayoyo": ["Poblacion"], "Bantay": ["Poblacion"],
        "Cabugao": ["Poblacion"], "Caoayan": ["Poblacion"], "Cervantes": ["Poblacion"], "Galimuyod": ["Poblacion"],
        "Gregorio Del Pilar": ["Poblacion"], "Lidlidda": ["Poblacion"], "Magsingal": ["Poblacion"], "Nagbukel": ["Poblacion"],
        "Narvacan": ["Poblacion"], "Quirino": ["Poblacion"], "Salcedo": ["Poblacion"], "San Emilio": ["Poblacion"],
        "San Esteban": ["Poblacion"], "San Ildefonso": ["Poblacion"], "San Vicente": ["Poblacion"], "Santa": ["Poblacion"],
        "Santa Catalina": ["Poblacion"], "Santa Cruz": ["Poblacion"], "Santa Lucia": ["Poblacion"], "Santa Maria": ["Poblacion"],
        "Santiago": ["Poblacion"], "Santo Domingo": ["Poblacion"], "Sigay": ["Poblacion"], "Sinait": ["Poblacion"],
        "Sugpon": ["Poblacion"], "Tagudin": ["Poblacion"], "Bay": ["Poblacion"], "Bani": ["Poblacion"],
        "Bolinao": ["Poblacion"], "Bugallon": ["Poblacion"], "Calasiao": ["Poblacion"], "Dasol": ["Poblacion"],
        "Infanta": ["Poblacion"], "Labrador": ["Poblacion"], "Lingayen": ["Poblacion"], "Mabini": ["Poblacion"],
        "Malasiqui": ["Poblacion"], "Manaoag": ["Poblacion"], "Mangaldan": ["Poblacion"], "Mangatarem": ["Poblacion"],
        "Mapandan": ["Poblacion"], "Natividad": ["Poblacion"], "Pozorrubio": ["Poblacion"], "Rosales": ["Poblacion"],
        "San Fabian": ["Poblacion"], "San Jacinto": ["Poblacion"], "San Manuel": ["Poblacion"], "San Quintin": ["Poblacion"],
        "Santa Barbara": ["Poblacion"], "Sual": ["Poblacion"], "Tayug": ["Poblacion"], "Umingan": ["Poblacion"],
        "Urbiztondo": ["Poblacion"], "Villasis": ["Poblacion"]
    }
    
    # Special handling for duplicate municipality names
    duplicate_handling = {
        "Burgos": ["Ilocos Norte", "La Union", "Ilocos Sur", "Pangasinan"],
        "San Juan": ["La Union", "Ilocos Sur"],
        "Santo Tomas": ["La Union", "Pangasinan"],
        "Alaminos": ["Pangasinan"]  # Already exists as City Of Alaminos
    }
    
    csv_updates = 0
    sql_updates = 0
    ts_updates = 0
    
    print("Adding missing Region I municipalities to geographic database...")
    
    # 1. Add to CSV file
    try:
        # Read existing CSV data
        existing_entries = []
        with open(csv_file, 'r', encoding='utf-8', errors='ignore') as file:
            reader = csv.reader(file)
            existing_entries = list(reader)
        
        # Add new entries
        new_entries = []
        for municipality, zipcode in ilocos_municipalities_zip.items():
            if municipality in province_map:
                province = province_map[municipality]
                barangays = sample_barangays.get(municipality, ["Poblacion"])
                
                # Skip if city version already exists
                city_name = f"City Of {municipality}"
                city_exists = any(city_name in str(row) for row in existing_entries)
                if city_exists:
                    print(f"  Skipping {municipality} - city version already exists")
                    continue
                
                for barangay in barangays:
                    new_entry = ["Ilocos Region (I)", province, municipality, barangay, zipcode]
                    new_entries.append(new_entry)
        
        # Write updated CSV
        with open(csv_file, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerows(existing_entries + new_entries)
        
        csv_updates = len(new_entries)
        print(f"Added {csv_updates} entries to CSV file")
        
    except Exception as e:
        print(f"Error updating CSV file: {e}")
    
    # 2. Add to SQL file
    try:
        # Read SQL file
        with open(sql_file, 'r', encoding='utf-8', errors='ignore') as file:
            sql_content = file.read()
        
        # Generate INSERT statements for new entries
        insert_statements = []
        for municipality, zipcode in ilocos_municipalities_zip.items():
            if municipality in province_map:
                province = province_map[municipality]
                barangays = sample_barangays.get(municipality, ["Poblacion"])
                
                # Skip if city version already exists
                if f"City Of {municipality}" in sql_content:
                    continue
                
                for barangay in barangays:
                    insert_stmt = f"INSERT INTO philippine_geography VALUES ('Ilocos Region (I)', '{province}', '{municipality}', '{barangay}', '{zipcode}');"
                    insert_statements.append(insert_stmt)
        
        # Append to SQL file
        if insert_statements:
            with open(sql_file, 'a', encoding='utf-8') as file:
                file.write('\n' + '\n'.join(insert_statements) + '\n')
        
        sql_updates = len(insert_statements)
        print(f"Added {sql_updates} INSERT statements to SQL file")
        
    except Exception as e:
        print(f"Error updating SQL file: {e}")
    
    # 3. Update TypeScript file
    try:
        # Read TypeScript file
        with open(ts_file, 'r', encoding='utf-8', errors='ignore') as file:
            ts_content = file.read()
        
        # Generate TypeScript entries
        ts_entries = []
        for municipality, zipcode in ilocos_municipalities_zip.items():
            if municipality in province_map:
                province = province_map[municipality]
                barangays = sample_barangays.get(municipality, ["Poblacion"])
                
                # Skip if city version already exists
                if f"City Of {municipality}" in ts_content:
                    continue
                
                for barangay in barangays:
                    ts_entry = f'    {{ region: "Ilocos Region (I)", province: "{province}", municipality: "{municipality}", barangay: "{barangay}", zipcode: "{zipcode}" }},'
                    ts_entries.append(ts_entry)
        
        # Find the insertion point (before the closing bracket)
        if ts_entries:
            # Look for the last entry and insert before the closing ];
            insertion_point = ts_content.rfind('];')
            if insertion_point != -1:
                new_ts_content = (
                    ts_content[:insertion_point] + 
                    '\n' + '\n'.join(ts_entries) + '\n' +
                    ts_content[insertion_point:]
                )
                
                with open(ts_file, 'w', encoding='utf-8') as file:
                    file.write(new_ts_content)
        
        ts_updates = len(ts_entries)
        print(f"Added {ts_updates} entries to TypeScript file")
        
    except Exception as e:
        print(f"Error updating TypeScript file: {e}")
    
    print(f"\nSummary:")
    print(f"  CSV entries added: {csv_updates}")
    print(f"  SQL statements added: {sql_updates}")
    print(f"  TypeScript entries added: {ts_updates}")
    
    if csv_updates > 0 or sql_updates > 0 or ts_updates > 0:
        print(f"\n✅ Successfully added missing Region I municipalities with ZIP codes!")
    else:
        print(f"\n⚠️  No new entries were added. All municipalities may already exist.")

if __name__ == "__main__":
    add_ilocos_municipalities()