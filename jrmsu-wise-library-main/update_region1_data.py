#!/usr/bin/env python3
"""
Update Region I - Ilocos Region data with proper alphabetical ordering
and correct province/municipality structure
"""

def create_region1_data():
    """Create Region I data with alphabetical ordering"""
    
    region1_data = {
        "name": "Region I – Ilocos Region",
        "provinces": [
            {
                "name": "ILOCOS NORTE",
                "municipalities": [
                    {"name": "Adams", "zipcode": "2922"},
                    {"name": "Bacarra", "zipcode": "2916"},
                    {"name": "Badoc", "zipcode": "2904"},
                    {"name": "Bangui", "zipcode": "2920"},
                    {"name": "Batac City", "zipcode": "2906"},
                    {"name": "Burgos", "zipcode": "2918"},
                    {"name": "Carasi", "zipcode": "2911"},
                    {"name": "Currimao", "zipcode": "2903"},
                    {"name": "Dingras", "zipcode": "2913"},
                    {"name": "Dumalneg", "zipcode": "2921"},
                    {"name": "Laoag City", "zipcode": "2900"},
                    {"name": "Marcos", "zipcode": "2907"},
                    {"name": "Nueva Era", "zipcode": "2909"},
                    {"name": "Pagudpud", "zipcode": "2919"},
                    {"name": "Paoay", "zipcode": "2902"},
                    {"name": "Pasuquin", "zipcode": "2917"},
                    {"name": "Piddig", "zipcode": "2912"},
                    {"name": "Pinili", "zipcode": "2905"},
                    {"name": "San Nicolas", "zipcode": "2901"},
                    {"name": "Sarrat", "zipcode": "2914"},
                    {"name": "Solsona", "zipcode": "2910"},
                    {"name": "Vintar", "zipcode": "2915"}
                ]
            },
            {
                "name": "ILOCOS SUR", 
                "municipalities": [
                    {"name": "Alilem", "zipcode": "2716"},
                    {"name": "Banayoyo", "zipcode": "2708"},
                    {"name": "Bantay", "zipcode": "2727"},
                    {"name": "Burgos", "zipcode": "2724"},
                    {"name": "Cabugao", "zipcode": "2732"},
                    {"name": "Candon City", "zipcode": "2710"},
                    {"name": "Caoayan", "zipcode": "2702"},
                    {"name": "Cervantes", "zipcode": "2718"},
                    {"name": "Galimuyod", "zipcode": "2709"},
                    {"name": "Gregorio del Pilar", "zipcode": "2717"},
                    {"name": "Lidlidda", "zipcode": "2723"},
                    {"name": "Magsingal", "zipcode": "2730"},
                    {"name": "Nagbukel", "zipcode": "2719"},
                    {"name": "Narvacan", "zipcode": "2704"},
                    {"name": "Quirino", "zipcode": "2721"},
                    {"name": "Salcedo", "zipcode": "2711"},
                    {"name": "San Emilio", "zipcode": "2720"},
                    {"name": "San Esteban", "zipcode": "2706"},
                    {"name": "San Ildefonso", "zipcode": "2728"},
                    {"name": "San Juan", "zipcode": "2731"},
                    {"name": "San Vicente", "zipcode": "2726"},
                    {"name": "Santa", "zipcode": "2703"},
                    {"name": "Santa Catalina", "zipcode": "2701"},
                    {"name": "Santa Cruz", "zipcode": "2713"},
                    {"name": "Santa Lucia", "zipcode": "2712"},
                    {"name": "Santa Maria", "zipcode": "2705"},
                    {"name": "Santiago", "zipcode": "2707"},
                    {"name": "Sigay", "zipcode": "2715"},
                    {"name": "Sinait", "zipcode": "2733"},
                    {"name": "Sugpon", "zipcode": "2714"},
                    {"name": "Suyo", "zipcode": "2715"},
                    {"name": "Tagudin", "zipcode": "2714"},
                    {"name": "Vigan City", "zipcode": "2700"}
                ]
            },
            {
                "name": "LA UNION",
                "municipalities": [
                    {"name": "Agoo", "zipcode": "2504"},
                    {"name": "Aringay", "zipcode": "2503"},
                    {"name": "Bacnotan", "zipcode": "2515"},
                    {"name": "Bagulin", "zipcode": "2512"},
                    {"name": "Balaoan", "zipcode": "2517"},
                    {"name": "Bangar", "zipcode": "2519"},
                    {"name": "Bauang", "zipcode": "2501"},
                    {"name": "Burgos", "zipcode": "2510"},
                    {"name": "Caba", "zipcode": "2502"},
                    {"name": "Luna", "zipcode": "2518"},
                    {"name": "Naguilian", "zipcode": "2511"},
                    {"name": "Pugo", "zipcode": "2508"},
                    {"name": "Rosario", "zipcode": "2506"},
                    {"name": "San Fernando City", "zipcode": "2500"},
                    {"name": "San Gabriel", "zipcode": "2513"},
                    {"name": "San Juan", "zipcode": "2514"},
                    {"name": "Santo Tomas", "zipcode": "2505"},
                    {"name": "Santol", "zipcode": "2516"},
                    {"name": "Sudipen", "zipcode": "2520"},
                    {"name": "Tubao", "zipcode": "2509"}
                ]
            },
            {
                "name": "PANGASINAN",
                "municipalities": [
                    {"name": "Agno", "zipcode": "2408"},
                    {"name": "Aguilar", "zipcode": "2415"},
                    {"name": "Alaminos City", "zipcode": "2404"},
                    {"name": "Alcala", "zipcode": "2425"},
                    {"name": "Anda", "zipcode": "2405"},
                    {"name": "Asingan", "zipcode": "2439"},
                    {"name": "Balungao", "zipcode": "2442"},
                    {"name": "Bani", "zipcode": "2407"},
                    {"name": "Basista", "zipcode": "2422"},
                    {"name": "Bautista", "zipcode": "2424"},
                    {"name": "Bayambang", "zipcode": "2423"},
                    {"name": "Binmaley", "zipcode": "2417"},
                    {"name": "Bolinao", "zipcode": "2406"},
                    {"name": "Bugallon", "zipcode": "2416"},
                    {"name": "Burgos", "zipcode": "2410"},
                    {"name": "Calasiao", "zipcode": "2418"},
                    {"name": "Dagupan City", "zipcode": "2400"},
                    {"name": "Dasol", "zipcode": "2411"},
                    {"name": "Infanta", "zipcode": "2412"},
                    {"name": "Labrador", "zipcode": "2402"},
                    {"name": "Lingayen", "zipcode": "2401"},
                    {"name": "Mabini", "zipcode": "2409"},
                    {"name": "Malasiqui", "zipcode": "2421"},
                    {"name": "Manaoag", "zipcode": "2430"},
                    {"name": "Mangaldan", "zipcode": "2432"},
                    {"name": "Mangatarem", "zipcode": "2413"},
                    {"name": "Mapandan", "zipcode": "2429"},
                    {"name": "Natividad", "zipcode": "2446"},
                    {"name": "Pozorrubio", "zipcode": "2435"},
                    {"name": "Rosales", "zipcode": "2441"},
                    {"name": "San Carlos City", "zipcode": "2420"},
                    {"name": "San Fabian", "zipcode": "2433"},
                    {"name": "San Jacinto", "zipcode": "2431"},
                    {"name": "San Manuel", "zipcode": "2438"},
                    {"name": "San Nicolas", "zipcode": "2447"},
                    {"name": "San Quintin", "zipcode": "2444"},
                    {"name": "Santa Barbara", "zipcode": "2419"},
                    {"name": "Santa Maria", "zipcode": "2440"},
                    {"name": "Santo Tomas", "zipcode": "2437"},
                    {"name": "Sison", "zipcode": "2434"},
                    {"name": "Sual", "zipcode": "2403"},
                    {"name": "Tayug", "zipcode": "2445"},
                    {"name": "Umingan", "zipcode": "2443"},
                    {"name": "Urbiztondo", "zipcode": "2414"},
                    {"name": "Urdaneta City", "zipcode": "2428"},
                    {"name": "Villasis", "zipcode": "2427"}
                ]
            }
        ]
    }
    
    # Sort provinces alphabetically
    region1_data["provinces"].sort(key=lambda x: x["name"])
    
    # Sort municipalities within each province alphabetically
    for province in region1_data["provinces"]:
        province["municipalities"].sort(key=lambda x: x["name"])
    
    return region1_data

