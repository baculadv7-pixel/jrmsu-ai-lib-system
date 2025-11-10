#!/usr/bin/env python3
"""
Script to clean up duplicate entries in the geographic database
"""

import csv
from collections import defaultdict

def cleanup_duplicates():
    csv_file = r"data\geography\merged_phil_geo.csv"
    sql_file = r"data\geography\merged_phil_geo.sql"
    ts_file = r"src\data\philippines-complete.ts"
    
    print("Cleaning up duplicate entries...")
    
    # 1. Clean CSV file
    try:
        # Read all entries
        entries = []
        with open(csv_file, 'r', encoding='utf-8', errors='ignore') as file:
            reader = csv.reader(file)
            entries = list(reader)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_entries = []
        
        for entry in entries:
            entry_tuple = tuple(entry)
            if entry_tuple not in seen:
                seen.add(entry_tuple)
                unique_entries.append(entry)
        
        # Write cleaned CSV
        with open(csv_file, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerows(unique_entries)
        
        removed_csv = len(entries) - len(unique_entries)
        print(f"CSV: Removed {removed_csv} duplicate entries ({len(unique_entries)} remaining)")
        
    except Exception as e:
        print(f"Error cleaning CSV file: {e}")
    
    # 2. Clean SQL file
    try:
        # Read SQL content
        with open(sql_file, 'r', encoding='utf-8', errors='ignore') as file:
            sql_lines = file.readlines()
        
        # Remove duplicate INSERT statements
        seen_statements = set()
        unique_lines = []
        
        for line in sql_lines:
            line_clean = line.strip()
            if line_clean.startswith('INSERT INTO'):
                if line_clean not in seen_statements:
                    seen_statements.add(line_clean)
                    unique_lines.append(line)
            else:
                unique_lines.append(line)
        
        # Write cleaned SQL
        with open(sql_file, 'w', encoding='utf-8') as file:
            file.writelines(unique_lines)
        
        removed_sql = len(sql_lines) - len(unique_lines)
        print(f"SQL: Removed {removed_sql} duplicate lines ({len(unique_lines)} remaining)")
        
    except Exception as e:
        print(f"Error cleaning SQL file: {e}")
    
    # 3. Clean TypeScript file
    try:
        # Read TypeScript content
        with open(ts_file, 'r', encoding='utf-8', errors='ignore') as file:
            ts_content = file.read()
        
        # Split content to find the data array
        lines = ts_content.split('\n')
        
        # Find data entries and remove duplicates
        seen_entries = set()
        cleaned_lines = []
        
        for line in lines:
            line_stripped = line.strip()
            if line_stripped.startswith('{ region:') and line_stripped.endswith('},'):
                if line_stripped not in seen_entries:
                    seen_entries.add(line_stripped)
                    cleaned_lines.append(line)
            else:
                cleaned_lines.append(line)
        
        # Write cleaned TypeScript
        cleaned_content = '\n'.join(cleaned_lines)
        with open(ts_file, 'w', encoding='utf-8') as file:
            file.write(cleaned_content)
        
        removed_ts = len(lines) - len(cleaned_lines)
        print(f"TypeScript: Removed {removed_ts} duplicate lines ({len(cleaned_lines)} remaining)")
        
    except Exception as e:
        print(f"Error cleaning TypeScript file: {e}")
    
    print("✅ Duplicate cleanup completed!")

if __name__ == "__main__":
    cleanup_duplicates()