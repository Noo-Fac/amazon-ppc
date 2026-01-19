"""
Export router.
Generates Amazon-compliant bulk upload files for negatives and auto campaigns.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List
from datetime import date

from models.schemas import NegativeExportRequest, AutoCampaignConfig
from services.negative_generator import generate_negatives_bulk_file
from services.campaign_generator import generate_auto_campaign_bulk_file, validate_ad_group_config
from routers.upload import sessions

router = APIRouter()


@router.post("/negatives")
async def export_negatives(request: NegativeExportRequest):
    """
    Generate and download bulk upload file for negative keywords/ASINs.
    """
    session_id = request.session_id
    results_key = f"{session_id}_results"
    
    if results_key not in sessions:
        raise HTTPException(
            status_code=404,
            detail="No analysis results found. Please run search term analysis first."
        )
    
    results_df = sessions[results_key]
    
    # Filter to selected IDs
    if request.selected_ids:
        results_df = results_df[results_df['id'].isin(request.selected_ids)]
    
    if len(results_df) == 0:
        raise HTTPException(status_code=400, detail="No items selected for export")
    
    # Convert to list of dicts for generator
    selected_items = results_df.to_dict(orient='records')
    
    # Generate bulk file
    output = generate_negatives_bulk_file(
        selected_items=selected_items,
        use_negative_phrase=request.use_negative_phrase
    )
    
    # Return as downloadable file
    filename = f"negative_keywords_{date.today().strftime('%Y%m%d')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/auto-campaign")
async def export_auto_campaign(config: AutoCampaignConfig):
    """
    Generate and download bulk upload file for an auto campaign.
    """
    # Validate ad groups
    all_errors = []
    for i, ag in enumerate(config.ad_groups):
        errors = validate_ad_group_config(ag.model_dump())
        if errors:
            all_errors.extend([f"Ad Group {i+1}: {e}" for e in errors])
    
    if all_errors:
        raise HTTPException(status_code=400, detail="; ".join(all_errors))
    
    # Generate bulk file
    output = generate_auto_campaign_bulk_file(
        campaign_name=config.campaign_name,
        daily_budget=config.daily_budget,
        bidding_strategy=config.bidding_strategy.value,
        start_date=config.start_date,
        ad_groups=[ag.model_dump() for ag in config.ad_groups],
        portfolio=config.portfolio
    )
    
    # Return as downloadable file
    safe_name = config.campaign_name.replace(' ', '_').replace('/', '_')[:50]
    filename = f"auto_campaign_{safe_name}_{date.today().strftime('%Y%m%d')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/negatives/preview")
async def preview_negatives(request: NegativeExportRequest):
    """
    Preview the negative keywords/ASINs that would be exported.
    Returns the data without generating a file.
    """
    session_id = request.session_id
    results_key = f"{session_id}_results"
    
    if results_key not in sessions:
        raise HTTPException(
            status_code=404,
            detail="No analysis results found. Please run search term analysis first."
        )
    
    results_df = sessions[results_key]
    
    # Filter to selected IDs
    if request.selected_ids:
        results_df = results_df[results_df['id'].isin(request.selected_ids)]
    
    # Group by type
    keywords = results_df[~results_df['is_asin']].to_dict(orient='records')
    asins = results_df[results_df['is_asin']].to_dict(orient='records')
    
    return {
        "total": len(results_df),
        "negative_keywords": {
            "count": len(keywords),
            "items": keywords
        },
        "negative_asins": {
            "count": len(asins),
            "items": asins
        },
        "match_type": "Negative Phrase" if request.use_negative_phrase else "Negative Exact"
    }
