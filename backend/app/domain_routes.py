import math
import random
from datetime import date, datetime, timedelta, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from .database import get_db
from .models import (
    AnomalyAlert,
    Appointment,
    CarePlan,
    ClinicalMessage,
    ConsultationNote,
    DoctorProfile,
    MedicalDocument,
    SymptomRecord,
    User,
    WearableDevice,
    WearableReading,
)
from .security import get_current_user


router = APIRouter(prefix="/api/v1", tags=["connected-care"])
Db = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(user: User, role: str) -> None:
    if user.role != role:
        raise HTTPException(status_code=403, detail=f"A {role} account is required.")


def iso(value):
    return value.isoformat() if value else None


def symptom_dict(record: SymptomRecord) -> dict:
    return {
        "id": record.id,
        "symptoms": record.symptoms,
        "severity": record.severity,
        "onsetDate": iso(record.onset_date),
        "duration": record.duration,
        "notes": record.notes,
        "status": record.status,
        "archived": record.archived,
        "createdAt": iso(record.created_at),
    }


def reading_dict(reading: WearableReading) -> dict:
    return {
        "id": reading.id,
        "recordedAt": iso(reading.recorded_at),
        "heartRate": reading.heart_rate,
        "spo2": reading.spo2,
        "bodyTemperature": reading.body_temperature,
        "steps": reading.steps,
        "sleepHours": reading.sleep_hours,
        "systolic": reading.systolic,
        "diastolic": reading.diastolic,
        "scenario": reading.scenario,
    }


def alert_dict(alert: AnomalyAlert) -> dict:
    return {
        "id": alert.id,
        "metric": alert.metric,
        "observedValue": alert.observed_value,
        "threshold": alert.threshold,
        "severity": alert.severity,
        "message": alert.message,
        "acknowledged": alert.acknowledged,
        "createdAt": iso(alert.created_at),
    }


def doctor_dict(user: User) -> dict:
    profile = user.doctor_profile
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "specialty": user.specialization or "General Physician",
        "registrationNumber": user.registration_number,
        "isVerified": user.is_verified,
        "hospital": profile.hospital if profile else "VitalSync Demo Clinic",
        "city": profile.city if profile else "",
        "latitude": profile.latitude if profile else None,
        "longitude": profile.longitude if profile else None,
        "consultationFee": float(profile.consultation_fee) if profile and profile.consultation_fee else None,
        "bio": profile.bio if profile else "",
        "availability": profile.availability if profile else {},
    }


def document_metadata(document: MedicalDocument) -> dict:
    return {
        "id": document.id,
        "title": document.title,
        "category": document.category,
        "documentDate": iso(document.document_date),
        "notes": document.notes,
        "fileName": document.file_name,
        "fileType": document.file_type,
        "fileSize": document.file_size,
        "uploadedAt": iso(document.uploaded_at),
    }


def appointment_dict(database: Session, appointment: Appointment) -> dict:
    patient = database.get(User, appointment.patient_id)
    doctor = database.get(User, appointment.doctor_id)
    return {
        "id": appointment.id,
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "email": patient.email,
            "phone": patient.phone,
        },
        "assignedDoctorId": doctor.id,
        "assignedDoctorName": doctor.name,
        "assignedDoctorEmail": doctor.email,
        "doctorSpecialty": doctor.specialization or "General Physician",
        "facilityName": appointment.facility_name,
        "facilityType": appointment.facility_type,
        "city": appointment.city,
        "address": appointment.address,
        "date": iso(appointment.appointment_date),
        "time": appointment.appointment_time,
        "reason": appointment.reason,
        "status": appointment.status,
        "consent": appointment.consent,
        "sharedHealthData": appointment.shared_snapshot,
        "createdAt": iso(appointment.created_at),
        "reviewedAt": iso(appointment.reviewed_at),
    }


class SymptomCreate(BaseModel):
    symptoms: list[str] = Field(min_length=1, max_length=12)
    severity: int = Field(ge=1, le=10)
    onset_date: date
    duration: str = Field(max_length=80)
    notes: str = Field(default="", max_length=2000)


