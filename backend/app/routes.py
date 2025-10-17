from __future__ import annotations
import os
import asyncio
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from .db import SessionLocal
from .models import Note
from .schemas import NoteCreate, NoteOut

router = APIRouter()

async def get_db() -> AsyncSession:
    async with SessionLocal() as session:
        yield session

@router.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    # DB ping
    await db.execute(text("SELECT 1"))
    return {"status": "ok"}

# simple CRUD over 'notes' table as a working example
@router.post("/notes", response_model=NoteOut, status_code=201)
async def create_note(payload: NoteCreate, db: AsyncSession = Depends(get_db)):
    note = Note(title=payload.title, body=payload.body)
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note

@router.get("/notes", response_model=list[NoteOut])
async def list_notes(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Note).order_by(Note.id.desc()))
    return list(res.scalars().all())

@router.get("/notes/{note_id}", response_model=NoteOut)
async def get_note(note_id: int, db: AsyncSession = Depends(get_db)):
    note = await db.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Not found")
    return note

@router.delete("/notes/{note_id}", status_code=204)
async def delete_note(note_id: int, db: AsyncSession = Depends(get_db)):
    note = await db.get(Note, note_id)
    if not note:
        return
    await db.delete(note)
    await db.commit()

# utility endpoints that use your mounted volumes / env paths
@router.get("/repos")
async def list_repos():
    base = Path(os.getenv("REPOS_PATH", "/app/data/repositories"))
    base.mkdir(parents=True, exist_ok=True)
    return {"path": str(base), "entries": sorted(p.name for p in base.iterdir())}

@router.get("/summaries")
async def list_summaries():
    base = Path(os.getenv("SUMMARIES_PATH", "/app/data/summaries"))
    base.mkdir(parents=True, exist_ok=True)
    return {"path": str(base), "entries": sorted(p.name for p in base.iterdir())}
