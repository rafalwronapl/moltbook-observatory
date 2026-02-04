#!/usr/bin/env python3
"""
Add source attribution to all CSV files in the reports directory.
This embeds Noosphere Project attribution in every data file.
"""

import os
import csv
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(__file__).parent.parent
REPORTS_DIR = PROJECT_ROOT / 'reports'
WEBSITE_REPORTS = PROJECT_ROOT / 'website' / 'public' / 'reports'

SOURCE_ID = 'noosphere_project_v1'
ATTRIBUTION = f'# Source: Noosphere Project | https://noosphereproject.com | CC-BY 4.0 | Dataset: {SOURCE_ID}'

def add_attribution_to_csv(filepath):
    """Add source comment to beginning of CSV file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip if already has attribution
        if content.startswith('# Source: Noosphere'):
            return False
        
        # Add attribution header
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(ATTRIBUTION + '\n')
            f.write(f'# Generated: {datetime.now().isoformat()}\n')
            f.write(content)
        
        return True
    except Exception as e:
        print(f'Error processing {filepath}: {e}')
        return False

def process_directory(base_dir):
    """Process all CSV files in directory tree."""
    if not base_dir.exists():
        return 0
    
    count = 0
    for csv_file in base_dir.rglob('*.csv'):
        if add_attribution_to_csv(csv_file):
            count += 1
            print(f'  Added attribution: {csv_file.name}')
    
    return count

if __name__ == '__main__':
    print('=' * 60)
    print('  Noosphere Project - Data Attribution Tool')
    print('=' * 60)
    print()
    
    total = 0
    
    print('Processing reports directory...')
    total += process_directory(REPORTS_DIR)
    
    print('Processing website reports...')
    total += process_directory(WEBSITE_REPORTS)
    
    print()
    print(f'Total files updated: {total}')
    print()
    print('Attribution added:')
    print(f'  {ATTRIBUTION}')
