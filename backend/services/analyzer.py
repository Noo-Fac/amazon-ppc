"""
Search Term Analysis Engine.
Implements configurable rules for identifying underperforming search terms.
"""

import pandas as pd
from typing import List, Optional
from dataclasses import dataclass
from services.parser import is_asin


@dataclass
class AnalysisConfig:
    """Configuration for search term analysis."""
    target_acos: float = 30.0          # Target ACOS threshold (%)
    min_spend: float = 10.0            # Minimum spend for no-sales rule ($)
    max_sales: float = 0.0             # Maximum sales for no-sales rule ($)
    use_negative_phrase: bool = False   # Use Negative Phrase instead of Exact
    exclude_branded: bool = False       # Exclude branded keywords
    branded_terms: List[str] = None     # List of brand terms to exclude
    include_poor_roas: bool = False     # Include converting keywords with poor ROAS

    def __post_init__(self):
        if self.branded_terms is None:
            self.branded_terms = []


def is_branded_keyword(search_term: str, branded_terms: List[str]) -> bool:
    """Check if a search term contains any branded terms."""
    if not branded_terms:
        return False
    search_term_lower = search_term.lower()
    for brand in branded_terms:
        if brand.lower() in search_term_lower:
            return True
    return False


def apply_rule_high_acos(row: pd.Series, config: AnalysisConfig) -> bool:
    """
    Rule 1: High ACOS
    Flag if:
    - ACOS >= target_acos
    - Match Type is NOT Exact
    - Target is NOT an ASIN
    """
    acos = row.get('ACOS')
    match_type = str(row.get('Match Type', '')).lower()
    targeting = str(row.get('Targeting', ''))
    
    # Skip if ACOS is missing or zero
    if pd.isna(acos) or acos == 0:
        return False
    
    # Skip exact match
    if 'exact' in match_type:
        return False
    
    # Skip ASIN targets
    if is_asin(targeting):
        return False
    
    # Check ACOS threshold
    return acos >= config.target_acos


def apply_rule_spend_no_sales(row: pd.Series, config: AnalysisConfig) -> bool:
    """
    Rule 2: Spend Without Sales
    Flag if:
    - Spend >= min_spend
    - Sales <= max_sales
    - Match Type is NOT Exact
    - Target is NOT an ASIN
    """
    spend = row.get('Spend', 0)
    sales = row.get('Sales', 0)
    match_type = str(row.get('Match Type', '')).lower()
    targeting = str(row.get('Targeting', ''))
    
    # Skip exact match
    if 'exact' in match_type:
        return False
    
    # Skip ASIN targets
    if is_asin(targeting):
        return False
    
    # Check thresholds
    return spend >= config.min_spend and sales <= config.max_sales


def analyze_search_terms(df: pd.DataFrame, config: AnalysisConfig) -> pd.DataFrame:
    """
    Analyze search terms and flag those matching rules.
    
    Returns DataFrame with additional columns:
    - rule_triggered: Which rule flagged this term
    - is_asin: Whether the search term is an ASIN
    - negative_match_type: Suggested negative match type
    """
    results = []
    
    for idx, row in df.iterrows():
        search_term = str(row.get('Customer Search Term', ''))
        
        # Skip empty search terms
        if not search_term.strip():
            continue
        
        # Skip branded keywords if configured
        if config.exclude_branded and is_branded_keyword(search_term, config.branded_terms):
            continue
        
        # Determine the search term type
        term_is_asin = is_asin(search_term)
        
        # Apply rules
        rule = None
        
        if apply_rule_high_acos(row, config):
            rule = 'High ACOS'
        elif apply_rule_spend_no_sales(row, config):
            rule = 'Spend Without Sales'
        
        # If no rule triggered, skip
        if rule is None:
            continue
        
        # Determine negative match type
        if term_is_asin:
            negative_match_type = 'Negative Product Targeting'
        elif config.use_negative_phrase:
            negative_match_type = 'Negative Phrase'
        else:
            negative_match_type = 'Negative Exact'
        
        # Build result row
        result = {
            'id': int(idx),
            'date': row.get('Date').strftime('%Y-%m-%d') if pd.notna(row.get('Date')) else None,
            'campaign_name': str(row.get('Campaign Name', '')),
            'ad_group_name': str(row.get('Ad Group Name', '')),
            'portfolio': str(row.get('Portfolio', '')) if pd.notna(row.get('Portfolio')) else None,
            'targeting': str(row.get('Targeting', '')),
            'match_type': str(row.get('Match Type', '')),
            'customer_search_term': search_term,
            'impressions': int(row.get('Impressions', 0)),
            'clicks': int(row.get('Clicks', 0)),
            'spend': float(row.get('Spend', 0)),
            'sales': float(row.get('Sales', 0)),
            'acos': float(row.get('ACOS')) if pd.notna(row.get('ACOS')) else None,
            'orders': int(row.get('Orders', 0)),
            'rule_triggered': rule,
            'is_asin': term_is_asin,
            'negative_match_type': negative_match_type,
            'selected': True
        }
        results.append(result)
    
    return pd.DataFrame(results)


