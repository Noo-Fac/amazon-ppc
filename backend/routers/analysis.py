"""
Analysis router.
Provides endpoints for KPIs, campaign metrics, and search term analysis.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List

from models.schemas import (
    KPIData,
    CampaignMetrics,
    MonthlyData,
    AnalysisConfig,
    AnalysisResponse,
    SearchTermResult,
    FilterOptions
)
from services.analyzer import (
    calculate_kpis,
    calculate_campaign_metrics,
    calculate_monthly_data,
    analyze_search_terms,
    AnalysisConfig as AnalysisConfigService
)
from services.parser import get_unique_campaigns, get_unique_ad_groups, get_unique_portfolios, get_date_range
from routers.upload import get_session, sessions

router = APIRouter()


@router.get("/kpis/{session_id}", response_model=KPIData)
async def get_kpis(
    session_id: str,
    campaign: Optional[str] = Query(None, description="Filter by campaign name"),
    ad_group: Optional[str] = Query(None, description="Filter by ad group name"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get aggregated KPI metrics for the uploaded data."""
    df = get_session(session_id)
    
    # Apply filters
    if campaign:
        df = df[df['Campaign Name'] == campaign]
    if ad_group:
        df = df[df['Ad Group Name'] == ad_group]
    if start_date:
        df = df[df['Date'] >= start_date]
    if end_date:
        df = df[df['Date'] <= end_date]
    
    kpis = calculate_kpis(df)
    return KPIData(**kpis)


@router.get("/campaigns/{session_id}", response_model=List[CampaignMetrics])
async def get_campaign_metrics(
    session_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Get campaign-level performance metrics."""
    df = get_session(session_id)
    
    # Apply date filters
    if start_date:
        df = df[df['Date'] >= start_date]
    if end_date:
        df = df[df['Date'] <= end_date]
    
    metrics = calculate_campaign_metrics(df)
    return [CampaignMetrics(**m) for m in metrics]


@router.get("/monthly/{session_id}", response_model=List[MonthlyData])
async def get_monthly_data(
    session_id: str,
    campaign: Optional[str] = Query(None)
):
    """Get monthly aggregated sales vs spend data for charts."""
    df = get_session(session_id)
    
    if campaign:
        df = df[df['Campaign Name'] == campaign]
    
    monthly = calculate_monthly_data(df)
    return [MonthlyData(**m) for m in monthly]


@router.get("/filters/{session_id}", response_model=FilterOptions)
async def get_filter_options(session_id: str):
    """Get available filter options from the uploaded data."""
    df = get_session(session_id)
    
    return FilterOptions(
        campaigns=get_unique_campaigns(df),
        ad_groups=get_unique_ad_groups(df),
        portfolios=get_unique_portfolios(df),
        date_range=get_date_range(df)
    )


@router.post("/search-terms/{session_id}", response_model=AnalysisResponse)
async def analyze_search_terms_endpoint(
    session_id: str,
    config: AnalysisConfig
):
    """
    Run search term analysis with configurable rules.
    Returns flagged search terms for negative keyword/ASIN generation.
    """
    df = get_session(session_id)
    
    # Convert Pydantic model to service config
    service_config = AnalysisConfigService(
        target_acos=config.target_acos,
        min_spend=config.min_spend,
        max_sales=config.max_sales,
        use_negative_phrase=config.use_negative_phrase,
        exclude_branded=config.exclude_branded,
        branded_terms=config.branded_terms,
        include_poor_roas=config.include_poor_roas
    )
    
    # Run analysis
    results_df = analyze_search_terms(df, service_config)
    
    # Convert to response
    results = [SearchTermResult(**row) for row in results_df.to_dict(orient='records')]
    
    # Count by type
    negative_keywords = sum(1 for r in results if not r.is_asin)
    negative_asins = sum(1 for r in results if r.is_asin)
    
    # Store results in session for export
    sessions[f"{session_id}_results"] = results_df
    
    return AnalysisResponse(
        total_flagged=len(results),
        negative_keywords=negative_keywords,
        negative_asins=negative_asins,
        results=results
    )


@router.get("/search-terms/{session_id}/data")
async def get_search_terms_data(
    session_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=200),
    campaign: Optional[str] = None,
    ad_group: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: str = Query("desc", pattern="^(asc|desc)$")
):
    """
    Get paginated search terms data for browsing.
    """
    df = get_session(session_id)
    
    # Apply filters
    if campaign:
        df = df[df['Campaign Name'] == campaign]
    if ad_group:
        df = df[df['Ad Group Name'] == ad_group]
    
    # Apply sorting
    if sort_by and sort_by in df.columns:
        df = df.sort_values(by=sort_by, ascending=(sort_order == 'asc'))
    
    # Paginate
    total = len(df)
    start = (page - 1) * page_size
    end = start + page_size
    page_df = df.iloc[start:end]
    
    return {
        "data": page_df.to_dict(orient='records'),
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }
