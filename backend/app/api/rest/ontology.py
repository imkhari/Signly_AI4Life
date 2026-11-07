from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from app.domain.ontology.loader import (
    load_body_regions,
    load_chief_complaints,
    load_vsl_gloss,
)

router = APIRouter(prefix="/ontology", tags=["ontology"])


class OntologyResponse(BaseModel):
    chief_complaints: list[dict[str, Any]]
    body_regions: list[dict[str, Any]]
    vsl_gloss: list[dict[str, Any]]


@router.get("", response_model=OntologyResponse)
async def get_ontology() -> OntologyResponse:
    return OntologyResponse(
        chief_complaints=load_chief_complaints(),
        body_regions=load_body_regions(),
        vsl_gloss=load_vsl_gloss(),
    )
