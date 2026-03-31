from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from typing import List

router = APIRouter(prefix="/community", tags=["School Square"])

@router.get("/posts", response_model=List[schemas.CommunityPostResponse])
def get_posts(db: Session = Depends(get_db)):
    return db.query(models.CommunityPost).order_by(models.CommunityPost.created_at.desc()).all()

@router.post("/post")
def create_post(title: str, content: str, image_url: str = None, db: Session = Depends(get_db)):
    # Note: In production, we'd get the admin_id from the login token
    new_post = models.CommunityPost(
        author_id=1, # Default to Master Admin
        title=title,
        content=content,
        image_url=image_url
    )
    db.add(new_post)
    db.commit()
    return {"message": "Update posted to School Square!"}

@router.post("/comment/{post_id}")
def add_comment(post_id: int, text: str, db: Session = Depends(get_db)):
    comment = models.Comment(post_id=post_id, user_id=1, text=text)
    db.add(comment)
    db.commit()
    return {"message": "Comment added"}