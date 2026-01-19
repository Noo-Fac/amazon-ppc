"""
File upload router.
Handles uploading and parsing of Amazon Search Term Reports and Bulk files.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict
import uuid
import pandas as pd

from models.schemas import UploadResponse, ValidationError, FileType
from services.parser import (
    parse_file,
    validate_search_term_report,
    process_search_term_report,
    get_date_range,
    get_unique_campaigns,
    detect_file_type
)

router = APIRouter()

# In-memory session storage
# In production, this would be Redis or similar
sessions: Dict[str, pd.DataFrame] = {}


def get_session(session_id: str) -> pd.DataFrame:
    """Get DataFrame from session storage."""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a file first.")
    return sessions[session_id]


@router.post("/search-term-report", response_model=UploadResponse)
async def upload_search_term_report(file: UploadFile = File(...)):
    """
    Upload an Amazon Search Term Report (CSV or XLSX).
    Returns a session ID for subsequent API calls.
    """
    # Validate file type
    try:
        file_type = detect_file_type(file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Read file content
    content = await file.read()
    
    # Parse file
    try:
        df = parse_file(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
    
    # Validate required columns
    is_valid, missing = validate_search_term_report(df)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(missing)}"
        )
    
    # Process and clean data
    df = process_search_term_report(df)
    
    # Generate session ID and store data
    session_id = str(uuid.uuid4())
    sessions[session_id] = df
    
    # Get metadata
    date_range = get_date_range(df)
    campaigns = get_unique_campaigns(df)
    
    return UploadResponse(
        session_id=session_id,
        file_type=FileType.SEARCH_TERM_REPORT,
        row_count=len(df),
        columns=list(df.columns),
        date_range=date_range,
        campaigns=campaigns,
        message=f"Successfully uploaded {file.filename} with {len(df)} rows"
    )


@router.post("/bulk-file", response_model=UploadResponse)
async def upload_bulk_file(file: UploadFile = File(...), session_id: str = None):
    """
    Upload an Amazon Bulk Operations file (optional).
    Used for resolving Campaign IDs and Ad Group IDs.
    """
    # Validate file type
    try:
        file_type = detect_file_type(file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Read file content
    content = await file.read()
    
    # Parse file
    try:
        df = parse_file(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
    
    # Store in session (using separate key)
    bulk_session_id = session_id or str(uuid.uuid4())
    sessions[f"{bulk_session_id}_bulk"] = df
    
    return UploadResponse(
        session_id=bulk_session_id,
        file_type=FileType.BULK_FILE,
        row_count=len(df),
        columns=list(df.columns),
        campaigns=df['Campaign Name'].dropna().unique().tolist() if 'Campaign Name' in df.columns else [],
        message=f"Successfully uploaded bulk file {file.filename}"
    )


@router.post("/validate")
async def validate_file(file: UploadFile = File(...)):
    """
    Validate a file structure before full upload.
    Returns column information and validation status.
    """
    # Validate file type
    try:
        file_type = detect_file_type(file.filename)
    except ValueError as e:
        return ValidationError(
            error="Invalid file type",
            details=str(e)
        )
    
    # Read file content
    content = await file.read()
    
    # Parse file
    try:
        df = parse_file(content, file.filename)
    except Exception as e:
        return ValidationError(
            error="Failed to parse file",
            details=str(e)
        )
    
    # Check for required columns
    is_valid, missing = validate_search_term_report(df)
    
    if not is_valid:
        return ValidationError(
            error="Missing required columns",
            missing_columns=missing
        )
    
    return {
        "valid": True,
        "columns": list(df.columns),
        "row_count": len(df),
        "file_type": file_type
    }


@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session and its data."""
    if session_id in sessions:
        del sessions[session_id]
    if f"{session_id}_bulk" in sessions:
        del sessions[f"{session_id}_bulk"]
    return {"message": "Session deleted"}
