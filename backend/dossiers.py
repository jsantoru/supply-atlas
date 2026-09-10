"""Released research narratives, separate from manufacturing dependency claims.

Public leadership, exhibition history and system descriptions are contextual
evidence. They must not become supplier edges or quantified factory exposure.
"""
import json
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, model_validator

from .models import Evidence, StrictModel


class ResearchEntry(StrictModel):
    id: str = Field(pattern=r"^[a-z0-9-]+$")
    title: str = Field(min_length=1, max_length=180)
    text: str = Field(min_length=20, max_length=2000)
    basis: Literal["observed", "attributed", "context", "unresolved"]
    date: str = Field(min_length=1, max_length=100)
    evidence: list[Evidence] = Field(min_length=1, max_length=10)
    entity_id: str | None = None


class ResearchNetworkNode(StrictModel):
    id: str = Field(pattern=r"^[a-z0-9-]+$")
    label: str = Field(min_length=1, max_length=180)
    kind: Literal["product", "company", "organization", "program", "test-center"]


class ResearchNetworkEdge(ResearchEntry):
    source_node: str
    target_node: str
    relation_kind: Literal["industrial", "evaluation", "program"]


class ResearchNetwork(StrictModel):
    nodes: list[ResearchNetworkNode] = Field(min_length=2, max_length=30)
    edges: list[ResearchNetworkEdge] = Field(min_length=1, max_length=40)

    @model_validator(mode="after")
    def validate_relationships(self):
        node_ids = {node.id for node in self.nodes}
        if len(node_ids) != len(self.nodes):
            raise ValueError("Duplicate research network node")
        connected = set()
        for edge in self.edges:
            if edge.source_node not in node_ids or edge.target_node not in node_ids:
                raise ValueError("Research relationship references a missing node")
            if edge.source_node == edge.target_node:
                raise ValueError("Research relationship cannot connect a node to itself")
            connected.update((edge.source_node, edge.target_node))
        if connected != node_ids:
            raise ValueError("Every research network node needs a cited relationship")
        return self


class ResearchDossier(StrictModel):
    product_id: str
    reviewed: str
    subtitle: str
    introduction: str
    scope: str
    systems: list[ResearchEntry] = Field(min_length=1, max_length=10)
    timeline: list[ResearchEntry] = Field(min_length=1)
    organizations: list[ResearchEntry] = Field(min_length=1)
    people: list[ResearchEntry] = Field(min_length=1)
    manufacturing: list[ResearchEntry] = Field(min_length=1)
    assessment: list[ResearchEntry] = Field(min_length=1)
    network: ResearchNetwork | None = None

    def entries(self):
        for section in (self.systems, self.timeline, self.organizations,
                        self.people, self.manufacturing, self.assessment):
            yield from section
        if self.network:
            yield from self.network.edges


@lru_cache(maxsize=1)
def dossiers() -> dict[str, ResearchDossier]:
    path = Path(__file__).with_name("research") / "drone_dossiers.json"
    records = [ResearchDossier.model_validate(record)
               for record in json.loads(path.read_text(encoding="utf-8"))]
    if len({record.product_id for record in records}) != len(records):
        raise ValueError("Duplicate research dossier product")
    for record in records:
        entries = list(record.entries())
        if len({entry.id for entry in entries}) != len(entries):
            raise ValueError("Research entry IDs must be unique within a dossier")
    return {record.product_id: record for record in records}


def research_profile(product_id: str, data: dict) -> dict | None:
    dossier = dossiers().get(product_id)
    if dossier is None:
        return None
    source_ids = {ref.source_id for entry in dossier.entries()
                  for ref in entry.evidence}
    sources = [source for source in data["sources"] if source["id"] in source_ids]
    # Keep the narrative useful if a separately managed source is unavailable,
    # while making the missing reference visible to the client.
    return {**dossier.model_dump(mode="json"), "sources": sources,
            "missing_source_ids": sorted(source_ids - {s["id"] for s in sources})}
