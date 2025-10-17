#!/usr/bin/env python3
"""
Script to analyze existing municipality names in Region I data
"""

import csv

def analyze_municipalities():
    csv_file = r"data\geography\merged_phil_geo.csv"
    
    region_i_municipalities = set()
    
    try:
        with open(csv_file, 'r', encoding='utf-8', errors='ignore') as file:
            reader = csv.reader(file)
            next(reader)  # Skip header
            
            for row in reader:
                if len(row) >= 3 and row[0].strip() == "Ilocos Region (I)":
                    municipality = row[2].strip()
                    region_i_municipalities.add(municipality)
        
        print("Existing municipalities in Region I:")
        for municipality in sorted(region_i_municipalities):
            print(f"  - {municipality}")
        
        print(f"\nTotal unique municipalities: {len(region_i_municipalities)}")
        
    except Exception as e:
        print(f"Error reading CSV file: {e}")

if __name__ == "__main__":
    analyze_municipalities()