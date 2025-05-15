from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel
from pathlib import Path
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi.responses import StreamingResponse
from io import StringIO
import pandas as pd
import re
import csv

app = FastAPI()

# CORS setup
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["https://your-netlify-site.netlify.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
EXCEL_PATH = Path("Contacts.xlsx")
SECRET_KEY = "your_super_secret_key"  # Replace with a secure secret in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
users_db = {}  # In-memory user store: { email: { hashed_password: "..." } }

# Create Excel file if not exists
if not EXCEL_PATH.exists():
    pd.DataFrame(columns=["Email"]).to_excel(EXCEL_PATH, index=False)

# Models
class EmailInput(BaseModel):
    email: str

class RegisterInput(BaseModel):
    email: str
    password: str

# Auth helpers
def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=30))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None or email not in users_db:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expired or invalid")

# Routes
@app.get("/")
def welcome():
    return {"message": "Welcome to the Email Group Viewer API!"}

@app.post("/register")
def register_user(user: RegisterInput):
    if user.email in users_db:
        raise HTTPException(status_code=400, detail="User already exists")
    users_db[user.email] = {
        "hashed_password": get_password_hash(user.password)
    }
    return {"message": "User registered successfully"}

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_db.get(form_data.username)

    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect password")

    token = create_access_token(data={"sub": form_data.username})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/domains")
def get_domains():
    df = pd.read_excel(EXCEL_PATH)
    emails = df[df.columns[0]].dropna().astype(str)
    unique_emails = emails.str.lower().str.strip().drop_duplicates()
    domains = sorted(set(email.split("@")[-1] for email in unique_emails if "@" in email))
    return domains

@app.get("/emails/{domain}")
def get_emails(domain: str):
    df = pd.read_excel(EXCEL_PATH)
    emails = df[df.columns[0]].dropna().astype(str)
    filtered = sorted(set(e for e in emails if e.lower().strip().endswith(f"@{domain}")))
    return filtered

@app.post("/emails/{domain}/add")
def add_email(domain: str, item: EmailInput):
    email = item.email.lower().strip()

    if not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    if email.split("@")[-1] != domain:
        raise HTTPException(status_code=400, detail="Email domain mismatch")

    df = pd.read_excel(EXCEL_PATH)
    existing_emails = df[df.columns[0]].dropna().astype(str).str.lower().str.strip()

    if email in existing_emails.values:
        raise HTTPException(status_code=400, detail="Email already exists")

    new_df = pd.DataFrame([[email]], columns=[df.columns[0]])
    updated_df = pd.concat([df, new_df], ignore_index=True)
    updated_df.drop_duplicates(inplace=True)
    updated_df.to_excel(EXCEL_PATH, index=False)

    return {"message": "Email added successfully"}

@app.post("/emails/{domain}/delete")
def delete_email(domain: str, item: EmailInput):
    email = item.email.lower().strip()

    df = pd.read_excel(EXCEL_PATH)
    emails = df[df.columns[0]].dropna().astype(str).str.lower().str.strip()

    if email not in emails.values:
        raise HTTPException(status_code=404, detail="Email not found")

    updated_df = df[~emails.isin([email])]
    updated_df.to_excel(EXCEL_PATH, index=False)

    return {"message": "Email deleted successfully"}

@app.get("/download_csv")
def download_csv(current_user: str = Depends(get_current_user)):
    df = pd.read_excel(EXCEL_PATH)
    df[df.columns[0]] = df[df.columns[0]].astype(str).str.strip().str.lower()

    domain_map = {}
    for email in df[df.columns[0]]:
        if "@" in email:
            domain = email.split("@")[-1]
            domain_map.setdefault(domain, []).append(email)

    csv_buffer = StringIO()
    writer = csv.writer(csv_buffer)
    writer.writerow(["Domain", "Email"])

    for domain, emails in sorted(domain_map.items()):
        writer.writerow([domain, ""])
        for email in emails:
            writer.writerow(["", email])

    csv_buffer.seek(0)
    return StreamingResponse(
        csv_buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=emails.csv"}
    )
