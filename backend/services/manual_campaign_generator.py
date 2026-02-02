"""
Manual Campaign Generator.
Generates Amazon-compliant bulk upload files for Sponsored Products Manual campaigns.
Uses official Amazon Advertising bulksheet column format.
"""

import pandas as pd
from io import BytesIO
from typing import List, Optional
from datetime import date


# Amazon Sponsored Products Bulksheet columns (official format)
BULK_COLUMNS = [
    'Product',
    'Entity',
    'Operation',
    'Campaign ID',
    'Ad Group ID',
    'Portfolio ID',
    'Ad ID',
    'Keyword ID',
    'Product Targeting ID',
    'Campaign Name',
    'Ad Group Name',
    'Start Date',
    'End Date',
    'Targeting Type',
    'State',
    'Daily Budget',
    'SKU',
    'ASIN (Informational only)',
    'Ad Group Default Bid',
    'Bid',
    'Keyword Text',
    'Match Type',
    'Bidding Strategy',
    'Placement',
    'Percentage',
]


def create_empty_row() -> dict:
    """Create an empty row with all columns."""
    return {col: '' for col in BULK_COLUMNS}


def generate_manual_campaign_row(
    campaign_name: str,
    daily_budget: float,
    bidding_strategy: str,
    start_date: date,
    portfolio_id: Optional[str] = None
) -> dict:
    """Generate a manual campaign row for bulk upload."""
    row = create_empty_row()
    row.update({
        'Product': 'Sponsored Products',
        'Entity': 'Campaign',
        'Operation': 'Create',
        'Campaign ID': campaign_name,  # Use campaign name as temporary ID for new campaigns
        'Campaign Name': campaign_name,
        'State': 'enabled',
        'Daily Budget': daily_budget,
        'Start Date': start_date.strftime('%Y%m%d'),
        'Targeting Type': 'Manual',
        'Bidding Strategy': bidding_strategy,
    })
    if portfolio_id:
        row['Portfolio ID'] = portfolio_id
    return row


def generate_bidding_adjustment_row(
    campaign_name: str,
    placement: str,
    percentage: int
) -> dict:
    """Generate a bidding adjustment row for placement bid modifiers."""
    row = create_empty_row()
    row.update({
        'Product': 'Sponsored Products',
        'Entity': 'Bidding Adjustment',
        'Operation': 'Create',
        'Campaign ID': campaign_name,
        'Campaign Name': campaign_name,
        'Placement': placement,
        'Percentage': percentage,
    })
    return row


def generate_ad_group_row(
    campaign_name: str,
    ad_group_name: str,
    default_bid: float
) -> dict:
    """Generate an ad group row for bulk upload."""
    row = create_empty_row()
    row.update({
        'Product': 'Sponsored Products',
        'Entity': 'Ad Group',
        'Operation': 'Create',
        'Campaign ID': campaign_name,
        'Ad Group ID': ad_group_name,
        'Campaign Name': campaign_name,
        'Ad Group Name': ad_group_name,
        'State': 'enabled',
        'Ad Group Default Bid': default_bid,
    })
    return row


def generate_product_ad_row(
    campaign_name: str,
    ad_group_name: str,
    sku: str
) -> dict:
    """Generate a product ad row for a SKU."""
    row = create_empty_row()
    row.update({
        'Product': 'Sponsored Products',
        'Entity': 'Product Ad',
        'Operation': 'Create',
        'Campaign ID': campaign_name,
        'Ad Group ID': ad_group_name,
        'Campaign Name': campaign_name,
        'Ad Group Name': ad_group_name,
        'State': 'enabled',
        'SKU': sku,
    })
    return row


def generate_keyword_row(
    campaign_name: str,
    ad_group_name: str,
    keyword: str,
    match_type: str,
    bid: Optional[float] = None
) -> dict:
    """Generate a keyword targeting row."""
    row = create_empty_row()
    row.update({
        'Product': 'Sponsored Products',
        'Entity': 'Keyword',
        'Operation': 'Create',
        'Campaign ID': campaign_name,
        'Ad Group ID': ad_group_name,
        'Campaign Name': campaign_name,
        'Ad Group Name': ad_group_name,
        'State': 'enabled',
        'Keyword Text': keyword,
        'Match Type': match_type,
    })
    if bid:
        row['Bid'] = bid
    return row