class SymptomUpdate(BaseModel):
    status: Literal["Ongoing", "Resolved"] | None = None
    archived: bool | None = None


@router.get("/symptoms")
def list_symptoms(user: CurrentUser, database: Db):
    require_role(user, "patient")
    records = database.scalars(
        select(SymptomRecord)
        .where(SymptomRecord.patient_id == user.id)
        .order_by(SymptomRecord.created_at.desc())
    ).all()
    return [symptom_dict(record) for record in records]


@router.post("/symptoms", status_code=201)
def create_symptom(payload: SymptomCreate, user: CurrentUser, database: Db):
    require_role(user, "patient")
    record = SymptomRecord(
        patient_id=user.id,
        symptoms=[item.strip() for item in payload.symptoms if item.strip()],
        severity=payload.severity,
        onset_date=payload.onset_date,
        duration=payload.duration.strip(),
        notes=payload.notes.strip(),
    )
    database.add(record)
    database.commit()
    database.refresh(record)
    return symptom_dict(record)


@router.patch("/symptoms/{record_id}")
def update_symptom(record_id: int, payload: SymptomUpdate, user: CurrentUser, database: Db):
    record = database.get(SymptomRecord, record_id)
    if not record or record.patient_id != user.id:
        raise HTTPException(status_code=404, detail="Symptom record not found.")
    if payload.status is not None:
        record.status = payload.status
    if payload.archived is not None:
        record.archived = payload.archived
    database.commit()
    database.refresh(record)
    return symptom_dict(record)


@router.delete("/symptoms/{record_id}", status_code=204)
def delete_symptom(record_id: int, user: CurrentUser, database: Db):
    record = database.get(SymptomRecord, record_id)
    if not record or record.patient_id != user.id:
        raise HTTPException(status_code=404, detail="Symptom record not found.")
    database.delete(record)
    database.commit()
    return Response(status_code=204)


SCENARIOS = {
    "normal": {"heart_rate": 76, "spo2": 98, "temp": 36.7, "sleep": 7.2, "sys": 118, "dia": 76},
    "elevated_heart_rate": {"heart_rate": 112, "spo2": 97, "temp": 36.8, "sleep": 6.4, "sys": 132, "dia": 84},
    "low_spo2": {"heart_rate": 96, "spo2": 91, "temp": 36.9, "sleep": 6.1, "sys": 126, "dia": 80},
    "fever": {"heart_rate": 102, "spo2": 96, "temp": 38.4, "sleep": 5.8, "sys": 124, "dia": 79},
    "poor_sleep": {"heart_rate": 88, "spo2": 97, "temp": 36.7, "sleep": 3.9, "sys": 128, "dia": 82},
    "high_stress": {"heart_rate": 106, "spo2": 97, "temp": 37.0, "sleep": 5.0, "sys": 146, "dia": 94},
}


class DeviceUpdate(BaseModel):
    connected: bool = True
    scenario: str = "normal"


def create_alerts(database: Session, reading: WearableReading) -> list[AnomalyAlert]:
    rules = []
    if reading.heart_rate > 100:
        rules.append(("Heart rate", reading.heart_rate, "> 100 BPM", "medium", "Elevated heart rate in the simulated reading."))
    if reading.spo2 < 94:
        rules.append(("Blood oxygen", reading.spo2, "< 94%", "high", "Low blood oxygen in the simulated reading."))
    if reading.body_temperature >= 38:
        rules.append(("Body temperature", reading.body_temperature, ">= 38°C", "medium", "Fever-range temperature in the simulated reading."))
    if reading.systolic >= 140 or reading.diastolic >= 90:
        rules.append(("Blood pressure", reading.systolic, ">= 140/90", "medium", "High blood-pressure pattern in the simulated reading."))
    if reading.sleep_hours < 5:
        rules.append(("Sleep", reading.sleep_hours, "< 5 hours", "low", "Short sleep duration in the simulated reading."))
    alerts = []
    for metric, value, threshold, severity, message in rules:
        alert = AnomalyAlert(
            patient_id=reading.patient_id,
            reading_id=reading.id,
            metric=metric,
            observed_value=value,
            threshold=threshold,
            severity=severity,
            message=message,
        )
        database.add(alert)
        alerts.append(alert)
    return alerts


