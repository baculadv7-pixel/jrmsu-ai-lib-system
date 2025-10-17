#!/usr/bin/env python3
"""
Update Region II - Cagayan Valley data with proper alphabetical ordering
and correct province/municipality structure
"""

def create_region2_data():
    """Create Region II data with alphabetical ordering"""
    
    region2_data = {
        "name": "Region II – Cagayan Valley",
        "provinces": [
            {
                "name": "BATANES",
                "municipalities": [
                    {"name": "Basco", "zipcode": "3900"},
                    {"name": "Itbayat", "zipcode": "3905"},
                    {"name": "Ivana", "zipcode": "3902"},
                    {"name": "Mahatao", "zipcode": "3901"},
                    {"name": "Sabtang", "zipcode": "3904"},
                    {"name": "Uyugan", "zipcode": "3903"}
                ]
            },
            {
                "name": "CAGAYAN",
                "municipalities": [
                    {"name": "Abulug", "zipcode": "3517"},
                    {"name": "Alcala", "zipcode": "3507"},
                    {"name": "Allacapan", "zipcode": "3516"},
                    {"name": "Amulung", "zipcode": "3505"},
                    {"name": "Aparri", "zipcode": "3515"},
                    {"name": "Baggao", "zipcode": "3506"},
                    {"name": "Ballesteros", "zipcode": "3516"},
                    {"name": "Buguey", "zipcode": "3511"},
                    {"name": "Calayan", "zipcode": "3520"},
                    {"name": "Camalaniugan", "zipcode": "3510"},
                    {"name": "Claveria", "zipcode": "3519"},
                    {"name": "Enrile", "zipcode": "3501"},
                    {"name": "Gattaran", "zipcode": "3508"},
                    {"name": "Gonzaga", "zipcode": "3513"},
                    {"name": "Iguig", "zipcode": "3504"},
                    {"name": "Lal-lo", "zipcode": "3509"},
                    {"name": "Lasam", "zipcode": "3521"},
                    {"name": "Pamplona", "zipcode": "3522"},
                    {"name": "Peñablanca", "zipcode": "3502"},
                    {"name": "Piat", "zipcode": "3527"},
                    {"name": "Rizal", "zipcode": "3526"},
                    {"name": "Sanchez Mira", "zipcode": "3518"},
                    {"name": "Santa Ana", "zipcode": "3514"},
                    {"name": "Santa Praxedes", "zipcode": "3524"},
                    {"name": "Santa Teresita", "zipcode": "3512"},
                    {"name": "Santo Niño (Faire)", "zipcode": "3525"},
                    {"name": "Solana", "zipcode": "3503"},
                    {"name": "Tuao", "zipcode": "3528"},
                    {"name": "Tuguegarao City", "zipcode": "3500"}
                ]
            },
            {
                "name": "ISABELA",
                "municipalities": [
                    {"name": "Alicia", "zipcode": "3306"},
                    {"name": "Angadanan", "zipcode": "3307"},
                    {"name": "Aurora", "zipcode": "3316"},
                    {"name": "Benito Soliven", "zipcode": "3331"},
                    {"name": "Burgos", "zipcode": "3322"},
                    {"name": "Cabagan", "zipcode": "3328"},
                    {"name": "Cabatuan", "zipcode": "3315"},
                    {"name": "Cauayan City", "zipcode": "3305"},
                    {"name": "Cordon", "zipcode": "3312"},
                    {"name": "Delfin Albano (Magsaysay)", "zipcode": "3326"},
                    {"name": "Dinapigue", "zipcode": "3336"},
                    {"name": "Divilacan", "zipcode": "3335"},
                    {"name": "Echague", "zipcode": "3309"},
                    {"name": "Gamu", "zipcode": "3301"},
                    {"name": "Ilagan City", "zipcode": "3300"},
                    {"name": "Jones", "zipcode": "3313"},
                    {"name": "Luna", "zipcode": "3304"},
                    {"name": "Maconacon", "zipcode": "3333"},
                    {"name": "Mallig", "zipcode": "3323"},
                    {"name": "Naguilian", "zipcode": "3302"},
                    {"name": "Palanan", "zipcode": "3334"},
                    {"name": "Quezon", "zipcode": "3324"},
                    {"name": "Quirino", "zipcode": "3319"},
                    {"name": "Ramon", "zipcode": "3319"},
                    {"name": "Reina Mercedes", "zipcode": "3303"},
                    {"name": "Roxas", "zipcode": "3320"},
                    {"name": "San Agustin", "zipcode": "3314"},
                    {"name": "San Guillermo", "zipcode": "3308"},
                    {"name": "San Isidro", "zipcode": "3310"},
                    {"name": "San Manuel", "zipcode": "3311"},
                    {"name": "San Mariano", "zipcode": "3332"},
                    {"name": "San Mateo", "zipcode": "3318"},
                    {"name": "San Pablo", "zipcode": "3329"},
                    {"name": "Santa Maria", "zipcode": "3330"},
                    {"name": "Santiago City", "zipcode": "3311"},
                    {"name": "Sto. Tomas", "zipcode": "3327"},
                    {"name": "Tumauini", "zipcode": "3321"}
                ]
            },
            {
                "name": "NUEVA VIZCAYA",
                "municipalities": [
                    {"name": "Ambaguio", "zipcode": "3701"},
                    {"name": "Aritao", "zipcode": "3704"},
                    {"name": "Bagabag", "zipcode": "3711"},
                    {"name": "Bambang", "zipcode": "3702"},
                    {"name": "Bayombong", "zipcode": "3700"},
                    {"name": "Diadi", "zipcode": "3712"},
                    {"name": "Dupax del Norte", "zipcode": "3706"},
                    {"name": "Dupax del Sur", "zipcode": "3707"},
                    {"name": "Kasibu", "zipcode": "3703"},
                    {"name": "Kayapa", "zipcode": "3708"},
                    {"name": "Quezon", "zipcode": "3713"},
                    {"name": "Santa Fe", "zipcode": "3705"},
                    {"name": "Solano", "zipcode": "3709"},
                    {"name": "Villaverde", "zipcode": "3710"}
                ]
            },
            {
                "name": "QUIRINO",
                "municipalities": [
                    {"name": "Aglipay", "zipcode": "3403"},
                    {"name": "Cabarroguis", "zipcode": "3400"},
                    {"name": "Diffun", "zipcode": "3401"},
                    {"name": "Maddela", "zipcode": "3404"},
                    {"name": "Nagtipunan", "zipcode": "3405"},
                    {"name": "Saguday", "zipcode": "3402"}
                ]
            }
        ]
    }
    
    # Sort provinces alphabetically
    region2_data["provinces"].sort(key=lambda x: x["name"])
    
    # Sort municipalities within each province alphabetically
    for province in region2_data["provinces"]:
        province["municipalities"].sort(key=lambda x: x["name"])
    
    return region2_data

def update_typescript_file():
    """Update the TypeScript file with Region II data"""
    
    # Read the current file
    with open('src/data/philippines-geography.ts', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Generate the new Region II data
    region2_data = create_region2_data()
    
    # Create the TypeScript representation
    region2_ts = generate_region_typescript(region2_data)
    
    # Find and replace the Region II section
    import re
    
    # Pattern to match the entire Region II section
    pattern = r'{\s*name:\s*"Region II – Cagayan Valley",.*?(?=^\s*},?\s*{\s*name:|\];\s*$)'
    
    # Replace the region data
    updated_content = re.sub(pattern, region2_ts, content, flags=re.DOTALL | re.MULTILINE)
    
    # Write back to file
    with open('src/data/philippines-geography.ts', 'w', encoding='utf-8') as f:
        f.write(updated_content)
    
    print("✅ Region II – Cagayan Valley data updated successfully!")
    print(f"✅ Provinces in alphabetical order: {len(region2_data['provinces'])}")
    for province in region2_data['provinces']:
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
    print("Updating Region II – Cagayan Valley data with alphabetical ordering...")
    update_typescript_file()