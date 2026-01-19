"""
Negative Keyword and Product Target Generator.
Generates Amazon-compliant bulk upload files for negatives.
"""

import pandas as pd
from io import BytesIO
from typing import List
from services.parser import is_asin


# Amazon Bulk Upload column structure for Negative Keywords
NEGATIVE_KEYWORD_COLUMNS = [
    'Record Type',
    'Campaign ID',
    'Campaign Name',
    'Ad Group ID',
    'Ad Group Name',
    'Portfolio ID',
    'Keyword',
    'Match Type',
    'Operation',
    'Status'
]

# Amazon Bulk Upload column structure for Negative Product Targeting
NEGATIVE_PRODUCT_COLUMNS = [
    'Record Type',
    'Campaign ID',
    'Campaign Name',
    'Ad Group ID',
    'Ad Group Name',
    'Portfolio ID',
    'Product Targeting Expression',
    'Operation',
    'Status'
]


def classify_negative_type(search_term: str) -> str:
    """
    Classify whether a search term should be a negative keyword or negative product target.
    """
    if is_asin(search_term):
        return 'negative_product'
    return 'negative_keyword'


def generate_negative_keyword_row(
    campaign_name: str,
    ad_group_name: str,
    keyword: str,
    match_type: str = 'Negative Exact',
    campaign_id: str = '',
    ad_group_id: str = '',
    portfolio_id: str = ''
) -> dict:
    """Generate a row for negative keyword bulk upload."""
    return {
        'Record Type': 'Keyword',
        'Campaign ID': campaign_id,
        'Campaign Name': campaign_name,
        'Ad Group ID': ad_group_id,
        'Ad Group Name': ad_group_name,
        'Portfolio ID': portfolio_id,
        'Keyword': keyword,
        'Match Type': match_type,
        'Operation': 'Create',
        'Status': 'Enabled'
    }


def generate_negative_product_row(
    campaign_name: str,
    ad_group_name: str,
    asin: str,
    campaign_id: str = '',
    ad_group_id: str = '',
    portfolio_id: str = ''
) -> dict:
    """Generate a row for negative product targeting bulk upload."""
    # Format ASIN as product targeting expression
    targeting_expression = f'asin="{asin.upper()}"'
    
    return {
        'Record Type': 'Product Targeting',
        'Campaign ID': campaign_id,
        'Campaign Name': campaign_name,
        'Ad Group ID': ad_group_id,
        'Ad Group Name': ad_group_name,
        'Portfolio ID': portfolio_id,
        'Product Targeting Expression': targeting_expression,
        'Operation': 'Create',
        'Status': 'Enabled'
    }


def generate_negatives_bulk_file(
    selected_items: List[dict],
    use_negative_phrase: bool = False
) -> BytesIO:
    """
    Generate an Amazon-compliant bulk upload file for negative keywords and product targets.
    
    Args:
        selected_items: List of dictionaries containing:
            - customer_search_term
            - campaign_name
            - ad_group_name
            - is_asin
            - campaign_id (optional)
            - ad_group_id (optional)
            - portfolio_id (optional)
        use_negative_phrase: If True, use Negative Phrase instead of Negative Exact
    
    Returns:
        BytesIO object containing the Excel file
    """
    keyword_rows = []
    product_rows = []
    
    match_type = 'Negative Phrase' if use_negative_phrase else 'Negative Exact'
    
    for item in selected_items:
        search_term = item.get('customer_search_term', '')
        campaign_name = item.get('campaign_name', '')
        ad_group_name = item.get('ad_group_name', '')
        campaign_id = item.get('campaign_id', '')
        ad_group_id = item.get('ad_group_id', '')
        portfolio_id = item.get('portfolio_id', '')
        item_is_asin = item.get('is_asin', False)
        
        if item_is_asin:
            row = generate_negative_product_row(
                campaign_name=campaign_name,
                ad_group_name=ad_group_name,
                asin=search_term,
                campaign_id=campaign_id,
                ad_group_id=ad_group_id,
                portfolio_id=portfolio_id
            )
            product_rows.append(row)
        else:
            row = generate_negative_keyword_row(
                campaign_name=campaign_name,
                ad_group_name=ad_group_name,
                keyword=search_term,
                match_type=match_type,
                campaign_id=campaign_id,
                ad_group_id=ad_group_id,
                portfolio_id=portfolio_id
            )
            keyword_rows.append(row)
    
    # Create DataFrames
    output = BytesIO()
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        if keyword_rows:
            df_keywords = pd.DataFrame(keyword_rows, columns=NEGATIVE_KEYWORD_COLUMNS)
            df_keywords.to_excel(writer, sheet_name='Negative Keywords', index=False)
        
        if product_rows:
            df_products = pd.DataFrame(product_rows, columns=NEGATIVE_PRODUCT_COLUMNS)
            df_products.to_excel(writer, sheet_name='Negative Products', index=False)
        
        # If no data, create empty sheets with headers
        if not keyword_rows and not product_rows:
            df_empty = pd.DataFrame(columns=NEGATIVE_KEYWORD_COLUMNS)
            df_empty.to_excel(writer, sheet_name='Negative Keywords', index=False)
    
    output.seek(0)
    return output


def generate_negatives_csv(
    selected_items: List[dict],
    use_negative_phrase: bool = False
) -> BytesIO:
    """
    Generate a CSV bulk upload file for negative keywords (single sheet format).
    """
    rows = []
    match_type = 'Negative Phrase' if use_negative_phrase else 'Negative Exact'
    
    for item in selected_items:
        search_term = item.get('customer_search_term', '')
        campaign_name = item.get('campaign_name', '')
        ad_group_name = item.get('ad_group_name', '')
        item_is_asin = item.get('is_asin', False)
        
        if item_is_asin:
            rows.append({
                'Record Type': 'Product Targeting',
                'Campaign Name': campaign_name,
                'Ad Group Name': ad_group_name,
                'Product Targeting Expression': f'asin="{search_term.upper()}"',
                'Operation': 'Create',
                'Status': 'Enabled'
            })
        else:
            rows.append({
                'Record Type': 'Keyword',
                'Campaign Name': campaign_name,
                'Ad Group Name': ad_group_name,
                'Keyword': search_term,
                'Match Type': match_type,
                'Operation': 'Create',
                'Status': 'Enabled'
            })
    
    df = pd.DataFrame(rows)
    output = BytesIO()
    df.to_csv(output, index=False)
    output.seek(0)
    return output