def update_typescript_file():
    """Update the TypeScript file with corrected Region I data"""
    
    # Read the current file
    with open('src/data/philippines-geography.ts', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Generate the new Region I data
    region1_data = create_region1_data()
    
    # Create the TypeScript representation
    region1_ts = generate_region_typescript(region1_data)
    
    # Find and replace the Region I section
    import re
    
    # Pattern to match the entire Region I section
    pattern = r'{\s*name:\s*"Region I – Ilocos Region",.*?(?=^\s*},?\s*{\s*name:|\];\s*$)'
    
    # Replace the region data
    updated_content = re.sub(pattern, region1_ts, content, flags=re.DOTALL | re.MULTILINE)
    
    # Write back to file
    with open('src/data/philippines-geography.ts', 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    print("✅ Region I data updated successfully!")
    print(f"✅ Provinces in alphabetical order: {len(region1_data['provinces'])}")
    for province in region1_data['provinces']:
        print(f"   - {province['name']}: {len(province['municipalities'])} municipalities")

def generate_region_typescript(region_data):
    """Generate TypeScript representation of region data"""
    
    ts_lines = ['{']
    ts_lines.append(f'  name: "{region_data["name"]}",')
    ts_lines.append('  provinces: [')
    
    for i, province in enumerate(region_data["provinces"]):
        ts_lines.append('  {')
        ts_lines.append(f'    name: "{province["name"]}",')
        ts_lines.append('    municipalities: [')
        
        for j, municipality in enumerate(province["municipalities"]):
            ts_lines.append('    {')
            ts_lines.append(f'      name: "{municipality["name"]}",')
            ts_lines.append(f'      zipcode: "{municipality["zipcode"]}"')
            
            if j < len(province["municipalities"]) - 1:
                ts_lines.append('    },')
            else:
                ts_lines.append('    }')
        
        ts_lines.append('    ]')
        
        if i < len(region_data["provinces"]) - 1:
            ts_lines.append('  },')
        else:
            ts_lines.append('  }')
    
    ts_lines.append('  ]')
    ts_lines.append('}')
    
    return '\n'.join(ts_lines)

if __name__ == "__main__":
    print("Updating Region I – Ilocos Region data with alphabetical ordering...")
    update_typescript_file()