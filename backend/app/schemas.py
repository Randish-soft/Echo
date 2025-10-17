from __future__ import annotations
from pydantic import BaseModel

class NoteCreate(BaseModel):
    title: str
    body: str | None = None

class NoteOut(BaseModel):
    id: int
    title: str
    body: str | None = None

    class Config:
        from_attributes = True
