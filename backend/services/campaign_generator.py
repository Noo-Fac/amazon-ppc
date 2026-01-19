"""
Auto Campaign Generator.
Generates Amazon-compliant bulk upload files for Sponsored Products Auto campaigns.
"""

import pandas as pd
from io import BytesIO
from typing import List, Optional
from datetime import date


# Auto targeting expression types
AUTO_TARGETING_TYPES = {
    'close_match': 'close-match',
    'loose_match': 'loose-match',
    'substitutes': 'substitutes',
    'complements': 'complements'
}


def generate_campaign_row(
    campaign_name: str,
    daily_budget: float,
    bidding_strategy: str,
    start_date: date,
    portfolio: Optional[str] = None
) -> dict:
    """Generate a campaign row for bulk upload."""
    return {
        'Record Type': 'Campaign',
        'Campaign ID': '',
        'Campaign Name': campaign_name,
        'Campaign State': 'Enabled',
        'Campaign Daily Budget': daily_budget,
        'Portfolio ID': '',
        'Campaign Start Date': start_date.strftime('%Y%m%d'),
        'Campaign End Date': '',
        'Campaign Targeting Type': 'Auto',
        'Campaign Bidding Strategy': bidding_strategy,
        'Ad Group ID': '',
        'Ad Group Name': '',
        'Ad Group State': '',
        'Ad Group Default Bid': '',
        'Targeting ID': '',
        'Targeting Expression': '',
        'Targeting Expression State': '',
        'Targeting Expression Bid': '',
        'Operation': 'Create'
    }


def generate_ad_group_row(
    campaign_name: str,
    ad_group_name: str,
    default_bid: float
) -> dict:
    """Generate an ad group row for bulk upload."""
    return {
        'Record Type': 'Ad Group',
        'Campaign ID': '',
        'Campaign Name': campaign_name,
        'Campaign State': '',
        'Campaign Daily Budget': '',
        'Portfolio ID': '',
        'Campaign Start Date': '',
        'Campaign End Date': '',
        'Campaign Targeting Type': '',
        'Campaign Bidding Strategy': '',
        'Ad Group ID': '',
        'Ad Group Name': ad_group_name,
        'Ad Group State': 'Enabled',
        'Ad Group Default Bid': default_bid,
        'Targeting ID': '',
        'Targeting Expression': '',
        'Targeting Expression State': '',
        'Targeting Expression Bid': '',
        'Operation': 'Create'
    }


def generate_auto_targeting_row(
    campaign_name: str,
    ad_group_name: str,
    targeting_type: str,
    bid: Optional[float] = None
) -> dict:
    """Generate an auto targeting row for bulk upload."""
    return {
        'Record Type': 'Product Targeting',
        'Campaign ID': '',
        'Campaign Name': campaign_name,
        'Campaign State': '',
        'Campaign Daily Budget': '',
        'Portfolio ID': '',
        'Campaign Start Date': '',
        'Campaign End Date': '',
        'Campaign Targeting Type': '',
        'Campaign Bidding Strategy': '',
        'Ad Group ID': '',
        'Ad Group Name': ad_group_name,
        'Ad Group State': '',
        'Ad Group Default Bid': '',
        'Targeting ID': '',
        'Targeting Expression': f'auto-targeting={targeting_type}',
        'Targeting Expression State': 'Enabled',
        'Targeting Expression Bid': bid if bid else '',
        'Operation': 'Create'
    }


def generate_auto_campaign_bulk_file(
    campaign_name: str,
    daily_budget: float,
    bidding_strategy: str,
    start_date: date,
    ad_groups: List[dict],
    portfolio: Optional[str] = None
) -> BytesIO:
    """
    Generate an Amazon-compliant bulk upload file for an auto campaign.
    
    Args:
        campaign_name: Name of the campaign
        daily_budget: Daily budget in dollars
        bidding_strategy: Bidding strategy (e.g., 'dynamic bids - down only')
        start_date: Campaign start date
        ad_groups: List of ad group configurations, each containing:
            - ad_group_name: str
            - default_bid: float
            - close_match: bool
            - close_match_bid: Optional[float]
            - loose_match: bool
            - loose_match_bid: Optional[float]
            - substitutes: bool
            - substitutes_bid: Optional[float]
            - complements: bool
            - complements_bid: Optional[float]
        portfolio: Optional portfolio name
    
    Returns:
        BytesIO object containing the Excel file
    """
    rows = []
    
    # 1. Campaign row
    rows.append(generate_campaign_row(
        campaign_name=campaign_name,
        daily_budget=daily_budget,
        bidding_strategy=bidding_strategy,
        start_date=start_date,
        portfolio=portfolio
    ))
    
    # 2. Ad Group rows and targeting rows
    for ag in ad_groups:
        ag_name = ag.get('ad_group_name', '')
        default_bid = ag.get('default_bid', 0.75)
        
        # Add ad group row
        rows.append(generate_ad_group_row(
            campaign_name=campaign_name,
            ad_group_name=ag_name,
            default_bid=default_bid
        ))
        
        # Add auto targeting rows for enabled types
        if ag.get('close_match', False):
            rows.append(generate_auto_targeting_row(
                campaign_name=campaign_name,
                ad_group_name=ag_name,
                targeting_type='close-match',
                bid=ag.get('close_match_bid')
            ))
        
        if ag.get('loose_match', False):
            rows.append(generate_auto_targeting_row(
                campaign_name=campaign_name,
                ad_group_name=ag_name,
                targeting_type='loose-match',
                bid=ag.get('loose_match_bid')
            ))
        
        if ag.get('substitutes', False):
            rows.append(generate_auto_targeting_row(
                campaign_name=campaign_name,
                ad_group_name=ag_name,
                targeting_type='substitutes',
                bid=ag.get('substitutes_bid')
            ))
        
        if ag.get('complements', False):
            rows.append(generate_auto_targeting_row(
                campaign_name=campaign_name,
                ad_group_name=ag_name,
                targeting_type='complements',
                bid=ag.get('complements_bid')
            ))
    
    # Create DataFrame with consistent columns
    columns = [
        'Record Type',
        'Campaign ID',
        'Campaign Name',
        'Campaign State',
        'Campaign Daily Budget',
        'Portfolio ID',
        'Campaign Start Date',
        'Campaign End Date',
        'Campaign Targeting Type',
        'Campaign Bidding Strategy',
        'Ad Group ID',
        'Ad Group Name',
        'Ad Group State',
        'Ad Group Default Bid',
        'Targeting ID',
        'Targeting Expression',
        'Targeting Expression State',
        'Targeting Expression Bid',
        'Operation'
    ]
    
    df = pd.DataFrame(rows, columns=columns)
    
    # Write to Excel
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Sponsored Products', index=False)
    
    output.seek(0)
    return output


def validate_ad_group_config(ad_group: dict) -> List[str]:
    """Validate ad group configuration and return list of errors."""
    errors = []
    
    if not ad_group.get('ad_group_name'):
        errors.append('Ad group name is required')
    
    default_bid = ad_group.get('default_bid', 0)
    if default_bid < 0.02:
        errors.append('Default bid must be at least $0.02')
    
    # Check that at least one targeting type is enabled
    has_targeting = any([
        ad_group.get('close_match', False),
        ad_group.get('loose_match', False),
        ad_group.get('substitutes', False),
        ad_group.get('complements', False)
    ])
    
    if not has_targeting:
        errors.append('At least one targeting type must be enabled')
    
    return errors
