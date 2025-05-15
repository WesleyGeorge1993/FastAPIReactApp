from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import pandas as pd
import re
from fastapi.responses import StreamingResponse
from io import StringIO
import csv

app = FastAPI()

# Enable CORS for frontend (React at localhost:3000)
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

EXCEL_PATH = Path("Contacts.xlsx")

# Create the Excel file if it doesn't exist
if not EXCEL_PATH.exists():
    pd.DataFrame(columns=["Email"]).to_excel(EXCEL_PATH, index=False)

# Pydantic model for JSON body
class EmailInput(BaseModel):
    email: str

@app.get("/")
def welcome():
    return {"message": "Welcome to the Email Group Viewer API!"}

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
def download_csv():
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
