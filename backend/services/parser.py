"""
File parsing service for CSV and XLSX files.
Handles Amazon Search Term Reports and Bulk Operations files.
"""

import pandas as pd
from io import BytesIO
from typing import Tuple, List, Optional
import re


# Required columns for Search Term Report
SEARCH_TERM_REQUIRED_COLUMNS = [
    'Campaign Name',
    'Ad Group Name', 
    'Targeting',
    'Match Type',
    'Customer Search Term',
    'Impressions',
    'Clicks',
    'Spend',
]

# Column name mappings for normalization
COLUMN_MAPPINGS = {
    # Sales variations
    '7 day total sales': 'Sales',
    '7 day total sales ($)': 'Sales',
    'total sales': 'Sales',
    'sales': 'Sales',
    # ACOS variations
    'total advertising cost of sales (acos)': 'ACOS',
    'acos': 'ACOS',
    'advertising cost of sales': 'ACOS',
    # ROAS variations
    'total return on advertising spend (roas)': 'ROAS',
    'roas': 'ROAS',
    'return on advertising spend': 'ROAS',
    # Orders variations
    '7 day total orders (#)': 'Orders',
    '7 day total orders': 'Orders',
    'orders': 'Orders',
    # Units variations
    '7 day total units (#)': 'Units',
    '7 day total units': 'Units',
    'units': 'Units',
    # Conversion rate
    '7 day conversion rate': 'Conversion Rate',
    'conversion rate': 'Conversion Rate',
    # CPC variations
    'cost per click (cpc)': 'CPC',
    'cpc': 'CPC',
    'average cpc': 'CPC',
    # CTR variations
    'click-thru rate (ctr)': 'CTR',
    'click-through rate': 'CTR',
    'ctr': 'CTR',
    # Portfolio
    'portfolio name': 'Portfolio',
    'portfolio': 'Portfolio',
}


def detect_file_type(filename: str) -> str:
    """Detect file type from filename extension."""
    ext = filename.lower().split('.')[-1]
    if ext == 'csv':
        return 'csv'
    elif ext in ['xlsx', 'xls']:
        return 'xlsx'
    else:
        raise ValueError(f"Unsupported file type: {ext}. Please upload CSV or XLSX files.")


def parse_file(content: bytes, filename: str) -> pd.DataFrame:
    """Parse file content into a DataFrame."""
    file_type = detect_file_type(filename)
    
    if file_type == 'csv':
        df = pd.read_csv(BytesIO(content))
    else:
        df = pd.read_excel(BytesIO(content))
    
    return df


def normalize_column_name(col: str) -> str:
    """Normalize column name for matching."""
    normalized = col.lower().strip()
    return COLUMN_MAPPINGS.get(normalized, col)


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize column names using mapping."""
    new_columns = {}
    for col in df.columns:
        normalized = col.lower().strip()
        if normalized in COLUMN_MAPPINGS:
            new_columns[col] = COLUMN_MAPPINGS[normalized]
        else:
            new_columns[col] = col
    
    return df.rename(columns=new_columns)


def validate_search_term_report(df: pd.DataFrame) -> Tuple[bool, List[str]]:
    """
    Validate that the DataFrame contains required columns for Search Term Report.
    Returns (is_valid, missing_columns).
    """
    # Normalize for comparison
    df_columns_lower = [col.lower().strip() for col in df.columns]
    
    missing = []
    for required in SEARCH_TERM_REQUIRED_COLUMNS:
        req_lower = required.lower().strip()
        if req_lower not in df_columns_lower:
            missing.append(required)
    
    return len(missing) == 0, missing


def clean_percentage(value) -> Optional[float]:
    """Clean percentage values (remove % sign, convert to float)."""
    if pd.isna(value):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        value = value.replace('%', '').replace(',', '').strip()
        try:
            return float(value)
        except ValueError:
            return None
    return None


def clean_currency(value) -> float:
    """Clean currency values (remove $, commas, convert to float)."""
    if pd.isna(value):
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        value = value.replace('$', '').replace(',', '').strip()
        try:
            return float(value)
        except ValueError:
            return 0.0
    return 0.0


def clean_integer(value) -> int:
    """Clean integer values."""
    if pd.isna(value):
        return 0
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str):
        value = value.replace(',', '').strip()
        try:
            return int(float(value))
        except ValueError:
            return 0
    return 0


def process_search_term_report(df: pd.DataFrame) -> pd.DataFrame:
    """
    Process and clean a Search Term Report DataFrame.
    Normalizes columns and cleans data types.
    """
    # Normalize column names
    df = normalize_columns(df)
    
    # Clean numeric columns
    if 'Impressions' in df.columns:
        df['Impressions'] = df['Impressions'].apply(clean_integer)
    
    if 'Clicks' in df.columns:
        df['Clicks'] = df['Clicks'].apply(clean_integer)
    
    if 'Spend' in df.columns:
        df['Spend'] = df['Spend'].apply(clean_currency)
    
    if 'Sales' in df.columns:
        df['Sales'] = df['Sales'].apply(clean_currency)
    
    if 'Orders' in df.columns:
        df['Orders'] = df['Orders'].apply(clean_integer)
    
    if 'Units' in df.columns:
        df['Units'] = df['Units'].apply(clean_integer)
    
    if 'ACOS' in df.columns:
        df['ACOS'] = df['ACOS'].apply(clean_percentage)
    
    if 'ROAS' in df.columns:
        df['ROAS'] = df['ROAS'].apply(clean_percentage)
    
    if 'CTR' in df.columns:
        df['CTR'] = df['CTR'].apply(clean_percentage)
    
    if 'CPC' in df.columns:
        df['CPC'] = df['CPC'].apply(clean_currency)
    
    if 'Conversion Rate' in df.columns:
        df['Conversion Rate'] = df['Conversion Rate'].apply(clean_percentage)
    
    # Parse date column if present
    if 'Date' in df.columns:
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    
    # Fill NaN values for numeric columns
    numeric_cols = ['Impressions', 'Clicks', 'Spend', 'Sales', 'Orders', 'Units']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = df[col].fillna(0)
    
    return df


def is_asin(value: str) -> bool:
    """Check if a value is an ASIN (starts with b0 or B0)."""
    if not isinstance(value, str):
        return False
    value = value.strip().lower()
    return value.startswith('b0') and len(value) == 10


def get_date_range(df: pd.DataFrame) -> dict:
    """Get date range from DataFrame."""
    if 'Date' not in df.columns:
        return {"start": None, "end": None}
    
    dates = df['Date'].dropna()
    if len(dates) == 0:
        return {"start": None, "end": None}
    
    return {
        "start": dates.min().strftime('%Y-%m-%d') if pd.notna(dates.min()) else None,
        "end": dates.max().strftime('%Y-%m-%d') if pd.notna(dates.max()) else None
    }


def get_unique_campaigns(df: pd.DataFrame) -> List[str]:
    """Get unique campaign names from DataFrame."""
    if 'Campaign Name' not in df.columns:
        return []
    return df['Campaign Name'].dropna().unique().tolist()


def get_unique_ad_groups(df: pd.DataFrame) -> List[str]:
    """Get unique ad group names from DataFrame."""
    if 'Ad Group Name' not in df.columns:
        return []
    return df['Ad Group Name'].dropna().unique().tolist()


def get_unique_portfolios(df: pd.DataFrame) -> List[str]:
    """Get unique portfolio names from DataFrame."""
    if 'Portfolio' not in df.columns:
        return []
    portfolios = df['Portfolio'].dropna().unique().tolist()
    return [p for p in portfolios if p and str(p).strip()]