def generate_product_target_row(
    campaign_name: str,
    ad_group_name: str,
    asin: str,
    bid: Optional[float] = None
) -> dict:
    """Generate a product (ASIN) targeting row."""
    row = create_empty_row()
    # Format for ASIN targeting is usually 'asin="ASIN"'
    # But for "Product Targeting" entity, the value goes into "Product Targeting ID" or "Targeting Expression"
    # Actually, Amazon bulksheet for SP uses "Product Targeting ID" column for expression like 'asin="B0..."'
    
    row.update({
        'Product': 'Sponsored Products',
        'Entity': 'Product Targeting',
        'Operation': 'Create',
        'Campaign ID': campaign_name,
        'Ad Group ID': ad_group_name,
        'Campaign Name': campaign_name,
        'Ad Group Name': ad_group_name,
        'State': 'enabled',
        # Correct format for ASIN targeting expression
        'Product Targeting ID': f'asin="{asin}"', 
    })
    if bid:
        row['Bid'] = bid
    return row


def generate_manual_campaign_bulk_file(
    campaign_name: str,
    daily_budget: float,
    bidding_strategy: str,
    start_date: date,
    ad_groups: List[dict],
    portfolio: Optional[str] = None,
    placement_bid_adjustment: Optional[dict] = None
) -> BytesIO:
    """
    Generate an Amazon-compliant bulk upload file for a manual campaign.
    """
    rows = []
    
    # 1. Campaign row
    rows.append(generate_manual_campaign_row(
        campaign_name=campaign_name,
        daily_budget=daily_budget,
        bidding_strategy=bidding_strategy,
        start_date=start_date,
        portfolio_id=portfolio
    ))
    
    # 2. Bidding Adjustment rows
    if placement_bid_adjustment:
        if placement_bid_adjustment.get('top_of_search', 0) > 0:
            rows.append(generate_bidding_adjustment_row(
                campaign_name=campaign_name,
                placement='Placement Top',
                percentage=placement_bid_adjustment['top_of_search']
            ))
        if placement_bid_adjustment.get('product_pages', 0) > 0:
            rows.append(generate_bidding_adjustment_row(
                campaign_name=campaign_name,
                placement='Placement Product Page',
                percentage=placement_bid_adjustment['product_pages']
            ))
        if placement_bid_adjustment.get('rest_of_search', 0) > 0:
            rows.append(generate_bidding_adjustment_row(
                campaign_name=campaign_name,
                placement='Placement Rest Of Search',
                percentage=placement_bid_adjustment['rest_of_search']
            ))
    
    # 3. Ad Group and child rows
    for ag in ad_groups:
        ag_name = ag.get('ad_group_name', '')
        default_bid = ag.get('default_bid', 0.75)
        skus = ag.get('skus', [])
        keywords = ag.get('keywords', [])
        product_targets = ag.get('product_targets', [])
        
        # Ad Group
        rows.append(generate_ad_group_row(
            campaign_name=campaign_name,
            ad_group_name=ag_name,
            default_bid=default_bid
        ))
        
        # Product Ads (SKUs)
        for sku in skus:
            if sku and sku.strip():
                rows.append(generate_product_ad_row(
                    campaign_name=campaign_name,
                    ad_group_name=ag_name,
                    sku=sku.strip()
                ))
        
        # Keywords
        for kw in keywords:
            if kw.get('keyword'):
                rows.append(generate_keyword_row(
                    campaign_name=campaign_name,
                    ad_group_name=ag_name,
                    keyword=kw['keyword'],
                    match_type=kw.get('match_type', 'exact'),
                    bid=kw.get('bid')
                ))
                
        # Product Targets (ASINs)
        for pt in product_targets:
            if pt.get('asin'):
                rows.append(generate_product_target_row(
                    campaign_name=campaign_name,
                    ad_group_name=ag_name,
                    asin=pt['asin'],
                    bid=pt.get('bid')
                ))
    
    # Create DataFrame
    df = pd.DataFrame(rows, columns=BULK_COLUMNS)
    
    # Write to Excel
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Sponsored Products Campaigns', index=False)
    
    output.seek(0)
    return output