def calculate_kpis(df: pd.DataFrame) -> dict:
    """Calculate aggregated KPIs from the DataFrame."""
    total_sales = df['Sales'].sum() if 'Sales' in df.columns else 0
    ad_spend = df['Spend'].sum() if 'Spend' in df.columns else 0
    orders = int(df['Orders'].sum()) if 'Orders' in df.columns else 0
    impressions = int(df['Impressions'].sum()) if 'Impressions' in df.columns else 0
    clicks = int(df['Clicks'].sum()) if 'Clicks' in df.columns else 0
    
    # Calculate derived metrics
    roas = total_sales / ad_spend if ad_spend > 0 else 0
    acos = (ad_spend / total_sales * 100) if total_sales > 0 else 0
    ctr = (clicks / impressions * 100) if impressions > 0 else 0
    conversion_rate = (orders / clicks * 100) if clicks > 0 else 0
    avg_cpc = ad_spend / clicks if clicks > 0 else 0
    
    return {
        'total_sales': round(total_sales, 2),
        'ad_spend': round(ad_spend, 2),
        'roas': round(roas, 2),
        'acos': round(acos, 2),
        'orders': orders,
        'impressions': impressions,
        'clicks': clicks,
        'ctr': round(ctr, 2),
        'conversion_rate': round(conversion_rate, 2),
        'avg_cpc': round(avg_cpc, 2)
    }


def calculate_campaign_metrics(df: pd.DataFrame) -> List[dict]:
    """Calculate metrics grouped by campaign."""
    if 'Campaign Name' not in df.columns:
        return []
    
    grouped = df.groupby('Campaign Name').agg({
        'Impressions': 'sum',
        'Clicks': 'sum',
        'Spend': 'sum',
        'Sales': 'sum',
        'Orders': 'sum'
    }).reset_index()
    
    # Add portfolio if available
    if 'Portfolio' in df.columns:
        portfolios = df.groupby('Campaign Name')['Portfolio'].first().reset_index()
        grouped = grouped.merge(portfolios, on='Campaign Name', how='left')
    else:
        grouped['Portfolio'] = None
    
    results = []
    for _, row in grouped.iterrows():
        sales = row['Sales']
        spend = row['Spend']
        
        results.append({
            'campaign_name': row['Campaign Name'],
            'portfolio': row['Portfolio'] if pd.notna(row.get('Portfolio')) else None,
            'impressions': int(row['Impressions']),
            'clicks': int(row['Clicks']),
            'spend': round(float(spend), 2),
            'sales': round(float(sales), 2),
            'orders': int(row['Orders']),
            'acos': round((spend / sales * 100), 2) if sales > 0 else 0,
            'roas': round((sales / spend), 2) if spend > 0 else 0
        })
    
    return results


def calculate_monthly_data(df: pd.DataFrame) -> List[dict]:
    """Calculate monthly aggregated sales and spend for charts."""
    if 'Date' not in df.columns:
        return []
    
    df_copy = df.copy()
    df_copy['Month'] = df_copy['Date'].dt.to_period('M')
    
    grouped = df_copy.groupby('Month').agg({
        'Sales': 'sum',
        'Spend': 'sum'
    }).reset_index()
    
    results = []
    for _, row in grouped.iterrows():
        results.append({
            'month': str(row['Month']),
            'sales': round(float(row['Sales']), 2),
            'spend': round(float(row['Spend']), 2)
        })
    
    return sorted(results, key=lambda x: x['month'])
