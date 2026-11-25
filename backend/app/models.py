from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean, CheckConstraint, Date, DateTime, Float, ForeignKey, Integer,
    LargeBinary, Numeric, String, Text, UniqueConstraint, JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('patient', 'doctor')", name="ck_users_role"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    specialization: Mapped[str | None] = mapped_column(String(120), nullable=True)
    registration_number: Mapped[str | None] = mapped_column(
        String(100), unique=True, nullable=True
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    doctor_profile: Mapped["DoctorProfile | None"] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    hospital: Mapped[str] = mapped_column(String(180), default="VitalSync Demo Clinic")
    city: Mapped[str] = mapped_column(String(120), default="")
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    consultation_fee: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    bio: Mapped[str] = mapped_column(Text, default="")
    availability: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    user: Mapped[User] = relationship(back_populates="doctor_profile")


class SymptomRecord(Base):
    __tablename__ = "symptom_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    symptoms: Mapped[list] = mapped_column(JSON, default=list)
    severity: Mapped[int] = mapped_column(Integer)
    onset_date: Mapped[date] = mapped_column(Date)
    duration: Mapped[str] = mapped_column(String(80), default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="Ongoing")
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class WearableDevice(Base):
    __tablename__ = "wearable_devices"
    __table_args__ = (UniqueConstraint("patient_id", name="uq_wearable_patient"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(120), default="VitalSync Demo Band")
    status: Mapped[str] = mapped_column(String(30), default="connected")
    scenario: Mapped[str] = mapped_column(String(40), default="normal")
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class WearableReading(Base):
    __tablename__ = "wearable_readings"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    heart_rate: Mapped[int] = mapped_column(Integer)
    spo2: Mapped[float] = mapped_column(Float)
    body_temperature: Mapped[float] = mapped_column(Float)
    steps: Mapped[int] = mapped_column(Integer)
    sleep_hours: Mapped[float] = mapped_column(Float)
    systolic: Mapped[int] = mapped_column(Integer)
    diastolic: Mapped[int] = mapped_column(Integer)
    scenario: Mapped[str] = mapped_column(String(40), default="normal")


class AnomalyAlert(Base):
    __tablename__ = "anomaly_alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    reading_id: Mapped[int] = mapped_column(ForeignKey("wearable_readings.id"))
    metric: Mapped[str] = mapped_column(String(60))
    observed_value: Mapped[float] = mapped_column(Float)
    threshold: Mapped[str] = mapped_column(String(120))
    severity: Mapped[str] = mapped_column(String(30))
    message: Mapped[str] = mapped_column(Text)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class MedicalDocument(Base):
    __tablename__ = "medical_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(180))
    category: Mapped[str] = mapped_column(String(80))
    document_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    file_name: Mapped[str] = mapped_column(String(255))
    file_type: Mapped[str] = mapped_column(String(120))
    file_size: Mapped[int] = mapped_column(Integer)
    file_data: Mapped[bytes] = mapped_column(LargeBinary)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    facility_name: Mapped[str] = mapped_column(String(180))
    facility_type: Mapped[str] = mapped_column(String(80), default="Healthcare facility")
    city: Mapped[str] = mapped_column(String(180), default="")
    address: Mapped[str] = mapped_column(String(300), default="")
    appointment_date: Mapped[date] = mapped_column(Date)
    appointment_time: Mapped[str] = mapped_column(String(20))
    reason: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="Pending review")
    consent: Mapped[dict] = mapped_column(JSON, default=dict)
    shared_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ClinicalMessage(Base):
    __tablename__ = "clinical_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class ConsultationNote(Base):
    __tablename__ = "consultation_notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class CarePlan(Base):
    __tablename__ = "care_plans"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(160))
    details: Mapped[str] = mapped_column(Text)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="Active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    model: Mapped[str | None] = mapped_column(String(160), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class ChatCitation(Base):
    __tablename__ = "chat_citations"

    id: Mapped[int] = mapped_column(primary_key=True)
    message_id: Mapped[int] = mapped_column(ForeignKey("chat_messages.id"), index=True)
    source_label: Mapped[str] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(String(240))
    source_url: Mapped[str] = mapped_column(String(800))
    source_organization: Mapped[str] = mapped_column(String(120))
    retrieval_score: Mapped[float] = mapped_column(Float)


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"
    __table_args__ = (
        UniqueConstraint("document_slug", "chunk_key", name="uq_knowledge_chunk"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    document_slug: Mapped[str] = mapped_column(String(120), index=True)
    chunk_key: Mapped[str] = mapped_column(String(120))
    title: Mapped[str] = mapped_column(String(240))
    source_organization: Mapped[str] = mapped_column(String(120))
    source_url: Mapped[str] = mapped_column(String(800))
    source_updated: Mapped[str] = mapped_column(String(40), default="")
    reviewed_at: Mapped[str] = mapped_column(String(40), default="")
    keywords: Mapped[str] = mapped_column(Text, default="")
    content: Mapped[str] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