@router.get("/wearables")
def wearable_state(user: CurrentUser, database: Db):
    require_role(user, "patient")
    device = database.scalar(select(WearableDevice).where(WearableDevice.patient_id == user.id))
    readings = database.scalars(
        select(WearableReading).where(WearableReading.patient_id == user.id)
        .order_by(WearableReading.recorded_at.desc()).limit(48)
    ).all()
    alerts = database.scalars(
        select(AnomalyAlert).where(AnomalyAlert.patient_id == user.id)
        .order_by(AnomalyAlert.created_at.desc()).limit(30)
    ).all()
    return {
        "device": None if not device else {
            "id": device.id, "name": device.name, "status": device.status,
            "scenario": device.scenario, "lastSyncAt": iso(device.last_sync_at),
        },
        "latest": reading_dict(readings[0]) if readings else None,
        "readings": [reading_dict(item) for item in reversed(readings)],
        "alerts": [alert_dict(item) for item in alerts],
        "simulated": True,
        "scenarios": list(SCENARIOS),
    }


@router.post("/wearables/device")
def update_device(payload: DeviceUpdate, user: CurrentUser, database: Db):
    require_role(user, "patient")
    if payload.scenario not in SCENARIOS:
        raise HTTPException(status_code=422, detail="Unknown simulation scenario.")
    device = database.scalar(select(WearableDevice).where(WearableDevice.patient_id == user.id))
    if not device:
        device = WearableDevice(patient_id=user.id)
        database.add(device)
    device.status = "connected" if payload.connected else "disconnected"
    device.scenario = payload.scenario
    database.commit()
    return wearable_state(user, database)


@router.post("/wearables/sync")
def sync_wearable(user: CurrentUser, database: Db):
    require_role(user, "patient")
    device = database.scalar(select(WearableDevice).where(WearableDevice.patient_id == user.id))
    if not device or device.status != "connected":
        raise HTTPException(status_code=409, detail="Connect the simulated band first.")
    base = SCENARIOS[device.scenario]
    now = datetime.now(timezone.utc)
    existing_count = database.scalar(
        select(WearableReading.id).where(WearableReading.patient_id == user.id).limit(1)
    )
    count = 12 if existing_count is None else 1
    for offset in reversed(range(count)):
        rng = random.Random(f"{user.id}-{device.scenario}-{now.date()}-{offset}-{now.hour}")
        reading = WearableReading(
            patient_id=user.id,
            recorded_at=now - timedelta(hours=offset),
            heart_rate=base["heart_rate"] + rng.randint(-4, 4),
            spo2=round(base["spo2"] + rng.uniform(-0.5, 0.5), 1),
            body_temperature=round(base["temp"] + rng.uniform(-0.2, 0.2), 1),
            steps=max(0, 6200 + rng.randint(-1200, 1600) - offset * 100),
            sleep_hours=round(max(0, base["sleep"] + rng.uniform(-0.3, 0.3)), 1),
            systolic=base["sys"] + rng.randint(-4, 4),
            diastolic=base["dia"] + rng.randint(-3, 3),
            scenario=device.scenario,
        )
        database.add(reading)
        database.flush()
        create_alerts(database, reading)
    device.last_sync_at = now
    database.commit()
    return wearable_state(user, database)


