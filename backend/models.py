from datetime import date
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator

class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

class Entity(StrictModel):
    id: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{0,79}$")
    kind: Literal["company", "product", "variant", "part", "category", "facility", "material", "industry", "region"]
    name: str = Field(min_length=1, max_length=160)
    description: str = Field(max_length=1800)
    aliases: list[str] = Field(default_factory=list, max_length=30)
    category_id: str | None = None
    parent_id: str | None = None
    industry_id: str | None = None
    region_id: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    precision: Literal["exact", "approximate", "unknown"] = "unknown"
    location_reference: str | None = None
    @model_validator(mode="after")
    def coordinates(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("Coordinates must be supplied together")
        if self.latitude is not None and (self.precision == "unknown" or not self.location_reference):
            raise ValueError("Coordinates require precision and a location reference")
        return self

class Source(StrictModel):
    id: str = Field(pattern=r"^[a-z0-9-]+$", max_length=80)
    title: str = Field(min_length=1, max_length=250)
    url: HttpUrl
    publisher: str = Field(min_length=1, max_length=160)
    published: date | None = None
    retrieved: date
    license: str = Field(min_length=1, max_length=300)
    terms_url: HttpUrl
    reuse: str = Field(min_length=1, max_length=1000)
    adapter: Literal["manual-reference", "raspberrypi-docs"] = "manual-reference"

class Evidence(StrictModel):
    source_id: str
    reference: str = Field(min_length=3, max_length=1000)

class Claim(StrictModel):
    id: str = Field(pattern=r"^[a-z0-9-]+$", max_length=100)
    supplier_id: str | None = None
    customer_id: str | None = None
    product_id: str | None = None
    part_id: str | None = None
    facility_id: str | None = None
    material_id: str | None = None
    variant_id: str | None = None
    region_id: str | None = None
    role: Literal["designer", "fabricator", "packager", "assembler", "distributor", "material supplier", "component supplier"]
    status: Literal["direct", "inferred", "disputed", "outdated"]
    observed_at: date
    valid_from: date | None = None
    valid_to: date | None = None
    period: str = Field(min_length=1, max_length=300)
    uncertainty: str = Field(min_length=10, max_length=2000)
    evidence: list[Evidence] = Field(min_length=1, max_length=20)
    supersedes: str | None = None
    @model_validator(mode="after")
    def semantics(self):
        if not self.product_id and not self.part_id and not self.material_id:
            raise ValueError("Claim needs a product, specific part, or material")
        if self.valid_from and self.valid_to and self.valid_from > self.valid_to:
            raise ValueError("Invalid date interval")
        return self

class Review(StrictModel):
    reason: str = Field(min_length=10, max_length=1000)
    record: dict

class Bundle(StrictModel):
    entities: list[Entity]
    sources: list[Source]
    claims: list[Claim]
