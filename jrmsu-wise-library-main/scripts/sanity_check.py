"""
sanity_check.py
Performs sanity checks on the integrated Philippine geographic data system.
"""

import pandas as pd
from pathlib import Path

def run_sanity_checks():
    """Run comprehensive sanity checks on the geographic data"""
    
    print("🔍 Philippine Geographic Data Sanity Check")
    print("=" * 50)
    
    # Check if all required files exist
    required_files = [
        'data/geography/merged_phil_geo.csv',
        'data/geography/merged_phil_geo.sql',
        'src/data/philippines-complete.ts',
        'missing_zip_tasks.csv'
    ]
    
    print("📁 File Existence Check:")
    for file_path in required_files:
        path = Path(file_path)
        status = "✅" if path.exists() else "❌"
        print(f"   {status} {file_path}")
    
    # Load and analyze the main dataset
    csv_path = Path('data/geography/merged_phil_geo.csv')
    if csv_path.exists():
        print(f"\n📊 Data Analysis:")
        df = pd.read_csv(csv_path)
        
        print(f"   📝 Total Records: {len(df):,}")
        print(f"   🌏 Unique Regions: {df['region'].nunique()}")
        print(f"   🏝️ Unique Provinces: {df['province'].nunique()}")
        print(f"   🏘️ Unique Municipalities/Cities: {df['municipality_city'].nunique()}")
        print(f"   🏠 Unique Barangays: {df['barangay'].nunique()}")
        
        # ZIP code analysis
        with_zip = df[df['zipcode'] != ''].shape[0]
        without_zip = df[df['zipcode'] == ''].shape[0]
        
        print(f"   📮 Records with ZIP Code: {with_zip:,}")
        print(f"   ❌ Records without ZIP Code: {without_zip:,}")
        
        if without_zip > 0:
            zip_percentage = (with_zip / len(df)) * 100
            print(f"   📊 ZIP Code Coverage: {zip_percentage:.1f}%")
        
        # Sample regions
        print(f"\n🔍 Sample Regions (First 10):")
        regions = df['region'].unique()[:10]
        for i, region in enumerate(regions, 1):
            print(f"   {i}. {region}")
        
        # Sample provinces per region
        print(f"\n🔍 Province Distribution (Top 5 Regions):")
        region_counts = df['region'].value_counts().head(5)
        for region, count in region_counts.items():
            provinces = df[df['region'] == region]['province'].nunique()
            print(f"   {region}: {provinces} provinces, {count:,} total records")
        
        # Check for data quality issues
        print(f"\n⚠️  Data Quality Issues:")
        
        # Empty fields
        empty_regions = df[df['region'] == ''].shape[0]
        empty_provinces = df[df['province'] == ''].shape[0]
        empty_municipalities = df[df['municipality_city'] == ''].shape[0]
        empty_barangays = df[df['barangay'] == ''].shape[0]
        
        if empty_regions > 0:
            print(f"   ❌ {empty_regions:,} records with empty region")
        if empty_provinces > 0:
            print(f"   ❌ {empty_provinces:,} records with empty province")
        if empty_municipalities > 0:
            print(f"   ❌ {empty_municipalities:,} records with empty municipality/city")
        if empty_barangays > 0:
            print(f"   ❌ {empty_barangays:,} records with empty barangay")
        
        if all(x == 0 for x in [empty_regions, empty_provinces, empty_municipalities, empty_barangays]):
            print("   ✅ No empty required fields found")
        
        # Verify PSGC structure expectations
        print(f"\n✅ PSGC Structure Validation:")
        
        # Philippines should have approximately these counts
        expected_regions = 17  # 17 regions in Philippines
        expected_provinces = 81  # 81 provinces
        
        actual_regions = df['region'].nunique()
        actual_provinces = df['province'].nunique()
        
        if actual_regions >= expected_regions - 3 and actual_regions <= expected_regions + 3:
            print(f"   ✅ Region count ({actual_regions}) is within expected range")
        else:
            print(f"   ⚠️  Region count ({actual_regions}) may be off (expected ~{expected_regions})")
        
        if actual_provinces >= expected_provinces - 10 and actual_provinces <= expected_provinces + 10:
            print(f"   ✅ Province count ({actual_provinces}) is within expected range")
        else:
            print(f"   ⚠️  Province count ({actual_provinces}) may be off (expected ~{expected_provinces})")
    
    else:
        print(f"\n❌ CSV file not found: {csv_path}")
    
    # Check TypeScript file structure
    ts_path = Path('src/data/philippines-complete.ts')
    if ts_path.exists():
        print(f"\n📄 TypeScript File Check:")
        with open(ts_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Check for required exports
        required_exports = [
            'export const regions',
            'export const getAllRegions',
            'export const getProvincesByRegion',
            'export const getMunicipalitiesByProvince',
            'export const getBarangaysByMunicipality',
            'export const getZipCode'
        ]
        
        for export in required_exports:
            if export in content:
                print(f"   ✅ {export}")
            else:
                print(f"   ❌ Missing: {export}")
        
        # Check file size
        size_mb = ts_path.stat().st_size / (1024 * 1024)
        print(f"   📊 TypeScript file size: {size_mb:.1f} MB")
        
        if size_mb > 10:
            print(f"   ⚠️  Large TypeScript file - consider code splitting")
        else:
            print(f"   ✅ File size is reasonable")
    
    else:
        print(f"\n❌ TypeScript file not found: {ts_path}")
    
    # Check missing ZIP tasks file
    missing_zip_path = Path('missing_zip_tasks.csv')
    if missing_zip_path.exists():
        print(f"\n📋 Missing ZIP Tasks File:")
        missing_df = pd.read_csv(missing_zip_path)
        print(f"   📊 Records needing ZIP codes: {len(missing_df):,}")
        
        if len(missing_df) > 0:
            # Sample missing ZIP records
            print(f"   🔍 Sample records needing ZIP codes:")
            for i, row in missing_df.head(5).iterrows():
                print(f"     - {row['region']} → {row['province']} → {row['municipality_city']} → {row['barangay']}")
    
    print(f"\n✅ Sanity check complete!")
    
    # Generate summary for database import
    print(f"\n🗃️  Database Import Summary:")
    print(f"   SQL File: data/geography/merged_phil_geo.sql")
    print(f"   Table: philippine_geo")
    print(f"   Recommended indexes: region, province, municipality_city, barangay, zipcode")

if __name__ == "__main__":
    run_sanity_checks()