@router.patch("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, user: CurrentUser, database: Db):
    alert = database.get(AnomalyAlert, alert_id)
    if not alert or alert.patient_id != user.id:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.acknowledged = True
    database.commit()
    return alert_dict(alert)


@router.get("/doctors")
def list_doctors(user: CurrentUser, database: Db, city: str | None = None):
    doctors = database.scalars(select(User).where(User.role == "doctor").order_by(User.name)).all()
    values = [doctor_dict(doctor) for doctor in doctors]
    if city:
        matching = [item for item in values if city.casefold() in item["city"].casefold() or not item["city"]]
        values = matching
    return values


class DoctorProfileUpdate(BaseModel):
    hospital: str = Field(default="", max_length=180)
    city: str = Field(default="", max_length=120)
    latitude: float | None = None
    longitude: float | None = None
    consultation_fee: float | None = Field(default=None, ge=0)
    bio: str = Field(default="", max_length=1200)
    availability: dict[str, list[str]] = Field(default_factory=dict)
    specialty: str = Field(default="", max_length=120)


@router.get("/doctor/profile")
def get_doctor_profile(user: CurrentUser):
    require_role(user, "doctor")
    return doctor_dict(user)


@router.put("/doctor/profile")
def put_doctor_profile(payload: DoctorProfileUpdate, user: CurrentUser, database: Db):
    require_role(user, "doctor")
    profile = user.doctor_profile or DoctorProfile(user_id=user.id)
    database.add(profile)
    profile.hospital = payload.hospital.strip()
    profile.city = payload.city.strip()
    profile.latitude = payload.latitude
    profile.longitude = payload.longitude
    profile.consultation_fee = payload.consultation_fee
    profile.bio = payload.bio.strip()
    profile.availability = payload.availability
    if payload.specialty.strip():
        user.specialization = payload.specialty.strip()
    database.commit()
    database.refresh(user)
    return doctor_dict(user)


class AppointmentCreate(BaseModel):
    doctor_id: int
    facility_name: str = Field(max_length=180)
    facility_type: str = Field(default="Healthcare facility", max_length=80)
    city: str = Field(default="", max_length=180)
    address: str = Field(default="", max_length=300)
    date: date
    time: str = Field(max_length=20)
    reason: str = Field(default="", max_length=2000)
    consent: dict[str, bool] = Field(default_factory=dict)
    selected_document_ids: list[int] = Field(default_factory=list)
    written_summary: str = Field(default="", max_length=3000)
    chat_summary: str = Field(default="", max_length=4000)


def build_snapshot(database: Session, patient: User, payload: AppointmentCreate) -> dict:
    consent = payload.consent
    snapshot = {"consentedAt": iso(datetime.now(timezone.utc)), "categories": consent}
    if consent.get("profile"):
        snapshot["profile"] = {
            "name": patient.name, "email": patient.email, "phone": patient.phone,
            "dateOfBirth": iso(patient.date_of_birth),
        }
    if consent.get("symptoms") or consent.get("healthHistory"):
        records = database.scalars(
            select(SymptomRecord).where(SymptomRecord.patient_id == patient.id)
            .order_by(SymptomRecord.created_at.desc()).limit(100)
        ).all()
        values = [symptom_dict(item) for item in records]
        if consent.get("symptoms"):
            snapshot["symptoms"] = [item for item in values if not item["archived"]]
        if consent.get("healthHistory"):
            snapshot["healthHistory"] = values
    if consent.get("wearableData"):
        readings = database.scalars(
            select(WearableReading).where(WearableReading.patient_id == patient.id)
            .order_by(WearableReading.recorded_at.desc()).limit(24)
        ).all()
        snapshot["wearableReadings"] = [reading_dict(item) for item in readings]
    if consent.get("alerts"):
        alerts = database.scalars(
            select(AnomalyAlert).where(AnomalyAlert.patient_id == patient.id)
            .order_by(AnomalyAlert.created_at.desc()).limit(20)
        ).all()
        snapshot["alerts"] = [alert_dict(item) for item in alerts]
    if consent.get("medicalDocuments") and payload.selected_document_ids:
        documents = database.scalars(
            select(MedicalDocument).where(
                MedicalDocument.patient_id == patient.id,
                MedicalDocument.id.in_(payload.selected_document_ids),
            )
        ).all()
        snapshot["medicalDocuments"] = [document_metadata(item) for item in documents]
    if consent.get("writtenSummary"):
        snapshot["writtenSummary"] = payload.written_summary.strip()
    if consent.get("chatSummary"):
        snapshot["chatSummary"] = payload.chat_summary.strip()
    return snapshot


@router.get("/appointments")
def list_appointments(user: CurrentUser, database: Db):
    condition = Appointment.patient_id == user.id if user.role == "patient" else Appointment.doctor_id == user.id
    values = database.scalars(select(Appointment).where(condition).order_by(Appointment.created_at.desc())).all()
    return [appointment_dict(database, item) for item in values]


@router.post("/appointments", status_code=201)
def create_appointment(payload: AppointmentCreate, user: CurrentUser, database: Db):
    require_role(user, "patient")
    doctor = database.get(User, payload.doctor_id)
    if not doctor or doctor.role != "doctor":
        raise HTTPException(status_code=404, detail="Doctor not found.")
    if payload.date < date.today():
        raise HTTPException(status_code=422, detail="Choose today or a future date.")
    appointment = Appointment(
        patient_id=user.id,
        doctor_id=doctor.id,
        facility_name=payload.facility_name.strip(),
        facility_type=payload.facility_type.strip(),
        city=payload.city.strip(),
        address=payload.address.strip(),
        appointment_date=payload.date,
        appointment_time=payload.time.strip(),
        reason=payload.reason.strip(),
        consent=payload.consent,
        shared_snapshot=build_snapshot(database, user, payload),
    )
    database.add(appointment)
    database.commit()
    database.refresh(appointment)
    return appointment_dict(database, appointment)


class AppointmentStatus(BaseModel):
    status: Literal["Accepted", "Declined", "Completed", "Cancelled"]


@router.patch("/appointments/{appointment_id}/status")
def update_appointment_status(appointment_id: int, payload: AppointmentStatus, user: CurrentUser, database: Db):
    appointment = database.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    allowed = appointment.doctor_id == user.id or (
        appointment.patient_id == user.id and payload.status == "Cancelled"
    )
    if not allowed:
        raise HTTPException(status_code=403, detail="You cannot update this appointment.")
    appointment.status = payload.status
    appointment.reviewed_at = datetime.now(timezone.utc)
    database.commit()
    return appointment_dict(database, appointment)


@router.get("/doctor/patients")
def doctor_patients(user: CurrentUser, database: Db):
    require_role(user, "doctor")
    patient_ids = database.scalars(select(Appointment.patient_id).where(Appointment.doctor_id == user.id).distinct()).all()
    values = []
    for patient_id in patient_ids:
        patient = database.get(User, patient_id)
        if patient:
            values.append({"id": patient.id, "name": patient.name, "email": patient.email, "phone": patient.phone, "createdAt": iso(patient.created_at)})
    return values


def require_relationship(database: Session, doctor_id: int, patient_id: int) -> None:
    exists = database.scalar(
        select(Appointment.id).where(Appointment.doctor_id == doctor_id, Appointment.patient_id == patient_id).limit(1)
    )
    if not exists:
        raise HTTPException(status_code=403, detail="No appointment relationship exists.")


@router.get("/doctor/patients/{patient_id}")
def patient_workspace(patient_id: int, user: CurrentUser, database: Db):
    require_role(user, "doctor")
    require_relationship(database, user.id, patient_id)
    patient = database.get(User, patient_id)
    appointments = database.scalars(
        select(Appointment).where(Appointment.doctor_id == user.id, Appointment.patient_id == patient_id)
        .order_by(Appointment.created_at.desc())
    ).all()
    notes = database.scalars(
        select(ConsultationNote).where(ConsultationNote.doctor_id == user.id, ConsultationNote.patient_id == patient_id)
        .order_by(ConsultationNote.created_at.desc())
    ).all()
    plans = database.scalars(
        select(CarePlan).where(CarePlan.doctor_id == user.id, CarePlan.patient_id == patient_id)
        .order_by(CarePlan.created_at.desc())
    ).all()
    return {
        "patient": {"id": patient.id, "name": patient.name, "email": patient.email, "phone": patient.phone},
        "appointments": [appointment_dict(database, item) for item in appointments],
        "notes": [{"id": item.id, "text": item.text, "createdAt": iso(item.created_at), "doctorName": user.name} for item in notes],
        "carePlans": [{"id": item.id, "title": item.title, "details": item.details, "dueDate": iso(item.due_date), "status": item.status, "createdAt": iso(item.created_at), "doctorName": user.name} for item in plans],
    }


class NoteCreate(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


@router.post("/doctor/patients/{patient_id}/notes", status_code=201)
def add_note(patient_id: int, payload: NoteCreate, user: CurrentUser, database: Db):
    require_role(user, "doctor")
    require_relationship(database, user.id, patient_id)
    note = ConsultationNote(patient_id=patient_id, doctor_id=user.id, text=payload.text.strip())
    database.add(note)
    database.commit()
    database.refresh(note)
    return {"id": note.id, "text": note.text, "createdAt": iso(note.created_at), "doctorName": user.name}


class CarePlanCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    details: str = Field(min_length=1, max_length=4000)
    due_date: date | None = None


@router.post("/doctor/patients/{patient_id}/care-plans", status_code=201)
def add_care_plan(patient_id: int, payload: CarePlanCreate, user: CurrentUser, database: Db):
    require_role(user, "doctor")
    require_relationship(database, user.id, patient_id)
    plan = CarePlan(patient_id=patient_id, doctor_id=user.id, title=payload.title.strip(), details=payload.details.strip(), due_date=payload.due_date)
    database.add(plan)
    database.commit()
    database.refresh(plan)
    return {"id": plan.id, "title": plan.title, "details": plan.details, "dueDate": iso(plan.due_date), "status": plan.status, "createdAt": iso(plan.created_at), "doctorName": user.name}


class CarePlanStatus(BaseModel):
    status: Literal["Active", "Completed"]


@router.patch("/care-plans/{plan_id}")
def update_care_plan(plan_id: int, payload: CarePlanStatus, user: CurrentUser, database: Db):
    plan = database.get(CarePlan, plan_id)
    if not plan or plan.doctor_id != user.id:
        raise HTTPException(status_code=404, detail="Care-plan item not found.")
    plan.status = payload.status
    database.commit()
    return {"id": plan.id, "status": plan.status}


@router.get("/care-plans")
def patient_care_plans(user: CurrentUser, database: Db):
    require_role(user, "patient")
    plans = database.scalars(select(CarePlan).where(CarePlan.patient_id == user.id).order_by(CarePlan.created_at.desc())).all()
    return [{"id": item.id, "title": item.title, "details": item.details, "dueDate": iso(item.due_date), "status": item.status, "createdAt": iso(item.created_at), "doctorName": database.get(User, item.doctor_id).name} for item in plans]


def contact_pairs(database: Session, user: User) -> list[dict]:
    condition = Appointment.patient_id == user.id if user.role == "patient" else Appointment.doctor_id == user.id
    appointments = database.scalars(select(Appointment).where(condition)).all()
    seen = set()
    contacts = []
    for item in appointments:
        other_id = item.doctor_id if user.role == "patient" else item.patient_id
        if other_id in seen:
            continue
        seen.add(other_id)
        other = database.get(User, other_id)
        contacts.append({"id": other.id, "name": other.name, "email": other.email, "role": other.role, "specialty": other.specialization})
    return contacts


@router.get("/messages/contacts")
def message_contacts(user: CurrentUser, database: Db):
    return contact_pairs(database, user)


@router.get("/messages/{contact_id}")
def list_messages(contact_id: int, user: CurrentUser, database: Db):
    patient_id, doctor_id = (user.id, contact_id) if user.role == "patient" else (contact_id, user.id)
    require_relationship(database, doctor_id, patient_id)
    messages = database.scalars(
        select(ClinicalMessage).where(ClinicalMessage.patient_id == patient_id, ClinicalMessage.doctor_id == doctor_id)
        .order_by(ClinicalMessage.created_at)
    ).all()
    return [{"id": item.id, "senderId": item.sender_id, "senderName": database.get(User, item.sender_id).name, "text": item.text, "createdAt": iso(item.created_at)} for item in messages]


class MessageCreate(BaseModel):
    contact_id: int
    text: str = Field(min_length=1, max_length=1500)


@router.post("/messages", status_code=201)
def send_message(payload: MessageCreate, user: CurrentUser, database: Db):
    patient_id, doctor_id = (user.id, payload.contact_id) if user.role == "patient" else (payload.contact_id, user.id)
    require_relationship(database, doctor_id, patient_id)
    message = ClinicalMessage(patient_id=patient_id, doctor_id=doctor_id, sender_id=user.id, text=payload.text.strip())
    database.add(message)
    database.commit()
    database.refresh(message)
    return {"id": message.id, "senderId": message.sender_id, "senderName": user.name, "text": message.text, "createdAt": iso(message.created_at)}


@router.get("/documents")
def list_documents(user: CurrentUser, database: Db):
    require_role(user, "patient")
    documents = database.scalars(select(MedicalDocument).where(MedicalDocument.patient_id == user.id).order_by(MedicalDocument.uploaded_at.desc())).all()
    return [document_metadata(item) for item in documents]


@router.post("/documents", status_code=201)
async def upload_document(
    user: CurrentUser,
    database: Db,
    title: Annotated[str, Form(max_length=180)],
    category: Annotated[str, Form(max_length=80)],
    document_date: Annotated[date | None, Form()] = None,
    notes: Annotated[str, Form(max_length=2000)] = "",
    file: UploadFile = File(...),
):
    require_role(user, "patient")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Files are limited to 10 MB in this demo.")
    if file.content_type not in {"application/pdf", "image/jpeg", "image/png"}:
        raise HTTPException(status_code=415, detail="Only PDF, JPEG, and PNG files are supported.")
    document = MedicalDocument(patient_id=user.id, title=title.strip(), category=category.strip(), document_date=document_date, notes=notes.strip(), file_name=file.filename or "document", file_type=file.content_type, file_size=len(data), file_data=data)
    database.add(document)
    database.commit()
    database.refresh(document)
    return document_metadata(document)


def can_doctor_access_document(database: Session, doctor_id: int, document_id: int) -> bool:
    appointments = database.scalars(select(Appointment).where(Appointment.doctor_id == doctor_id)).all()
    return any(document_id in [item.get("id") for item in (appointment.shared_snapshot.get("medicalDocuments") or [])] for appointment in appointments)


@router.get("/documents/{document_id}/content")
def document_content(document_id: int, user: CurrentUser, database: Db):
    document = database.get(MedicalDocument, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    allowed = document.patient_id == user.id or (user.role == "doctor" and can_doctor_access_document(database, user.id, document_id))
    if not allowed:
        raise HTTPException(status_code=403, detail="This document was not shared with you.")
    return Response(content=document.file_data, media_type=document.file_type, headers={"Content-Disposition": f'inline; filename="{document.file_name}"'})


@router.delete("/documents/{document_id}", status_code=204)
def delete_document(document_id: int, user: CurrentUser, database: Db):
    document = database.get(MedicalDocument, document_id)
    if not document or document.patient_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found.")
    database.delete(document)
    database.commit()
    return Response(status_code=204)


@router.get("/patient/dashboard")
def patient_dashboard(user: CurrentUser, database: Db):
    require_role(user, "patient")
    wearable = wearable_state(user, database)
    appointments = database.scalars(select(Appointment).where(Appointment.patient_id == user.id).order_by(Appointment.created_at.desc()).limit(5)).all()
    symptoms = database.scalars(select(SymptomRecord).where(SymptomRecord.patient_id == user.id, SymptomRecord.archived.is_(False))).all()
    return {"wearable": wearable, "appointments": [appointment_dict(database, item) for item in appointments], "activeSymptomCount": len([item for item in symptoms if item.status == "Ongoing"])}


@router.get("/doctor/dashboard")
def doctor_dashboard(user: CurrentUser, database: Db):
    require_role(user, "doctor")
    appointments = database.scalars(select(Appointment).where(Appointment.doctor_id == user.id).order_by(Appointment.created_at.desc())).all()
    patients = doctor_patients(user, database)
    shared_alerts = []
    for appointment in appointments:
        for alert in appointment.shared_snapshot.get("alerts") or []:
            shared_alerts.append({**alert, "patient": appointment_dict(database, appointment)["patient"]})
    return {"appointments": [appointment_dict(database, item) for item in appointments[:8]], "patientCount": len(patients), "pendingCount": len([item for item in appointments if item.status == "Pending review"]), "acceptedCount": len([item for item in appointments if item.status == "Accepted"]), "sharedAlerts": shared_alerts[:10]}
